import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Skeleton } from '@/components/ui/skeleton';

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
          .eq('status', 'qc_passed')
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

  // Group shipments by suggested carrier based on destination
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === carrierShipments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(carrierShipments.map(s => s.id)));
    }
  };

  const handleGenerateManifest = async () => {
    if (selectedIds.size === 0 || !user) return;

    setIsGenerating(true);
    try {
      // Create manifest
      const { data: manifest, error: manifestError } = await supabase
        .from('dispatch_manifests')
        .insert([{
          carrier: activeCarrier,
          shipment_count: selectedIds.size,
          created_by: user.id,
          dispatched_at: new Date().toISOString(),
          manifest_number: `MAN-${Date.now()}`,
        }])
        .select()
        .single();

      if (manifestError) throw manifestError;

      // Add manifest items
      const manifestItems = Array.from(selectedIds).map(shipmentId => ({
        manifest_id: manifest.id,
        shipment_id: shipmentId,
      }));

      const { error: itemsError } = await supabase
        .from('manifest_items')
        .insert(manifestItems);

      if (itemsError) throw itemsError;

      // Update shipment statuses
      const { error: updateError } = await supabase
        .from('shipments')
        .update({ status: 'dispatched' })
        .in('id', Array.from(selectedIds));

      if (updateError) throw updateError;

      playSuccess();
      toast({
        title: 'Manifest Generated!',
        description: `${manifest.manifest_number} created with ${selectedIds.size} shipments.`,
      });

      // Refresh data
      setSelectedIds(new Set());
      setShipments(prev => prev.filter(s => !selectedIds.has(s.id)));
    } catch (error) {
      console.error('Error generating manifest:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate manifest.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const carriers: { id: CarrierType; name: string; color: string }[] = [
    { id: 'DHL', name: 'DHL Express', color: 'bg-yellow-500' },
    { id: 'FedEx', name: 'FedEx', color: 'bg-purple-600' },
    { id: 'Aramex', name: 'Aramex', color: 'bg-orange-500' },
  ];

  const getCarrierCount = (carrier: CarrierType) => 
    shipments.filter(s => getCarrierSuggestion(s.destination_country) === carrier).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-typewriter font-bold">Outbound Manifest</h1>
            <p className="text-muted-foreground">Generate dispatch manifests for carriers</p>
          </div>
          <Badge variant="outline" className="self-start">
            {shipments.length} Ready to Dispatch
          </Badge>
        </div>

        {/* Carrier Tabs */}
        <div className="flex gap-3">
          {carriers.map(carrier => (
            <Button
              key={carrier.id}
              variant={activeCarrier === carrier.id ? 'default' : 'outline'}
              onClick={() => {
                setActiveCarrier(carrier.id);
                setSelectedIds(new Set());
              }}
              className="relative"
            >
              <div className={`w-3 h-3 rounded-full ${carrier.color} mr-2`} />
              {carrier.name}
              <Badge variant="secondary" className="ml-2">
                {getCarrierCount(carrier.id)}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Shipments List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-typewriter">{activeCarrier} Shipments</CardTitle>
              <CardDescription>Select shipments to include in manifest</CardDescription>
            </div>
            {carrierShipments.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedIds.size === carrierShipments.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : carrierShipments.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold mb-1">No Shipments</h3>
                <p className="text-muted-foreground text-sm">
                  No shipments ready for {activeCarrier} dispatch
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {carrierShipments.map((shipment) => (
                  <label
                    key={shipment.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedIds.has(shipment.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={selectedIds.has(shipment.id)}
                      onCheckedChange={() => handleToggleSelect(shipment.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-typewriter font-medium">
                          {shipment.tracking_number || 'No tracking'}
                        </p>
                        <Badge variant="outline" className="capitalize text-xs">
                          {shipment.shipment_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {shipment.recipient_name} • {shipment.destination_country}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{shipment.actual_weight_kg || '?'} kg</p>
                      {shipment.international_awb && (
                        <p className="text-xs text-muted-foreground">{shipment.international_awb}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Manifest Button */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:right-6 lg:translate-x-0">
            <Button
              onClick={handleGenerateManifest}
              disabled={isGenerating}
              size="lg"
              className="btn-press shadow-lg"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <FileText className="h-5 w-5 mr-2" />
              )}
              Generate Manifest ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
