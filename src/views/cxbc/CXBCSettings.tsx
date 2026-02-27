import { useState, useEffect } from 'react';
import { useCXBCAuth } from '@/hooks/useCXBCAuth';
import { supabase } from '@/integrations/supabase/client';
import { CXBCLayout } from '@/components/cxbc/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Percent, 
  Save, 
  Users, 
  Plus, 
  Trash2,
  Edit2,
  UserCheck,
  UserX,
  Package,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'manager' | 'operator';
  is_active: boolean;
  permissions: Record<string, boolean>;
}

interface SenderSettings {
  default_sender_name: string;
  default_sender_phone: string;
  default_sender_email: string;
}

const CXBCSettings = () => {
  const { partner, refetch } = useCXBCAuth();
  const queryClient = useQueryClient();
  
  // Profit margin state
  const [profitMargin, setProfitMargin] = useState(partner?.profit_margin_percent || 0);
  const [isSaving, setIsSaving] = useState(false);

  // Sender settings state
  const [senderSettings, setSenderSettings] = useState<SenderSettings>({
    default_sender_name: '',
    default_sender_phone: '',
    default_sender_email: '',
  });
  const [isSavingSender, setIsSavingSender] = useState(false);

  // Employee dialog state
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'operator' as 'manager' | 'operator',
  });

  // Load sender settings from partner
  useEffect(() => {
    if (partner) {
      setSenderSettings({
        default_sender_name: (partner as any).default_sender_name || '',
        default_sender_phone: (partner as any).default_sender_phone || '',
        default_sender_email: (partner as any).default_sender_email || '',
      });
    }
  }, [partner]);

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['cxbc-employees', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data, error } = await supabase
        .from('cxbc_partner_employees')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!partner?.id,
  });

  // Save profit margin
  const handleSaveMargin = async () => {
    if (!partner?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cxbc_partners')
        .update({ profit_margin_percent: profitMargin })
        .eq('id', partner.id);

      if (error) throw error;

      await refetch();
      toast.success('Profit margin updated successfully');
    } catch (error) {
      console.error('Error updating margin:', error);
      toast.error('Failed to update profit margin');
    } finally {
      setIsSaving(false);
    }
  };

  // Save sender settings
  const handleSaveSenderSettings = async () => {
    if (!partner?.id) return;

    setIsSavingSender(true);
    try {
      const { error } = await supabase
        .from('cxbc_partners')
        .update({
          default_sender_name: senderSettings.default_sender_name || null,
          default_sender_phone: senderSettings.default_sender_phone || null,
          default_sender_email: senderSettings.default_sender_email || null,
        })
        .eq('id', partner.id);

      if (error) throw error;

      await refetch();
      toast.success('Sender settings saved');
    } catch (error) {
      console.error('Error saving sender settings:', error);
      toast.error('Failed to save sender settings');
    } finally {
      setIsSavingSender(false);
    }
  };

  // Add/update employee
  const saveEmployeeMutation = useMutation({
    mutationFn: async (employee: typeof employeeForm & { id?: string }) => {
      if (!partner?.id) throw new Error('Partner not found');
      
      if (employee.id) {
        // Update
        const { error } = await supabase
          .from('cxbc_partner_employees')
          .update({
            name: employee.name,
            email: employee.email,
            phone: employee.phone || null,
            role: employee.role,
          })
          .eq('id', employee.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('cxbc_partner_employees')
          .insert({
            partner_id: partner.id,
            name: employee.name,
            email: employee.email,
            phone: employee.phone || null,
            role: employee.role,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cxbc-employees'] });
      setShowEmployeeDialog(false);
      setEditingEmployee(null);
      setEmployeeForm({ name: '', email: '', phone: '', role: 'operator' });
      toast.success(editingEmployee ? 'Employee updated' : 'Employee added');
    },
    onError: (error: any) => {
      console.error('Error saving employee:', error);
      toast.error(error.message || 'Failed to save employee');
    },
  });

  // Toggle employee status
  const toggleEmployeeMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('cxbc_partner_employees')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cxbc-employees'] });
      toast.success('Employee status updated');
    },
    onError: () => {
      toast.error('Failed to update employee status');
    },
  });

  // Delete employee
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cxbc_partner_employees')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cxbc-employees'] });
      toast.success('Employee removed');
    },
    onError: () => {
      toast.error('Failed to remove employee');
    },
  });

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      role: employee.role,
    });
    setShowEmployeeDialog(true);
  };

  const openAddDialog = () => {
    setEditingEmployee(null);
    setEmployeeForm({ name: '', email: '', phone: '', role: 'operator' });
    setShowEmployeeDialog(true);
  };

  if (!partner) return null;

  return (
    <CXBCLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your business profile and preferences</p>
        </div>

        {/* Business Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Profile
            </CardTitle>
            <CardDescription>Your registered business information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Business Name</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{partner.business_name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Owner Name</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{partner.owner_name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Phone</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{partner.phone}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{partner.email}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-muted-foreground">Pickup Address (Fixed)</Label>
              <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{partner.address}</p>
                  <p className="text-muted-foreground">{partner.city}, {partner.state} - {partner.pincode}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This is your registered address for all shipment pickups
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Zone</Label>
                <Badge variant="outline" className="capitalize">{partner.zone}</Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Status</Label>
                <Badge className="bg-green-100 text-green-800">{partner.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Sender Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Default Sender Settings
            </CardTitle>
            <CardDescription>
              Pre-fill sender details for walk-in customers. These will be used as default values in the booking form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Sender Name</Label>
                <Input
                  value={senderSettings.default_sender_name}
                  onChange={(e) => setSenderSettings(s => ({ ...s, default_sender_name: e.target.value }))}
                  placeholder="e.g., Walk-in Customer"
                />
              </div>
              <div className="space-y-2">
                <Label>Default Sender Phone</Label>
                <Input
                  value={senderSettings.default_sender_phone}
                  onChange={(e) => setSenderSettings(s => ({ ...s, default_sender_phone: e.target.value }))}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Default Sender Email (Optional)</Label>
              <Input
                type="email"
                value={senderSettings.default_sender_email}
                onChange={(e) => setSenderSettings(s => ({ ...s, default_sender_email: e.target.value }))}
                placeholder="sender@email.com"
              />
            </div>
            <Button 
              onClick={handleSaveSenderSettings} 
              disabled={isSavingSender}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSavingSender ? 'Saving...' : 'Save Sender Settings'}
            </Button>
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tax Information
            </CardTitle>
            <CardDescription>Your registered tax details for invoicing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">PAN Number</Label>
                <div className="p-3 bg-muted rounded-lg font-mono">
                  {partner.pan_number}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">GST Number</Label>
                <div className="p-3 bg-muted rounded-lg font-mono">
                  {partner.gst_number || (
                    <span className="text-muted-foreground italic">Not registered - Bills will not include GST</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Profit Margin
            </CardTitle>
            <CardDescription>
              Set your default profit margin for customer bookings. This will be added to the base shipping cost.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Default Profit Margin</Label>
                <span className="text-2xl font-bold text-primary">{profitMargin}%</span>
              </div>
              
              <Slider
                value={[profitMargin]}
                onValueChange={(value) => setProfitMargin(value[0])}
                max={200}
                step={5}
                className="w-full"
              />
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0%</span>
                <span>100%</span>
                <span>200%</span>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Example Calculation</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Base shipping cost</span>
                  <span>₹1,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Your margin ({profitMargin}%)</span>
                  <span className="text-green-600">+₹{(1000 * profitMargin / 100).toFixed(0)}</span>
                </div>
                {partner.gst_number && (
                  <div className="flex justify-between">
                    <span>GST (18%)</span>
                    <span>₹{((1000 + 1000 * profitMargin / 100) * 0.18).toFixed(0)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Customer pays</span>
                  <span>
                    ₹{partner.gst_number 
                      ? ((1000 + 1000 * profitMargin / 100) * 1.18).toFixed(0)
                      : (1000 + 1000 * profitMargin / 100).toFixed(0)
                    }
                  </span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSaveMargin} 
              disabled={isSaving || profitMargin === partner.profit_margin_percent}
              className="w-full md:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Employee Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Management
                </CardTitle>
                <CardDescription>Add employees who can book shipments on your behalf</CardDescription>
              </div>
              <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
                <DialogTrigger asChild>
                  <Button onClick={openAddDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                    <DialogDescription>
                      {editingEmployee 
                        ? 'Update employee details below'
                        : 'Add a new team member who can create bookings'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={employeeForm.name}
                        onChange={(e) => setEmployeeForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Employee name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={employeeForm.email}
                        onChange={(e) => setEmployeeForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="employee@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={employeeForm.phone}
                        onChange={(e) => setEmployeeForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select 
                        value={employeeForm.role} 
                        onValueChange={(v: 'manager' | 'operator') => setEmployeeForm(f => ({ ...f, role: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operator">Operator (Basic access)</SelectItem>
                          <SelectItem value="manager">Manager (Full access)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEmployeeDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => saveEmployeeMutation.mutate({ 
                        ...employeeForm, 
                        id: editingEmployee?.id 
                      })}
                      disabled={!employeeForm.name || !employeeForm.email || saveEmployeeMutation.isPending}
                    >
                      {saveEmployeeMutation.isPending ? 'Saving...' : (editingEmployee ? 'Update' : 'Add Employee')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No employees added yet</p>
                <p className="text-sm">Add team members to help manage your bookings</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{employee.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={employee.is_active}
                            onCheckedChange={(checked) => 
                              toggleEmployeeMutation.mutate({ id: employee.id, is_active: checked })
                            }
                          />
                          {employee.is_active ? (
                            <span className="text-sm text-success flex items-center gap-1">
                              <UserCheck className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <UserX className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(employee)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>Contact our partner support team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Button variant="outline" className="flex-1" asChild>
                <a href="mailto:partners@courierx.in">
                  <Mail className="h-4 w-4 mr-2" />
                  partners@courierx.in
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href="tel:+917008368628">
                  <Phone className="h-4 w-4 mr-2" />
                  +91 7008368628
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CXBCLayout>
  );
};

export default CXBCSettings;
