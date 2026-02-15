import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  ExternalLink,
  UserPlus,
  Copy,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type PartnerApplication = Database['public']['Tables']['cxbc_partner_applications']['Row'];
type PartnerStatus = Database['public']['Enums']['partner_status'];
type IndiaZone = Database['public']['Enums']['india_zone'];

const statusColors: Record<PartnerStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  under_review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  suspended: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

interface ManualPartnerForm {
  email: string;
  password: string;
  businessName: string;
  ownerName: string;
  phone: string;
  panNumber: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  zone: IndiaZone;
}

const initialFormState: ManualPartnerForm = {
  email: '',
  password: '',
  businessName: '',
  ownerName: '',
  phone: '',
  panNumber: '',
  gstNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  zone: 'north',
};

const CXBCPartnerManagement = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | 'all'>('all');
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState<ManualPartnerForm>(initialFormState);
  const [createdCredentials, setCreatedCredentials] = useState<{ 
    email: string; 
    password: string; 
    userId?: string;
    partnerId?: string;
    linkedExisting?: boolean;
  } | null>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['cxbc-applications', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('cxbc_partner_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PartnerApplication[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (application: PartnerApplication) => {
      // First, create the partner record
      const { error: partnerError } = await supabase.from('cxbc_partners').insert({
        user_id: application.user_id!,
        business_name: application.business_name,
        owner_name: application.owner_name,
        email: application.email,
        phone: application.phone,
        pan_number: application.pan_number,
        gst_number: application.gst_number,
        address: application.address,
        city: application.city,
        state: application.state,
        pincode: application.pincode,
        zone: application.zone,
        kyc_pan_url: application.kyc_pan_url,
        kyc_aadhaar_url: application.kyc_aadhaar_url,
        shop_photo_url: application.shop_photo_url,
        status: 'approved',
        approved_at: new Date().toISOString(),
      });

      if (partnerError) throw partnerError;

      // Then update the application status
      const { error: updateError } = await supabase
        .from('cxbc_partner_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Partner approved successfully');
      queryClient.invalidateQueries({ queryKey: ['cxbc-applications'] });
      setSelectedApplication(null);
    },
    onError: (error) => {
      toast.error('Failed to approve partner: ' + error.message);
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (form: ManualPartnerForm) => {
      const { data, error } = await supabase.functions.invoke('admin-create-cxbc-partner', {
        body: {
          email: form.email,
          password: form.password,
          businessName: form.businessName,
          ownerName: form.ownerName,
          phone: form.phone,
          panNumber: form.panNumber,
          gstNumber: form.gstNumber || undefined,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          zone: form.zone,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create partner');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.user_id || !data?.partner_id) {
        throw new Error('Partner created but response was incomplete');
      }

      return { 
        email: form.email, 
        password: form.password,
        userId: data.user_id,
        partnerId: data.partner_id,
        linkedExisting: data.linked_existing_user || false,
      };
    },
    onSuccess: (credentials) => {
      setCreatedCredentials(credentials);
      if (credentials.linkedExisting) {
        toast.success('Partner linked to existing account');
      } else {
        toast.success('Partner created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['cxbc-applications'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ application, reason }: { application: PartnerApplication; reason: string }) => {
      const { error } = await supabase
        .from('cxbc_partner_applications')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Application rejected');
      queryClient.invalidateQueries({ queryKey: ['cxbc-applications'] });
      setSelectedApplication(null);
      setShowRejectDialog(false);
      setRejectionReason('');
    },
    onError: (error) => {
      toast.error('Failed to reject application: ' + error.message);
    },
  });

  const filteredApplications = applications?.filter((app) =>
    app.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = () => {
    if (!selectedApplication) return;
    if (!selectedApplication.user_id) {
      toast.error('Application has no linked user account');
      return;
    }
    approveMutation.mutate(selectedApplication);
  };

  const handleReject = () => {
    if (!selectedApplication || !rejectionReason.trim()) return;
    rejectMutation.mutate({ application: selectedApplication, reason: rejectionReason });
  };

  const handleCreatePartner = () => {
    if (!createForm.email || !createForm.password || !createForm.businessName || 
        !createForm.ownerName || !createForm.phone || !createForm.panNumber ||
        !createForm.address || !createForm.city || !createForm.state || !createForm.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }
    createPartnerMutation.mutate(createForm);
  };

  const handleCloseCredentials = () => {
    setCreatedCredentials(null);
    setShowCreateDialog(false);
    setCreateForm(initialFormState);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-typewriter font-bold">CXBC Partner Applications</h1>
            <p className="text-muted-foreground">Review and manage partner applications</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Partner
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by business, owner, email, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PartnerStatus | 'all')}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="font-typewriter">Partner Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredApplications?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No applications found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications?.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.business_name}</TableCell>
                        <TableCell>{app.owner_name}</TableCell>
                        <TableCell>{app.city}, {app.state}</TableCell>
                        <TableCell className="uppercase">{app.zone}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[app.status]}>
                            {app.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(app.created_at), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedApplication(app)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-typewriter">Application Details</DialogTitle>
            <DialogDescription>
              Review partner application and approve or reject
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={statusColors[selectedApplication.status]}>
                  {selectedApplication.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Applied {format(new Date(selectedApplication.created_at), 'dd MMM yyyy HH:mm')}
                </span>
              </div>

              {/* Business Info */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Business Name</p>
                    <p className="font-medium">{selectedApplication.business_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Owner Name</p>
                    <p className="font-medium">{selectedApplication.owner_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">PAN Number</p>
                    <p className="font-medium">{selectedApplication.pan_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">GST Number</p>
                    <p className="font-medium">{selectedApplication.gst_number || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedApplication.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedApplication.phone}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </h4>
                <div className="text-sm space-y-1">
                  <p>{selectedApplication.address}</p>
                  <p>{selectedApplication.city}, {selectedApplication.state} - {selectedApplication.pincode}</p>
                  <Badge variant="outline" className="uppercase">{selectedApplication.zone} Zone</Badge>
                </div>
              </div>

              {/* KYC Documents */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  KYC Documents
                </h4>
                <div className="flex flex-wrap gap-3">
                  {selectedApplication.kyc_pan_url && (
                    <a
                      href={selectedApplication.kyc_pan_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm"
                    >
                      <FileText className="h-4 w-4" />
                      PAN Card
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {selectedApplication.kyc_aadhaar_url && (
                    <a
                      href={selectedApplication.kyc_aadhaar_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm"
                    >
                      <FileText className="h-4 w-4" />
                      Aadhaar Card
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {selectedApplication.shop_photo_url && (
                    <a
                      href={selectedApplication.shop_photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm"
                    >
                      <Building2 className="h-4 w-4" />
                      Shop Photo
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Rejection Reason (if rejected) */}
              {selectedApplication.rejection_reason && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                  <p className="text-sm mt-1">{selectedApplication.rejection_reason}</p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedApplication.status === 'pending' || selectedApplication.status === 'under_review' ? (
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={approveMutation.isPending || !selectedApplication.user_id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve Partner
                  </Button>
                </DialogFooter>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Partner Dialog */}
      <Dialog open={showCreateDialog && !createdCredentials} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-typewriter">Create New Partner</DialogTitle>
            <DialogDescription>
              Manually create a CXBC partner account with login credentials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Login Credentials */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm border-b pb-2">Login Credentials</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="partner@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="text"
                    placeholder="Create a password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm border-b pb-2">Business Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Shop / Business Name"
                    value={createForm.businessName}
                    onChange={(e) => setCreateForm({ ...createForm, businessName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input
                    id="ownerName"
                    placeholder="Full name of owner"
                    value={createForm.ownerName}
                    onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    placeholder="10-digit mobile number"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    placeholder="ABCDE1234F"
                    value={createForm.panNumber}
                    onChange={(e) => setCreateForm({ ...createForm, panNumber: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                  <Input
                    id="gstNumber"
                    placeholder="22AAAAA0000A1Z5"
                    value={createForm.gstNumber}
                    onChange={(e) => setCreateForm({ ...createForm, gstNumber: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm border-b pb-2">Location Details</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Full shop address"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={createForm.state}
                      onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      placeholder="6-digit pincode"
                      value={createForm.pincode}
                      onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zone">Zone *</Label>
                    <Select
                      value={createForm.zone}
                      onValueChange={(v) => setCreateForm({ ...createForm, zone: v as IndiaZone })}
                    >
                      <SelectTrigger id="zone">
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="north">North</SelectItem>
                        <SelectItem value="south">South</SelectItem>
                        <SelectItem value="east">East</SelectItem>
                        <SelectItem value="west">West</SelectItem>
                        <SelectItem value="central">Central</SelectItem>
                        <SelectItem value="northeast">Northeast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePartner}
              disabled={createPartnerMutation.isPending}
            >
              {createPartnerMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Create Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Display Dialog */}
      <Dialog open={!!createdCredentials} onOpenChange={handleCloseCredentials}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-typewriter text-green-500">
              {createdCredentials?.linkedExisting 
                ? 'Partner Linked Successfully!' 
                : 'Partner Created Successfully!'}
            </DialogTitle>
            <DialogDescription>
              {createdCredentials?.linkedExisting 
                ? 'This email was already registered. The existing account has been linked as a CXBC partner. The user can log in with their existing password.'
                : 'Share these login credentials with the partner. Make sure to copy them now as the password cannot be retrieved later.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {createdCredentials?.linkedExisting && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm">
                <p className="font-medium text-yellow-600 dark:text-yellow-400">⚠️ Existing User Linked</p>
                <p className="text-muted-foreground mt-1">
                  This email already had an account. The password you entered was NOT applied. 
                  The user should use their existing password to log in.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2">
                <Input value={createdCredentials?.email || ''} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(createdCredentials?.email || '')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {!createdCredentials?.linkedExisting && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Password</Label>
                <div className="flex items-center gap-2">
                  <Input value={createdCredentials?.password || ''} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdCredentials?.password || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground text-xs">User ID</Label>
                <p className="font-mono text-xs truncate">{createdCredentials?.userId}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Partner ID</Label>
                <p className="font-mono text-xs truncate">{createdCredentials?.partnerId}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
              <p>Partner can log in at the CXBC Panel using these credentials.</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCloseCredentials}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CXBCPartnerManagement;
