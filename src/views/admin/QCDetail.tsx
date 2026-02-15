"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Scale,
  Ruler,
  Calculator,
  Loader2
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
  status: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

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

  useEffect(() => {
    const fetchShipment = async () => {
      if (!shipmentId) return;

      try {
        const { data, error } = await supabase
          .from('shipments')
          .select(`
            *,
            profiles:user_id (
              full_name,
              email,
              phone
            )
          `)
          .eq('id', shipmentId)
          .single();

        if (error) throw error;

        // Fetch medicine items if it's a medicine shipment
        if (data.shipment_type === 'medicine') {
          const { data: medicineItems, error: medError } = await supabase
            .from('medicine_items')
            .select('*')
            .eq('shipment_id', shipmentId);

          if (!medError) {
            data.medicine_items = medicineItems;
          }
        }

        setShipment(data);

        // Initialize checklist with existing weight
        if (data.weight_kg) {
          setChecklist(prev => ({ ...prev, final_weight_kg: data.weight_kg }));
        }

        // Mark as in progress if at warehouse
        if (data.status === 'at_warehouse') {
          await supabase
            .from('shipments')
            .update({ status: 'qc_in_progress' })
            .eq('id', shipmentId);
        }
      } catch (error) {
        console.error('Error fetching shipment:', error);
        toast({
          title: 'Error',
          description: 'Failed to load shipment details.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchShipment();
  }, [shipmentId, toast]);

  // Calculate days supply when units or dosage changes
  useEffect(() => {
    if (checklist.actual_unit_count > 0 && checklist.daily_dosage > 0) {
      const daysSupply = Math.floor(checklist.actual_unit_count / checklist.daily_dosage);
      setChecklist(prev => ({
        ...prev,
        days_supply_calculated: daysSupply,
        days_supply_compliant: daysSupply <= 90,
      }));
    }
  }, [checklist.actual_unit_count, checklist.daily_dosage]);

  const identityChecksPassed = 
    checklist.passport_name_match && 
    checklist.prescription_patient_match && 
    checklist.bill_patient_match;

  const canApprove = 
    identityChecksPassed && 
    !checklist.is_narcotic && 
    checklist.bill_date_valid &&
    checklist.days_supply_compliant &&
    checklist.final_weight_kg > 0;

  const handleApprove = async () => {
    if (!shipment || !user) return;

    setIsSaving(true);
    try {
      // Save QC checklist
      const { error: checklistError } = await supabase
        .from('qc_checklists')
        .upsert({
          shipment_id: shipment.id,
          operator_id: user.id,
          ...checklist,
          decision: 'APPROVED',
        });

      if (checklistError) throw checklistError;

      // Update shipment
      const { error: updateError } = await supabase
        .from('shipments')
        .update({
          status: 'qc_passed',
          actual_weight_kg: checklist.final_weight_kg,
          dimensions_length_cm: checklist.dimensions_length_cm,
          dimensions_width_cm: checklist.dimensions_width_cm,
          dimensions_height_cm: checklist.dimensions_height_cm,
          qc_operator_id: user.id,
          qc_completed_at: new Date().toISOString(),
        })
        .eq('id', shipment.id);

      if (updateError) throw updateError;

      playSuccess();
      toast({
        title: 'QC Approved!',
        description: 'Shipment passed quality control and is ready for dispatch.',
      });
      router.push('/admin/qc');
    } catch (error) {
      console.error('Error approving:', error);
      playError();
      toast({
        title: 'Error',
        description: 'Failed to approve shipment.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    if (!shipment || !user || !rejectionReason) return;

    setIsSaving(true);
    try {
      // Save QC checklist
      const { error: checklistError } = await supabase
        .from('qc_checklists')
        .upsert({
          shipment_id: shipment.id,
          operator_id: user.id,
          ...checklist,
          decision: 'REJECTED',
          rejection_reason: rejectionReason,
        });

      if (checklistError) throw checklistError;

      // Update shipment
      const { error: updateError } = await supabase
        .from('shipments')
        .update({
          status: 'qc_failed',
          qc_operator_id: user.id,
          qc_completed_at: new Date().toISOString(),
          qc_notes: rejectionReason,
        })
        .eq('id', shipment.id);

      if (updateError) throw updateError;

      playError();
      toast({
        title: 'QC Rejected',
        description: 'Shipment has been put on hold.',
        variant: 'destructive',
      });
      router.push('/admin/qc');
    } catch (error) {
      console.error('Error rejecting:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject shipment.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!shipment) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Shipment not found</p>
          <Button onClick={() => router.push('/admin/qc')} className="mt-4">
            Back to QC Workbench
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/qc')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-typewriter font-bold">
              QC: {shipment.tracking_number || 'No Tracking'}
            </h1>
            <p className="text-muted-foreground">
              {shipment.recipient_name} • {shipment.destination_country}
            </p>
          </div>
          <Badge variant="outline" className="ml-auto capitalize">
            {shipment.shipment_type}
          </Badge>
        </div>

        {/* User & Shipment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{shipment.profiles?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{shipment.profiles?.email || 'No email'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm">{shipment.profiles?.phone || 'No phone'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Booking Date</p>
                <p className="text-sm">{new Date(shipment.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Tracking Number</p>
                <p className="font-typewriter font-medium">{shipment.tracking_number || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="capitalize">{shipment.shipment_type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="font-medium">₹{shipment.total_amount?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Declared Value</p>
                <p className="font-medium">₹{shipment.declared_value?.toLocaleString() || '0'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medicine Items (if medicine shipment) */}
        {shipment.shipment_type === 'medicine' && shipment.medicine_items && shipment.medicine_items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medicine Items</CardTitle>
              <CardDescription>{shipment.medicine_items.length} item(s) in this shipment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shipment.medicine_items.map((item, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{item.medicine_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.medicine_type} • {item.category} • {item.form}
                        </p>
                      </div>
                      <Badge variant="outline">{item.unit_count} units</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Unit Price</p>
                        <p className="font-medium">₹{item.unit_price}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Daily Dosage</p>
                        <p className="font-medium">{item.daily_dosage}/day</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Supply</p>
                        <p className="font-medium">
                          {item.daily_dosage > 0 ? Math.ceil(item.unit_count / item.daily_dosage) : 0} days
                        </p>
                      </div>
                    </div>
                    {item.batch_number && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Batch: </span>
                        <span className="font-typewriter">{item.batch_number}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pickup Address</CardTitle>
            </CardHeader>
            <CardContent>
              {shipment.pickup_address ? (
                <div className="text-sm space-y-1">
                  <p className="font-medium">{shipment.pickup_address.fullName}</p>
                  <p>{shipment.pickup_address.phone}</p>
                  <p>{shipment.pickup_address.addressLine1}</p>
                  {shipment.pickup_address.addressLine2 && <p>{shipment.pickup_address.addressLine2}</p>}
                  <p>{shipment.pickup_address.city}, {shipment.pickup_address.state} {shipment.pickup_address.pincode}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No pickup address</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consignee Address</CardTitle>
            </CardHeader>
            <CardContent>
              {shipment.consignee_address ? (
                <div className="text-sm space-y-1">
                  <p className="font-medium">{shipment.consignee_address.fullName}</p>
                  <p>{shipment.consignee_address.phone}</p>
                  {shipment.consignee_address.email && <p>{shipment.consignee_address.email}</p>}
                  <p>{shipment.consignee_address.addressLine1}</p>
                  {shipment.consignee_address.addressLine2 && <p>{shipment.consignee_address.addressLine2}</p>}
                  <p>{shipment.consignee_address.city}, {shipment.consignee_address.zipcode}</p>
                  <p className="font-medium">{shipment.consignee_address.country}</p>
                  {shipment.consignee_address.passportNumber && (
                    <p className="text-xs text-muted-foreground">Passport: {shipment.consignee_address.passportNumber}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No consignee address</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Document Viewer */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-typewriter flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </CardTitle>
              <CardDescription>Review uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="prescription" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="prescription" className="text-xs">Rx</TabsTrigger>
                  <TabsTrigger value="bill" className="text-xs">Bill</TabsTrigger>
                  <TabsTrigger value="passport" className="text-xs">ID</TabsTrigger>
                </TabsList>
                <TabsContent value="prescription" className="mt-4">
                  <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Prescription Preview</p>
                  </div>
                </TabsContent>
                <TabsContent value="bill" className="mt-4">
                  <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Pharmacy Bill Preview</p>
                  </div>
                </TabsContent>
                <TabsContent value="passport" className="mt-4">
                  <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Passport/ID Preview</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Column 2: Validation Checklist */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-typewriter flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Validation Checklist
              </CardTitle>
              <CardDescription>Three-way identity match & safety</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Identity Checks */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  Identity Verification
                  {identityChecksPassed ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <Checkbox 
                      checked={checklist.passport_name_match}
                      onCheckedChange={(checked) => 
                        setChecklist(prev => ({ ...prev, passport_name_match: !!checked }))
                      }
                    />
                    <span className="text-sm">Passport name matches booking?</span>
                  </label>
                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <Checkbox 
                      checked={checklist.prescription_patient_match}
                      onCheckedChange={(checked) => 
                        setChecklist(prev => ({ ...prev, prescription_patient_match: !!checked }))
                      }
                    />
                    <span className="text-sm">Prescription patient = passport?</span>
                  </label>
                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <Checkbox 
                      checked={checklist.bill_patient_match}
                      onCheckedChange={(checked) => 
                        setChecklist(prev => ({ ...prev, bill_patient_match: !!checked }))
                      }
                    />
                    <span className="text-sm">Bill patient = passport?</span>
                  </label>
                </div>
              </div>

              {/* Safety Checks */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Safety Verification</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <Checkbox 
                      checked={checklist.is_narcotic}
                      onCheckedChange={(checked) => 
                        setChecklist(prev => ({ ...prev, is_narcotic: !!checked }))
                      }
                    />
                    <span className="text-sm text-destructive">⚠️ Narcotic/Psychotropic?</span>
                  </label>
                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <Checkbox 
                      checked={checklist.bill_date_valid}
                      onCheckedChange={(checked) => 
                        setChecklist(prev => ({ ...prev, bill_date_valid: !!checked }))
                      }
                    />
                    <span className="text-sm">Bill date within prescription duration?</span>
                  </label>
                </div>
              </div>

              {/* Quantity Check */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Quantity Verification
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Unit Count</Label>
                    <Input
                      type="number"
                      value={checklist.actual_unit_count || ''}
                      onChange={(e) => 
                        setChecklist(prev => ({ ...prev, actual_unit_count: parseInt(e.target.value) || 0 }))
                      }
                      placeholder="e.g., 200"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Daily Dosage</Label>
                    <Input
                      type="number"
                      value={checklist.daily_dosage || ''}
                      onChange={(e) => 
                        setChecklist(prev => ({ ...prev, daily_dosage: parseInt(e.target.value) || 1 }))
                      }
                      placeholder="e.g., 2"
                    />
                  </div>
                </div>
                {checklist.days_supply_calculated > 0 && (
                  <div className={`p-3 rounded-lg ${checklist.days_supply_compliant ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    <p className="text-sm font-medium">
                      Days Supply: {checklist.days_supply_calculated} days
                    </p>
                    {!checklist.days_supply_compliant && (
                      <p className="text-xs text-destructive mt-1">
                        ⚠️ Exceeds 90-day limit. Remove {Math.ceil(checklist.actual_unit_count - (90 * checklist.daily_dosage))} units.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Column 3: Physical & Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-typewriter flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Physical Verification
              </CardTitle>
              <CardDescription>Weight, dimensions & final decision</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Weight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Final Weight (kg)</Label>
                  <span className="text-xs text-muted-foreground">
                    Declared: {shipment.weight_kg || '?'} kg
                  </span>
                </div>
                <Input
                  type="number"
                  step="0.1"
                  value={checklist.final_weight_kg || ''}
                  onChange={(e) => 
                    setChecklist(prev => ({ ...prev, final_weight_kg: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0.0"
                  className="text-lg font-typewriter"
                />
              </div>

              {/* Dimensions */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Dimensions (cm)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Input
                      type="number"
                      value={checklist.dimensions_length_cm || ''}
                      onChange={(e) => 
                        setChecklist(prev => ({ ...prev, dimensions_length_cm: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="L"
                    />
                    <span className="text-xs text-muted-foreground">Length</span>
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={checklist.dimensions_width_cm || ''}
                      onChange={(e) => 
                        setChecklist(prev => ({ ...prev, dimensions_width_cm: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="W"
                    />
                    <span className="text-xs text-muted-foreground">Width</span>
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={checklist.dimensions_height_cm || ''}
                      onChange={(e) => 
                        setChecklist(prev => ({ ...prev, dimensions_height_cm: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="H"
                    />
                    <span className="text-xs text-muted-foreground">Height</span>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              <div className="space-y-2">
                <Label>Rejection Reason (if applicable)</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Describe issue if rejecting..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t">
                <Button 
                  onClick={handleApprove}
                  disabled={!canApprove || isSaving}
                  className="w-full bg-success hover:bg-success/90 btn-press"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approve & Pass QC
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason || isSaving}
                  className="w-full btn-press"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject / Hold
                </Button>
                
                {!canApprove && (
                  <p className="text-xs text-muted-foreground text-center">
                    Complete all identity checks, safety verification, and enter weight to approve
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

