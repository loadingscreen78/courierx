"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/layout';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  ArrowLeft,
  Scale,
  Ruler,
  Calculator,
  Loader2,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAction, AdminActionType } from '@/hooks/useAdminAction';
import { useShipmentTimeline } from '@/hooks/useShipmentTimeline';
import { ShipmentTimeline } from '@/components/shipment/ShipmentTimeline';
import { getStatusLabel, getStatusDotColor, getLegLabel } from '@/lib/shipment-lifecycle/statusLabelMap';
import { ShipmentStatus, ShipmentLeg } from '@/lib/shipment-lifecycle/types';

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  destination_country: string;
  shipment_type: string;
  status: string;
  current_status: ShipmentStatus;
  current_leg: ShipmentLeg;
  version: number;
  domestic_awb: string | null;
  international_awb: string | null;
  weight_kg: number;
  declared_value: number;
  notes: string;
  user_id: string;
  pickup_address: any;
  consignee_address: any;
  total_amount: number;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
    phone: string;
  };
  medicine_items?: Array<{
    medicine_name: string;
    medicine_type: string;
    category: string;
    form: string;
    unit_count: number;
    unit_price: number;
    daily_dosage: number;
    batch_number: string;
  }>;
}

interface QCChecklist {
  passport_name_match: boolean;
  prescription_patient_match: boolean;
  bill_patient_match: boolean;
  is_narcotic: boolean;
  bill_date_valid: boolean;
  actual_unit_count: number;
  daily_dosage: number;
  days_supply_calculated: number;
  days_supply_compliant: boolean;
  final_weight_kg: number;
  dimensions_length_cm: number;
  dimensions_width_cm: number;
  dimensions_height_cm: number;
}

export default function QCDetail() {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { playSuccess, playError } = useSoundEffects();
  const { user } = useAuth();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const { performAction, performDispatch, loading: actionLoading, rateLimitedUntil } = useAdminAction();
  const { entries: timelineEntries, loading: timelineLoading } = useShipmentTimeline(shipmentId);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number>(0);

  const [checklist, setChecklist] = useState<QCChecklist>({
    passport_name_match: false,
    prescription_patient_match: false,
    bill_patient_match: false,
    is_narcotic: false,
    bill_date_valid: false,
    actual_unit_count: 0,
    daily_dosage: 1,
    days_supply_calculated: 0,
    days_supply_compliant: true,
    final_weight_kg: 0,
    dimensions_length_cm: 0,
    dimensions_width_cm: 0,
    dimensions_height_cm: 0,
  });

  const refreshShipment = useCallback(async () => {
    if (!shipmentId) return;
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`*, profiles:user_id (full_name, email, phone)`)
        .eq('id', shipmentId)
        .single();
      if (error) throw error;
      if (data.shipment_type === 'medicine') {
        const { data: medicineItems, error: medError } = await supabase
          .from('medicine_items')
          .select('*')
          .eq('shipment_id', shipmentId);
        if (!medError) data.medicine_items = medicineItems;
      }
      setShipment(data);
    } catch (error) {
      console.error('Error refreshing shipment:', error);
    }
  }, [shipmentId]);

  useEffect(() => {
    const fetchShipment = async () => {
      if (!shipmentId) return;
      try {
        const { data, error } = await supabase
          .from('shipments')
          .select(`*, profiles:user_id (full_name, email, phone)`)
          .eq('id', shipmentId)
          .single();
        if (error) throw error;
        if (data.shipment_type === 'medicine') {
          const { data: medicineItems, error: medError } = await supabase
            .from('medicine_items')
            .select('*')
            .eq('shipment_id', shipmentId);
          if (!medError) data.medicine_items = medicineItems;
        }
        setShipment(data);
        if (data.weight_kg) setChecklist(prev => ({ ...prev, final_weight_kg: data.weight_kg }));
      } catch (error) {
        console.error('Error fetching shipment:', error);
        toast({ title: 'Error', description: 'Failed to load shipment details.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchShipment();
  }, [shipmentId, toast]);

  // Realtime subscription for shipment row updates (status/leg/version changes)
  useEffect(() => {
    if (!shipmentId) return;
    const channel = supabase
      .channel(`shipment-detail-${shipmentId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'shipments',
        filter: `id=eq.${shipmentId}`,
      }, (payload) => {
        const updated = payload.new as Record<string, unknown>;
        // Ignore stale events where version is lower than current
        if (shipment && typeof updated.version === 'number' && updated.version < shipment.version) return;
        refreshShipment();
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[QCDetail] Channel error, will refresh on reconnect');
        }
        if (status === 'SUBSCRIBED') {
          // Re-fetch on reconnection to catch missed events
          refreshShipment();
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [shipmentId, shipment?.version, refreshShipment]);

  useEffect(() => {
    if (checklist.actual_unit_count > 0 && checklist.daily_dosage > 0) {
      const daysSupply = Math.floor(checklist.actual_unit_count / checklist.daily_dosage);
      setChecklist(prev => ({ ...prev, days_supply_calculated: daysSupply, days_supply_compliant: daysSupply <= 90 }));
    }
  }, [checklist.actual_unit_count, checklist.daily_dosage]);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitedUntil === null) { setRateLimitCountdown(0); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((rateLimitedUntil - Date.now()) / 1000));
      setRateLimitCountdown(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [rateLimitedUntil]);

  const isCounterLeg = shipment?.current_leg === 'COUNTER';
  const isReadOnly = shipment?.current_leg === 'INTERNATIONAL' || shipment?.current_leg === 'COMPLETED';
  const identityChecksPassed = checklist.passport_name_match && checklist.prescription_patient_match && checklist.bill_patient_match;

  const handleLifecycleAction = async (action: AdminActionType) => {
    if (!shipment) return;
    const result = await performAction(shipment.id, action, shipment.version);
    if (result.success) {
      playSuccess();
      toast({ title: 'Action completed', description: `${getStatusLabel(shipment.current_status)} → next step.` });
      await refreshShipment();
    } else if (result.errorCode === 'VERSION_CONFLICT') {
      toast({ title: 'Version conflict', description: 'This shipment was updated by another process. Refreshing...', variant: 'destructive' });
      await refreshShipment();
    } else if (result.errorCode === 'INVALID_TRANSITION') {
      playError();
      toast({ title: 'Invalid transition', description: result.error ?? 'This action is not valid for the current status.', variant: 'destructive' });
      await refreshShipment();
    } else if (result.retryAfterMs) {
      toast({ title: 'Rate limited', description: `Too many requests. Please wait ${Math.ceil(result.retryAfterMs / 1000)} seconds.`, variant: 'destructive' });
    } else {
      playError();
      toast({ title: 'Error', description: result.error ?? 'Action failed.', variant: 'destructive' });
    }
  };

  const handleDispatch = async () => {
    if (!shipment) return;
    const result = await performDispatch(shipment.id, shipment.version);
    if (result.success) {
      playSuccess();
      toast({ title: 'Dispatched', description: 'Shipment dispatched internationally.' });
      await refreshShipment();
    } else if (result.errorCode === 'VERSION_CONFLICT') {
      toast({ title: 'Version conflict', description: 'This shipment was updated by another process. Refreshing...', variant: 'destructive' });
      await refreshShipment();
    } else if (result.errorCode === 'INVALID_TRANSITION') {
      playError();
      toast({ title: 'Invalid transition', description: result.error ?? 'Cannot dispatch at this time.', variant: 'destructive' });
      await refreshShipment();
    } else if (result.retryAfterMs) {
      toast({ title: 'Rate limited', description: `Too many requests. Please wait ${Math.ceil(result.retryAfterMs / 1000)} seconds.`, variant: 'destructive' });
    } else {
      playError();
      toast({ title: 'Error', description: result.error ?? 'Dispatch failed.', variant: 'destructive' });
    }
  };

  const isRateLimited = rateLimitedUntil !== null && Date.now() < rateLimitedUntil;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-white/5 rounded-[2rem] animate-pulse" />
          <div className="grid grid-cols-3 gap-6">
            <div className="h-96 bg-white/5 rounded-[2rem] animate-pulse" />
            <div className="h-96 bg-white/5 rounded-[2rem] animate-pulse" />
            <div className="h-96 bg-white/5 rounded-[2rem] animate-pulse" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!shipment) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-400">Shipment not found</p>
          <button onClick={() => router.push('/admin/qc')} className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors">
            Back to QC Workbench
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/qc')} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">QC: {shipment.tracking_number || 'No Tracking'}</h1>
            <p className="text-gray-400">{shipment.recipient_name} • {shipment.destination_country}</p>
          </div>
          <span className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/10 text-gray-300 capitalize">{shipment.shipment_type}</span>
          {shipment.current_status && (
            <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/10 text-gray-300">
              <span className={`h-2 w-2 rounded-full ${getStatusDotColor(shipment.current_status)}`} />
              {getStatusLabel(shipment.current_status)}
            </span>
          )}
          {shipment.current_leg && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/10 text-gray-300">
              {getLegLabel(shipment.current_leg)}
            </span>
          )}
        </div>

        {/* User & Shipment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#16161a] rounded-[2rem] border border-white/5 p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-4">User Information</h3>
            <div className="space-y-3">
              <div><p className="text-xs text-gray-500">Name</p><p className="text-white font-medium">{shipment.profiles?.full_name || 'Unknown'}</p></div>
              <div><p className="text-xs text-gray-500">Email</p><p className="text-gray-300 text-sm">{shipment.profiles?.email || 'No email'}</p></div>
              <div><p className="text-xs text-gray-500">Phone</p><p className="text-gray-300 text-sm">{shipment.profiles?.phone || 'No phone'}</p></div>
              <div><p className="text-xs text-gray-500">Booking Date</p><p className="text-gray-300 text-sm">{new Date(shipment.created_at).toLocaleString()}</p></div>
            </div>
          </div>
          <div className="bg-[#16161a] rounded-[2rem] border border-white/5 p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-4">Shipment Details</h3>
            <div className="space-y-3">
              <div><p className="text-xs text-gray-500">Tracking Number</p><p className="text-white font-medium font-mono">{shipment.tracking_number || 'Not assigned'}</p></div>
              <div><p className="text-xs text-gray-500">Type</p><p className="text-gray-300 capitalize">{shipment.shipment_type}</p></div>
              <div><p className="text-xs text-gray-500">Total Amount</p><p className="text-white font-medium">₹{shipment.total_amount?.toLocaleString() || '0'}</p></div>
              <div><p className="text-xs text-gray-500">Declared Value</p><p className="text-white font-medium">₹{shipment.declared_value?.toLocaleString() || '0'}</p></div>
              {shipment.domestic_awb && (
                <div><p className="text-xs text-gray-500">Domestic AWB</p><p className="text-white font-medium font-mono">{shipment.domestic_awb}</p></div>
              )}
              {shipment.international_awb && (shipment.current_leg === 'INTERNATIONAL' || shipment.current_leg === 'COMPLETED') && (
                <div><p className="text-xs text-gray-500">International AWB</p><p className="text-white font-medium font-mono">{shipment.international_awb}</p></div>
              )}
            </div>
          </div>
        </div>

        {/* Medicine Items */}
        {shipment.shipment_type === 'medicine' && shipment.medicine_items && shipment.medicine_items.length > 0 && (
          <div className="bg-[#16161a] rounded-[2rem] border border-white/5 p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-1">Medicine Items</h3>
            <p className="text-xs text-gray-500 mb-4">{shipment.medicine_items.length} item(s) in this shipment</p>
            <div className="space-y-3">
              {shipment.medicine_items.map((item, index) => (
                <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-medium">{item.medicine_name}</p>
                      <p className="text-xs text-gray-500">{item.medicine_type} • {item.category} • {item.form}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 border border-white/10 text-gray-300">{item.unit_count} units</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-gray-500">Unit Price</p><p className="text-white font-medium">₹{item.unit_price}</p></div>
                    <div><p className="text-gray-500">Daily Dosage</p><p className="text-white font-medium">{item.daily_dosage}/day</p></div>
                    <div><p className="text-gray-500">Supply</p><p className="text-white font-medium">{item.daily_dosage > 0 ? Math.ceil(item.unit_count / item.daily_dosage) : 0} days</p></div>
                  </div>
                  {item.batch_number && (
                    <div className="text-xs"><span className="text-gray-500">Batch: </span><span className="font-mono text-gray-300">{item.batch_number}</span></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#16161a] rounded-[2rem] border border-white/5 p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-4">Pickup Address</h3>
            {shipment.pickup_address ? (
              <div className="text-sm space-y-1 text-gray-300">
                <p className="text-white font-medium">{shipment.pickup_address.fullName}</p>
                <p>{shipment.pickup_address.phone}</p>
                <p>{shipment.pickup_address.addressLine1}</p>
                {shipment.pickup_address.addressLine2 && <p>{shipment.pickup_address.addressLine2}</p>}
                <p>{shipment.pickup_address.city}, {shipment.pickup_address.state} {shipment.pickup_address.pincode}</p>
              </div>
            ) : <p className="text-sm text-gray-500">No pickup address</p>}
          </div>
          <div className="bg-[#16161a] rounded-[2rem] border border-white/5 p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-4">Consignee Address</h3>
            {shipment.consignee_address ? (
              <div className="text-sm space-y-1 text-gray-300">
                <p className="text-white font-medium">{shipment.consignee_address.fullName}</p>
                <p>{shipment.consignee_address.phone}</p>
                {shipment.consignee_address.email && <p>{shipment.consignee_address.email}</p>}
                <p>{shipment.consignee_address.addressLine1}</p>
                {shipment.consignee_address.addressLine2 && <p>{shipment.consignee_address.addressLine2}</p>}
                <p>{shipment.consignee_address.city}, {shipment.consignee_address.zipcode}</p>
                <p className="text-white font-medium">{shipment.consignee_address.country}</p>
                {shipment.consignee_address.passportNumber && (
                  <p className="text-xs text-gray-500">Passport: {shipment.consignee_address.passportNumber}</p>
                )}
              </div>
            ) : <p className="text-sm text-gray-500">No consignee address</p>}
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Document Viewer */}
          <div className="bg-[#16161a] rounded-[2rem] border border-white/5 p-6 shadow-2xl lg:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-semibold text-white">Documents</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">Review uploaded documents</p>
            <Tabs defaultValue="prescription" className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-white/5 border border-white/10 rounded-xl p-1">
                <TabsTrigger value="prescription" className="text-xs rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400">Rx</TabsTrigger>
                <TabsTrigger value="bill" className="text-xs rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400">Bill</TabsTrigger>
                <TabsTrigger value="passport" className="text-xs rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400">ID</TabsTrigger>
              </TabsList>
              <TabsContent value="prescription" className="mt-4">
                <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Prescription Preview</p>
                </div>
              </TabsContent>
              <TabsContent value="bill" className="mt-4">
                <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Pharmacy Bill Preview</p>
                </div>
              </TabsContent>
              <TabsContent value="passport" className="mt-4">
                <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Passport/ID Preview</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Column 2: Validation Checklist */}
          <div className="bg-[#16161a] rounded-[2rem] border border-white/5 p-6 shadow-2xl lg:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-semibold text-white">Validation Checklist</h3>
            </div>
            <p className="text-xs text-gray-500 mb-6">Three-way identity match & safety</p>

            {/* Identity Checks */}
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                Identity Verification
                {identityChecksPassed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
              </h4>
              <div className="space-y-1">
                {[
                  { key: 'passport_name_match' as const, label: 'Passport name matches booking?' },
                  { key: 'prescription_patient_match' as const, label: 'Prescription patient = passport?' },
                  { key: 'bill_patient_match' as const, label: 'Bill patient = passport?' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                    <Checkbox checked={checklist[key]} onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, [key]: !!checked }))} />
                    <span className="text-sm text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Safety Checks */}
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-semibold text-white">Safety Verification</h4>
              <div className="space-y-1">
                <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                  <Checkbox checked={checklist.is_narcotic} onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, is_narcotic: !!checked }))} />
                  <span className="text-sm text-red-400">⚠️ Narcotic/Psychotropic?</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                  <Checkbox checked={checklist.bill_date_valid} onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, bill_date_valid: !!checked }))} />
                  <span className="text-sm text-gray-300">Bill date within prescription duration?</span>
                </label>
              </div>
            </div>

            {/* Quantity Check */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2"><Calculator className="h-4 w-4" /> Quantity Verification</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Unit Count</label>
                  <input type="number" value={checklist.actual_unit_count || ''} onChange={(e) => setChecklist(prev => ({ ...prev, actual_unit_count: parseInt(e.target.value) || 0 }))} placeholder="e.g., 200" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-red-500 focus:outline-none transition-colors text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Daily Dosage</label>
                  <input type="number" value={checklist.daily_dosage || ''} onChange={(e) => setChecklist(prev => ({ ...prev, daily_dosage: parseInt(e.target.value) || 1 }))} placeholder="e.g., 2" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-red-500 focus:outline-none transition-colors text-sm" />
                </div>
              </div>
              {checklist.days_supply_calculated > 0 && (
                <div className={`p-3 rounded-xl ${checklist.days_supply_compliant ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <p className="text-sm font-medium text-white">Days Supply: {checklist.days_supply_calculated} days</p>
                  {!checklist.days_supply_compliant && (
                    <p className="text-xs text-red-400 mt-1">⚠️ Exceeds 90-day limit. Remove {Math.ceil(checklist.actual_unit_count - (90 * checklist.daily_dosage))} units.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Physical & Actions */}
          <div className="bg-[#16161a] rounded-[2rem] border border-white/5 p-6 shadow-2xl lg:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-semibold text-white">Physical Verification</h3>
            </div>
            <p className="text-xs text-gray-500 mb-6">Weight, dimensions & final decision</p>

            {/* Weight */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Final Weight (kg)</label>
                <span className="text-xs text-gray-500">Declared: {shipment.weight_kg || '?'} kg</span>
              </div>
              <input type="number" step="0.1" value={checklist.final_weight_kg || ''} onChange={(e) => setChecklist(prev => ({ ...prev, final_weight_kg: parseFloat(e.target.value) || 0 }))} placeholder="0.0" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-mono placeholder:text-gray-600 focus:border-red-500 focus:outline-none transition-colors" />
            </div>

            {/* Dimensions */}
            <div className="space-y-3 mb-6">
              <label className="text-sm text-gray-300 flex items-center gap-2"><Ruler className="h-4 w-4" /> Dimensions (cm)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'dimensions_length_cm' as const, label: 'Length', ph: 'L' },
                  { key: 'dimensions_width_cm' as const, label: 'Width', ph: 'W' },
                  { key: 'dimensions_height_cm' as const, label: 'Height', ph: 'H' },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <input type="number" value={checklist[key] || ''} onChange={(e) => setChecklist(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))} placeholder={ph} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-red-500 focus:outline-none transition-colors text-sm" />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rejection Reason */}
            <div className="space-y-2 mb-6">
              <label className="text-sm text-gray-300">Rejection Reason (if applicable)</label>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Describe issue if rejecting..." rows={3} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-red-500 focus:outline-none transition-colors text-sm resize-none" />
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              {isCounterLeg && (
                <>
                  <button
                    onClick={() => handleLifecycleAction('quality_check')}
                    disabled={shipment.current_status !== 'ARRIVED_AT_WAREHOUSE' || actionLoading || isRateLimited}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-[0_0_15px_rgba(217,119,6,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading && shipment.current_status === 'ARRIVED_AT_WAREHOUSE' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Quality Check
                  </button>
                  <button
                    onClick={() => handleLifecycleAction('package')}
                    disabled={shipment.current_status !== 'QUALITY_CHECKED' || actionLoading || isRateLimited}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-[0_0_15px_rgba(217,119,6,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading && shipment.current_status === 'QUALITY_CHECKED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Package
                  </button>
                  <button
                    onClick={() => handleLifecycleAction('approve_dispatch')}
                    disabled={shipment.current_status !== 'PACKAGED' || actionLoading || isRateLimited}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading && shipment.current_status === 'PACKAGED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve Dispatch
                  </button>
                  <button
                    onClick={handleDispatch}
                    disabled={shipment.current_status !== 'DISPATCH_APPROVED' || actionLoading || isRateLimited}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading && shipment.current_status === 'DISPATCH_APPROVED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Dispatch Internationally
                  </button>
                  {isRateLimited && (
                    <p className="text-xs text-amber-400 text-center flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      Rate limited. {rateLimitCountdown > 0 ? `Retry in ${rateLimitCountdown}s` : 'Please wait...'}
                    </p>
                  )}
                </>
              )}
              {!isCounterLeg && (
                <p className="text-xs text-gray-500 text-center">
                  {shipment.current_leg === 'INTERNATIONAL' ? 'Shipment is in international transit — no actions available.' :
                   shipment.current_leg === 'COMPLETED' ? 'Shipment delivered — no actions available.' :
                   'No actions available for this shipment phase.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Shipment Timeline */}
        <div className="bg-[#16161a] rounded-[2rem] border border-white/5 p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold text-white">Shipment Timeline</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Full history of status changes across all phases</p>
          <ShipmentTimeline entries={timelineEntries} loading={timelineLoading} />
        </div>
      </motion.div>
    </AdminLayout>
  );
}
