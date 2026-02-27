import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/layout';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Package, 
  FileText,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAuth } from '@/contexts/AuthContext';
import { sendStatusNotification } from '@/lib/email/notify';

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  destination_country: string;
  shipment_type: string;
  actual_weight_kg: number;
  international_awb: string;
}

type CarrierType = 'DHL' | 'FedEx' | 'Aramex';

export default function OutboundManifest() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCarrier, setActiveCarrier] = useState<CarrierType>('DHL');
  
  const { toast } = useToast();
  const { playSuccess } = useSoundEffects();
  const { user } = useAuth();

  useEffect(() => {
    const fetchShipments = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('shipments')
          .select('*')
          .eq('current_status', 'DISPATCH_APPROVED')
          .order('created_at', { ascending: true });
        if (error) throw error;
        setShipments(data || []);
      } catch (error) {
        console.error('Error fetching shipments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShipments();
  }, []);

  const getCarrierSuggestion = (country: string): CarrierType => {
    const euCountries = ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'UK', 'United Kingdom'];
    const meCountries = ['UAE', 'Saudi Arabia', 'Qatar', 'Oman', 'Kuwait', 'Bahrain'];
    if (euCountries.some(c => country.toLowerCase().includes(c.toLowerCase()))) return 'DHL';
    if (meCountries.some(c => country.toLowerCase().includes(c.toLowerCase()))) return 'Aramex';
    return 'FedEx';
  };

  const carrierShipments = shipments.filter(s => getCarrierSuggestion(s.destination_country) === activeCarrier);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === carrierShipments.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(carrierShipments.map(s => s.id)));
  };

  const handleGenerateManifest = async () => {
    if (selectedIds.size === 0 || !user) return;
    setIsGenerating(true);
    try {
      const { data: manifest, error: manifestError } = await supabase
        .from('dispatch_manifests')
        .insert([{ carrier: activeCarrier, shipment_count: selectedIds.size, created_by: user.id, dispatched_at: new Date().toISOString(), manifest_number: `MAN-${Date.now()}` }])
        .select().single();
      if (manifestError) throw manifestError;
      const manifestItems = Array.from(selectedIds).map(shipmentId => ({ manifest_id: manifest.id, shipment_id: shipmentId }));
      const { error: itemsError } = await supabase.from('manifest_items').insert(manifestItems);
      if (itemsError) throw itemsError;
      const { error: updateError } = await supabase.from('shipments').update({ status: 'dispatched' }).in('id', Array.from(selectedIds));
      if (updateError) throw updateError;
      playSuccess();
      toast({ title: 'Manifest Generated!', description: `${manifest.manifest_number} created with ${selectedIds.size} shipments.` });
      // Fire-and-forget email notifications for all dispatched shipments
      for (const id of selectedIds) {
        sendStatusNotification(id, 'in_transit').catch(() => {});
      }
      setSelectedIds(new Set());
      setShipments(prev => prev.filter(s => !selectedIds.has(s.id)));
    } catch (error) {
      console.error('Error generating manifest:', error);
      toast({ title: 'Error', description: 'Failed to generate manifest.', variant: 'destructive' });
    } finally { setIsGenerating(false); }
  };

  const carriers: { id: CarrierType; name: string; color: string }[] = [
    { id: 'DHL', name: 'DHL Express', color: 'bg-yellow-500' },
    { id: 'FedEx', name: 'FedEx', color: 'bg-purple-600' },
    { id: 'Aramex', name: 'Aramex', color: 'bg-orange-500' },
  ];

  const getCarrierCount = (carrier: CarrierType) => shipments.filter(s => getCarrierSuggestion(s.destination_country) === carrier).length;

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Outbound Manifest</h1>
            <p className="text-gray-400">Generate dispatch manifests for carriers</p>
          </div>
          <span className="self-start px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/10 text-gray-300">
            {shipments.length} Ready to Dispatch
          </span>
        </div>

        {/* Carrier Tabs */}
        <div className="flex gap-3">
          {carriers.map(carrier => (
            <button
              key={carrier.id}
              onClick={() => { setActiveCarrier(carrier.id); setSelectedIds(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCarrier === carrier.id
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                  : 'bg-white/10 border border-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${carrier.color}`} />
              {carrier.name}
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/10">{getCarrierCount(carrier.id)}</span>
            </button>
          ))}
        </div>

        {/* Shipments List */}
        <div className="bg-[#16161a] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h3 className="text-white font-semibold">{activeCarrier} Shipments</h3>
              <p className="text-xs text-gray-500">Select shipments to include in manifest</p>
            </div>
            {carrierShipments.length > 0 && (
              <button onClick={handleSelectAll} className="px-4 py-2 text-sm rounded-xl bg-white/10 border border-white/10 text-gray-300 hover:bg-white/20 transition-colors">
                {selectedIds.size === carrierShipments.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-16 w-full bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : carrierShipments.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-white font-semibold mb-1">No Shipments</h3>
                <p className="text-gray-500 text-sm">No shipments ready for {activeCarrier} dispatch</p>
              </div>
            ) : (
              <div className="space-y-2">
                {carrierShipments.map((shipment) => (
                  <label
                    key={shipment.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedIds.has(shipment.id)
                        ? 'border-red-500 bg-red-500/5'
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <Checkbox checked={selectedIds.has(shipment.id)} onCheckedChange={() => handleToggleSelect(shipment.id)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium text-white">{shipment.tracking_number || 'No tracking'}</p>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 border border-white/10 text-gray-400 capitalize">{shipment.shipment_type}</span>
                      </div>
                      <p className="text-sm text-gray-400">{shipment.recipient_name} • {shipment.destination_country}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{shipment.actual_weight_kg || '?'} kg</p>
                      {shipment.international_awb && <p className="text-xs text-gray-500">{shipment.international_awb}</p>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generate Manifest Button */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:right-6 lg:translate-x-0 z-50">
            <button
              onClick={handleGenerateManifest}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50 transition-all"
            >
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
              Generate Manifest ({selectedIds.size})
            </button>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
