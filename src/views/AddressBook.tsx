import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Home,
  Building2,
  Globe,
  Phone,
  User,
  Search,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAddresses, type Address, type AddressType, type AddressLabel } from '@/hooks/useAddresses';

const LABEL_ICONS: Record<AddressLabel, React.ReactNode> = {
  home: <Home className="h-4 w-4" />,
  office: <Building2 className="h-4 w-4" />,
  other: <MapPin className="h-4 w-4" />,
};

const COUNTRIES = [
  { code: 'India', name: 'India' },
  { code: 'United States', name: 'United States' },
  { code: 'United Kingdom', name: 'United Kingdom' },
  { code: 'United Arab Emirates', name: 'United Arab Emirates' },
  { code: 'Saudi Arabia', name: 'Saudi Arabia' },
  { code: 'Singapore', name: 'Singapore' },
  { code: 'Australia', name: 'Australia' },
  { code: 'Canada', name: 'Canada' },
  { code: 'Germany', name: 'Germany' },
  { code: 'France', name: 'France' },
];

interface FormData {
  type: AddressType;
  label: AddressLabel;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  zipcode: string;
  country: string;
  is_default: boolean;
}

const emptyFormData: FormData = {
  type: 'pickup',
  label: 'home',
  full_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  pincode: '',
  zipcode: '',
  country: 'India',
  is_default: false,
};

const AddressCard = ({ 
  address, 
  onEdit, 
  onDelete, 
  onSetDefault 
}: { 
  address: Address; 
  onEdit: () => void; 
  onDelete: () => void;
  onSetDefault: () => void;
}) => {
  return (
    <Card className={cn(
      "relative",
      address.is_default && "border-primary"
    )}>
      {address.is_default && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-primary gap-1">
            <Star className="h-3 w-3 fill-current" />
            Default
          </Badge>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            address.label === 'home' && "bg-accent/20",
            address.label === 'office' && "bg-primary/20",
            address.label === 'other' && "bg-muted"
          )}>
            {LABEL_ICONS[address.label]}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-medium capitalize">{address.label}</p>
              <Badge variant="outline" className="text-xs capitalize">
                {address.type}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <p className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                {address.full_name}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {address.phone}
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                <span>
                  {address.address_line_1}
                  {address.address_line_2 && `, ${address.address_line_2}`}
                  <br />
                  {address.city}
                  {address.state && `, ${address.state}`}
                  {' - '}
                  {address.pincode || address.zipcode}
                </span>
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3 w-3" />
                {address.country}
              </p>
            </div>
          </div>
        </div>
        
        <Separator className="my-3" />
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-1">
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete} className="gap-1 text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
          {!address.is_default && (
            <Button variant="ghost" size="sm" onClick={onSetDefault} className="gap-1">
              <Star className="h-3 w-3" />
              Set Default
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AddressBookPage = () => {
  const { addresses, loading, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddresses();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [saving, setSaving] = useState(false);

  const pickupAddresses = addresses.filter(a => 
    a.type === 'pickup' && 
    (a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     a.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const deliveryAddresses = addresses.filter(a => 
    a.type === 'delivery' &&
    (a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     a.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenDialog = (type: AddressType, address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        type: address.type,
        label: address.label,
        full_name: address.full_name,
        phone: address.phone,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2 || '',
        city: address.city,
        state: address.state || '',
        pincode: address.pincode || '',
        zipcode: address.zipcode || '',
        country: address.country,
        is_default: address.is_default,
      });
    } else {
      setEditingAddress(null);
      setFormData({ ...emptyFormData, type, country: type === 'pickup' ? 'India' : 'United States' });
    }
    setShowDialog(true);
  };

  const handleSaveAddress = async () => {
    if (!formData.full_name || !formData.phone || !formData.address_line_1 || !formData.city) {
      return;
    }

    setSaving(true);
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, {
          type: formData.type,
          label: formData.label,
          full_name: formData.full_name,
          phone: formData.phone,
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2 || null,
          city: formData.city,
          state: formData.state || null,
          pincode: formData.pincode || null,
          zipcode: formData.zipcode || null,
          country: formData.country,
          is_default: formData.is_default,
        });
      } else {
        await addAddress({
          type: formData.type,
          label: formData.label,
          full_name: formData.full_name,
          phone: formData.phone,
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2 || null,
          city: formData.city,
          state: formData.state || null,
          pincode: formData.pincode || null,
          zipcode: formData.zipcode || null,
          country: formData.country,
          is_default: formData.is_default,
        });
      }
      setShowDialog(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (deletingAddressId) {
      await deleteAddress(deletingAddressId);
      setShowDeleteAlert(false);
      setDeletingAddressId(null);
    }
  };

  const handleSetDefault = (addressId: string, type: AddressType) => {
    setDefaultAddress(addressId, type);
  };

  const isIndia = formData.country === 'India';

  return (
    <AppLayout>
      <div className="space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-typewriter text-2xl font-bold">Address Book</h1>
            <p className="text-sm text-muted-foreground">
              Manage your saved pickup and delivery addresses
            </p>
          </div>
          <Badge variant="outline" className="font-typewriter">
            {addresses.length} Saved
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Address Tabs */}
        <Tabs defaultValue="pickup" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="pickup" className="gap-2">
              <MapPin className="h-4 w-4" />
              Pickup ({pickupAddresses.length})
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-2">
              <Globe className="h-4 w-4" />
              Delivery ({deliveryAddresses.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pickup" className="space-y-4 mt-4">
            <Button 
              onClick={() => handleOpenDialog('pickup')} 
              className="w-full gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Add Pickup Address
            </Button>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pickupAddresses.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No pickup addresses saved</p>
                </CardContent>
              </Card>
            ) : (
              pickupAddresses.map(address => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={() => handleOpenDialog('pickup', address)}
                  onDelete={() => {
                    setDeletingAddressId(address.id);
                    setShowDeleteAlert(true);
                  }}
                  onSetDefault={() => handleSetDefault(address.id, 'pickup')}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="delivery" className="space-y-4 mt-4">
            <Button 
              onClick={() => handleOpenDialog('delivery')} 
              className="w-full gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Add Delivery Address
            </Button>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : deliveryAddresses.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No delivery addresses saved</p>
                </CardContent>
              </Card>
            ) : (
              deliveryAddresses.map(address => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={() => handleOpenDialog('delivery', address)}
                  onDelete={() => {
                    setDeletingAddressId(address.id);
                    setShowDeleteAlert(true);
                  }}
                  onSetDefault={() => handleSetDefault(address.id, 'delivery')}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Address Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-typewriter">
              {editingAddress ? 'Edit Address' : `Add ${formData.type === 'pickup' ? 'Pickup' : 'Delivery'} Address`}
            </DialogTitle>
            <DialogDescription>
              {formData.type === 'pickup' 
                ? 'Add an Indian address for package pickup'
                : 'Add an international address for delivery'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Label Selection */}
            <div className="space-y-2">
              <Label>Address Label</Label>
              <div className="flex gap-2">
                {(['home', 'office', 'other'] as AddressLabel[]).map(label => (
                  <Button
                    key={label}
                    type="button"
                    variant={formData.label === label ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, label }))}
                    className="gap-2 capitalize"
                  >
                    {LABEL_ICONS[label]}
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Country (for delivery only) */}
            {formData.type === 'delivery' && (
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, country: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.filter(c => c.code !== 'India').map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Address Lines */}
            <div className="space-y-2">
              <Label>Address Line 1 *</Label>
              <Input
                value={formData.address_line_1}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line_1: e.target.value }))}
                placeholder="House/Flat No, Building Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input
                value={formData.address_line_2}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line_2: e.target.value }))}
                placeholder="Street, Area, Landmark"
              />
            </div>

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Mumbai"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Maharashtra"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {isIndia ? (
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input
                    value={formData.pincode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="400001"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input
                    value={formData.zipcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipcode: e.target.value }))}
                    placeholder="10001"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAddress}
                disabled={saving || !formData.full_name || !formData.phone || !formData.address_line_1 || !formData.city}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingAddress ? 'Update' : 'Save'} Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAddress} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default AddressBookPage;
