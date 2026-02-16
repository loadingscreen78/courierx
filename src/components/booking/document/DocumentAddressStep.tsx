import { memo, useState, useEffect, useCallback } from 'react';
import { DocumentBookingData } from '@/views/DocumentBooking';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DebouncedInput } from '@/components/ui/debounced-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, User, Phone, Home, Globe } from 'lucide-react';

interface DocumentAddressStepProps {
  data: DocumentBookingData;
  onUpdate: (updates: Partial<DocumentBookingData>) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry'
];

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'NL', name: 'Netherlands' },
];

const DocumentAddressStepComponent = ({ data, onUpdate }: DocumentAddressStepProps) => {
  // Use local state to prevent parent re-renders on every keystroke
  const [localPickupAddress, setLocalPickupAddress] = useState(data.pickupAddress);
  const [localConsigneeAddress, setLocalConsigneeAddress] = useState(data.consigneeAddress);

  // Only update parent on blur, not while typing
  const handleBlur = useCallback(() => {
    onUpdate({
      pickupAddress: localPickupAddress,
      consigneeAddress: localConsigneeAddress
    });
  }, [localPickupAddress, localConsigneeAddress, onUpdate]);

  const updatePickupAddress = useCallback((field: string, value: string) => {
    setLocalPickupAddress(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateConsigneeAddress = useCallback((field: string, value: string) => {
    setLocalConsigneeAddress(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="space-y-8" onBlur={handleBlur}>
      {/* Sender Notice */}
      <Card className="bg-accent/20 border-accent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Sender Address (From KYC)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="font-typewriter text-sm text-foreground">
              123 Sample Street, Example Area<br />
              Mumbai, Maharashtra 400001, India
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pickup Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-destructive" />
            Pickup Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickupName">Contact Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pickupName"
                  placeholder="Full name"
                  value={localPickupAddress.fullName}
                  onChange={(e) => updatePickupAddress('fullName', e.target.value)}
                  className="input-premium pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupPhone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pickupPhone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={localPickupAddress.phone}
                  onChange={(e) => updatePickupAddress('phone', e.target.value)}
                  className="input-premium pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupAddress1">Address Line 1 *</Label>
            <Input
              id="pickupAddress1"
              placeholder="House/Flat number, Building name"
              value={localPickupAddress.addressLine1}
              onChange={(e) => updatePickupAddress('addressLine1', e.target.value)}
              className="input-premium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupAddress2">Address Line 2</Label>
            <Input
              id="pickupAddress2"
              placeholder="Street, Area, Landmark"
              value={localPickupAddress.addressLine2}
              onChange={(e) => updatePickupAddress('addressLine2', e.target.value)}
              className="input-premium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickupCity">City *</Label>
              <Input
                id="pickupCity"
                placeholder="City"
                value={localPickupAddress.city}
                onChange={(e) => updatePickupAddress('city', e.target.value)}
                className="input-premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupState">State *</Label>
              <Select value={localPickupAddress.state} onValueChange={(value) => updatePickupAddress('state', value)}>
                <SelectTrigger className="input-premium">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupPincode">PIN Code *</Label>
              <Input
                id="pickupPincode"
                placeholder="6-digit PIN"
                maxLength={6}
                value={localPickupAddress.pincode}
                onChange={(e) => updatePickupAddress('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input-premium font-typewriter"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consignee Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-destructive" />
            Consignee (Recipient) Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="consigneeName">Full Name *</Label>
              <Input
                id="consigneeName"
                placeholder="Recipient name"
                value={localConsigneeAddress.fullName}
                onChange={(e) => updateConsigneeAddress('fullName', e.target.value)}
                className="input-premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consigneePhone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <DebouncedInput
                  id="consigneePhone"
                  type="tel"
                  placeholder="With country code (e.g., +971 50 123 4567)"
                  value={localConsigneeAddress.phone}
                  onChange={(value) => updateConsigneeAddress('phone', value)}
                  className="input-premium pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="consigneeEmail">Email Address</Label>
            <Input
              id="consigneeEmail"
              type="email"
              placeholder="For delivery updates"
              value={localConsigneeAddress.email}
              onChange={(e) => updateConsigneeAddress('email', e.target.value)}
              className="input-premium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="consigneeCountry">Country *</Label>
            <Select value={localConsigneeAddress.country} onValueChange={(value) => updateConsigneeAddress('country', value)}>
              <SelectTrigger className="input-premium">
                <SelectValue placeholder="Select destination country" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="consigneeAddress1">Address Line 1 *</Label>
            <Input
              id="consigneeAddress1"
              placeholder="Street address"
              value={localConsigneeAddress.addressLine1}
              onChange={(e) => updateConsigneeAddress('addressLine1', e.target.value)}
              className="input-premium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="consigneeAddress2">Address Line 2</Label>
            <Input
              id="consigneeAddress2"
              placeholder="Apartment, suite, etc."
              value={localConsigneeAddress.addressLine2}
              onChange={(e) => updateConsigneeAddress('addressLine2', e.target.value)}
              className="input-premium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="consigneeCity">City *</Label>
              <Input
                id="consigneeCity"
                placeholder="City"
                value={localConsigneeAddress.city}
                onChange={(e) => updateConsigneeAddress('city', e.target.value)}
                className="input-premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consigneeZipcode">ZIP/Postal Code *</Label>
              <Input
                id="consigneeZipcode"
                placeholder="ZIP code"
                value={localConsigneeAddress.zipcode}
                onChange={(e) => updateConsigneeAddress('zipcode', e.target.value)}
                className="input-premium font-typewriter"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders on parent state changes
export const DocumentAddressStep = memo(DocumentAddressStepComponent);
