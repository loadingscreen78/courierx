"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Briefcase, Warehouse, MapPin, Phone, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type AddressType = 'home' | 'office' | 'warehouse';

interface AddressForm {
  fullName: string;
  phone: string;
  alternatePhone: string;
  houseNumber: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressType: AddressType;
  isDefault: boolean;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const ADDRESS_TYPES = [
  { value: 'home' as AddressType, label: 'Home', icon: Home },
  { value: 'office' as AddressType, label: 'Office', icon: Briefcase },
  { value: 'warehouse' as AddressType, label: 'Warehouse', icon: Warehouse },
];

export default function AddAddress() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});
  
  const [formData, setFormData] = useState<AddressForm>({
    fullName: '',
    phone: '',
    alternatePhone: '',
    houseNumber: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    addressType: 'home',
    isDefault: false,
  });

  const handleInputChange = (field: keyof AddressForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AddressForm, string>> = {};

    // Required fields
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = 'Enter valid 10-digit mobile number';
    
    if (formData.alternatePhone && !/^[6-9]\d{9}$/.test(formData.alternatePhone)) {
      newErrors.alternatePhone = 'Enter valid 10-digit mobile number';
    }

    if (!formData.houseNumber.trim()) newErrors.houseNumber = 'House/Flat/Building is required';
    if (!formData.street.trim()) newErrors.street = 'Street/Area is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Enter valid 6-digit pincode';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Save address to database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success('Address saved successfully!');
      router.back();
    } catch (error) {
      toast.error('Failed to save address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-[#0F0F0F]/95 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold font-typewriter">Add New Address</h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-4 py-6 pb-32 space-y-8">
        {/* Contact Details Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
            <User className="h-4 w-4" />
            Contact Details
          </h2>
          
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm text-white/80">
                Full Name <span className="text-[#FF2D2D]">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className={cn(
                  "h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30",
                  "focus:border-[#FF2D2D] focus:ring-[#FF2D2D]/20",
                  errors.fullName && "border-[#FF2D2D]"
                )}
              />
              {errors.fullName && (
                <p className="text-xs text-[#FF2D2D] flex items-center gap-1">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm text-white/80">
                Phone Number <span className="text-[#FF2D2D]">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="phone"
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleInputChange('phone', value);
                  }}
                  placeholder="10-digit mobile number"
                  className={cn(
                    "h-12 pl-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30",
                    "focus:border-[#FF2D2D] focus:ring-[#FF2D2D]/20",
                    errors.phone && "border-[#FF2D2D]"
                  )}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-[#FF2D2D]">{errors.phone}</p>
              )}
            </div>

            {/* Alternate Phone */}
            <div className="space-y-2">
              <Label htmlFor="alternatePhone" className="text-sm text-white/80">
                Alternate Phone <span className="text-white/40 text-xs">(Optional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="alternatePhone"
                  type="tel"
                  maxLength={10}
                  value={formData.alternatePhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleInputChange('alternatePhone', value);
                  }}
                  placeholder="10-digit mobile number"
                  className={cn(
                    "h-12 pl-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30",
                    "focus:border-[#FF2D2D] focus:ring-[#FF2D2D]/20",
                    errors.alternatePhone && "border-[#FF2D2D]"
                  )}
                />
              </div>
              {errors.alternatePhone && (
                <p className="text-xs text-[#FF2D2D]">{errors.alternatePhone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Details Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Address Details
          </h2>
          
          <div className="space-y-4">
            {/* House/Flat/Building */}
            <div className="space-y-2">
              <Label htmlFor="houseNumber" className="text-sm text-white/80">
                House / Flat / Building <span className="text-[#FF2D2D]">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="houseNumber"
                  value={formData.houseNumber}
                  onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                  placeholder="House no., Building name"
                  className={cn(
                    "h-12 pl-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30",
                    "focus:border-[#FF2D2D] focus:ring-[#FF2D2D]/20",
                    errors.houseNumber && "border-[#FF2D2D]"
                  )}
                />
              </div>
              {errors.houseNumber && (
                <p className="text-xs text-[#FF2D2D]">{errors.houseNumber}</p>
              )}
            </div>

            {/* Street/Area */}
            <div className="space-y-2">
              <Label htmlFor="street" className="text-sm text-white/80">
                Street / Area <span className="text-[#FF2D2D]">*</span>
              </Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                placeholder="Street name, Area"
                className={cn(
                  "h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30",
                  "focus:border-[#FF2D2D] focus:ring-[#FF2D2D]/20",
                  errors.street && "border-[#FF2D2D]"
                )}
              />
              {errors.street && (
                <p className="text-xs text-[#FF2D2D]">{errors.street}</p>
              )}
            </div>

            {/* Landmark */}
            <div className="space-y-2">
              <Label htmlFor="landmark" className="text-sm text-white/80">
                Landmark <span className="text-white/40 text-xs">(Optional)</span>
              </Label>
              <Input
                id="landmark"
                value={formData.landmark}
                onChange={(e) => handleInputChange('landmark', e.target.value)}
                placeholder="Nearby landmark"
                className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#FF2D2D] focus:ring-[#FF2D2D]/20"
              />
            </div>

            {/* City and State */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm text-white/80">
                  City <span className="text-[#FF2D2D]">*</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  className={cn(
                    "h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30",
                    "focus:border-[#FF2D2D] focus:ring-[#FF2D2D]/20",
                    errors.city && "border-[#FF2D2D]"
                  )}
                />
                {errors.city && (
                  <p className="text-xs text-[#FF2D2D]">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm text-white/80">
                  State <span className="text-[#FF2D2D]">*</span>
                </Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => handleInputChange('state', value)}
                >
                  <SelectTrigger
                    className={cn(
                      "h-12 bg-white/5 border-white/10 rounded-xl text-white",
                      "focus:border-[#FF2D2D] focus:ring-[#FF2D2D]/20",
                      errors.state && "border-[#FF2D2D]"
                    )}
                  >
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 text-white max-h-60">
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state} className="focus:bg-white/10">
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-xs text-[#FF2D2D]">{errors.state}</p>
                )}
              </div>
            </div>

            {/* Pincode and Country */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-sm text-white/80">
                  Pincode <span className="text-[#FF2D2D]">*</span>
                </Label>
                <Input
                  id="pincode"
                  type="tel"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleInputChange('pincode', value);
                  }}
                  placeholder="6-digit pincode"
                  className={cn(
                    "h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30",
                    "focus:border-[#FF2D2D] focus:ring-[#FF2D2D]/20",
                    errors.pincode && "border-[#FF2D2D]"
                  )}
                />
                {errors.pincode && (
                  <p className="text-xs text-[#FF2D2D]">{errors.pincode}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm text-white/80">
                  Country
                </Label>
                <Input
                  id="country"
                  value={formData.country}
                  disabled
                  className="h-12 bg-white/5 border-white/10 rounded-xl text-white/60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Type Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">
            Address Type
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            {ADDRESS_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.addressType === type.value;
              
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleInputChange('addressType', type.value)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-300",
                    "flex flex-col items-center gap-2",
                    isSelected
                      ? "bg-[#FF2D2D]/10 border-[#FF2D2D] shadow-lg shadow-[#FF2D2D]/20"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                >
                  <Icon className={cn(
                    "h-6 w-6 transition-colors",
                    isSelected ? "text-[#FF2D2D]" : "text-white/60"
                  )} />
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isSelected ? "text-[#FF2D2D]" : "text-white/80"
                  )}>
                    {type.label}
                  </span>
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#FF2D2D]/5 rounded-xl animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) => handleInputChange('isDefault', checked as boolean)}
              className="border-white/20 data-[state=checked]:bg-[#FF2D2D] data-[state=checked]:border-[#FF2D2D]"
            />
            <Label
              htmlFor="isDefault"
              className="text-sm text-white/80 cursor-pointer flex-1"
            >
              Set as default address
            </Label>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0F0F0F]/95 backdrop-blur-lg border-t border-white/5 p-4">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-xl border-white/20 text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-xl bg-[#FF2D2D] hover:bg-[#FF2D2D]/90 text-white font-semibold shadow-lg shadow-[#FF2D2D]/30 transition-all duration-300 hover:scale-[1.02]"
          >
            {isSubmitting ? 'Saving...' : 'Save Address'}
          </Button>
        </div>
      </div>
    </div>
  );
}
