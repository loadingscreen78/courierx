import { useState, useRef, useMemo } from 'react';
import { GiftBookingData } from '@/views/GiftBooking';
import { Label } from '@/components/ui/label';
import { DebouncedInput } from '@/components/ui/debounced-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, User, Phone, Home, Globe, Upload, X, FileText, Info, CheckCircle2, Loader2, Search, Check, ChevronsUpDown } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { lookupPincode, INDIAN_STATES, CITIES_BY_STATE } from '@/lib/pincode-lookup';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface GiftAddressStepProps {
  data: GiftBookingData;
  onUpdate: (updates: Partial<GiftBookingData>) => void;
}

// Comprehensive list of countries sorted alphabetically
const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' },
  { code: 'EE', name: 'Estonia' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MO', name: 'Macau' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' },
  { code: 'MT', name: 'Malta' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MD', name: 'Moldova' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PA', name: 'Panama' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'YE', name: 'Yemen' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
];

export const GiftAddressStep = ({ data, onUpdate }: GiftAddressStepProps) => {
  const { lightTap } = useHaptics();
  const [passportFront, setPassportFront] = useState<File | null>(null);
  const [passportBack, setPassportBack] = useState<File | null>(null);
  const [passportFrontPreview, setPassportFrontPreview] = useState<string | null>(null);
  const [passportBackPreview, setPassportBackPreview] = useState<string | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Get cities for selected state
  const availableCities = data.pickupAddress.state 
    ? CITIES_BY_STATE[data.pickupAddress.state] || [] 
    : [];

  // Get selected country name
  const selectedCountry = useMemo(() => 
    COUNTRIES.find(c => c.code === data.consigneeAddress.country),
    [data.consigneeAddress.country]
  );

  const updatePickupAddress = (field: string, value: string) => {
    onUpdate({ pickupAddress: { ...data.pickupAddress, [field]: value } });
  };

  // Handle PIN code change with auto-fill
  const handlePincodeChange = async (pincode: string) => {
    const cleanPincode = pincode.replace(/\D/g, '').slice(0, 6);
    updatePickupAddress('pincode', cleanPincode);
    setPincodeError(null);

    if (cleanPincode.length === 6) {
      setPincodeLoading(true);
      try {
        const result = await lookupPincode(cleanPincode);
        if (result) {
          onUpdate({
            pickupAddress: {
              ...data.pickupAddress,
              pincode: cleanPincode,
              city: result.city,
              state: result.state,
            }
          });
        } else {
          setPincodeError('Invalid PIN code');
        }
      } catch {
        setPincodeError('Could not verify PIN code');
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const updateConsigneeAddress = (field: string, value: string) => {
    onUpdate({ consigneeAddress: { ...data.consigneeAddress, [field]: value } });
  };

  const handleFileUpload = (file: File | null, type: 'front' | 'back') => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'front') {
        setPassportFront(file);
        setPassportFrontPreview(reader.result as string);
      } else {
        setPassportBack(file);
        setPassportBackPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (type: 'front' | 'back') => {
    lightTap();
    if (type === 'front') {
      setPassportFront(null);
      setPassportFrontPreview(null);
      if (frontInputRef.current) frontInputRef.current.value = '';
    } else {
      setPassportBack(null);
      setPassportBackPreview(null);
      if (backInputRef.current) backInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
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
              <Label>Contact Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <DebouncedInput
                  placeholder="Full name"
                  value={data.pickupAddress.fullName}
                  onChange={(value) => updatePickupAddress('fullName', value)}
                  className="input-premium pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <DebouncedInput
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={data.pickupAddress.phone}
                  onChange={(value) => updatePickupAddress('phone', value)}
                  className="input-premium pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address Line 1 *</Label>
            <DebouncedInput
              placeholder="House/Flat number, Building name"
              value={data.pickupAddress.addressLine1}
              onChange={(value) => updatePickupAddress('addressLine1', value)}
              className="input-premium"
            />
          </div>

          <div className="space-y-2">
            <Label>Address Line 2</Label>
            <DebouncedInput
              placeholder="Street, Area, Landmark"
              value={data.pickupAddress.addressLine2}
              onChange={(value) => updatePickupAddress('addressLine2', value)}
              className="input-premium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>PIN Code *</Label>
              <div className="relative">
                <DebouncedInput
                  placeholder="6-digit PIN"
                  maxLength={6}
                  value={data.pickupAddress.pincode}
                  onChange={handlePincodeChange}
                  className="input-premium font-typewriter pr-10"
                />
                {pincodeLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!pincodeLoading && data.pickupAddress.pincode.length === 6 && !pincodeError && data.pickupAddress.city && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {pincodeError && (
                <p className="text-xs text-destructive">{pincodeError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Select 
                value={data.pickupAddress.state} 
                onValueChange={(value) => {
                  updatePickupAddress('state', value);
                  updatePickupAddress('city', ''); // Reset city when state changes
                }}
              >
                <SelectTrigger className="input-premium">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-60">
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>City *</Label>
              <Select 
                value={data.pickupAddress.city} 
                onValueChange={(value) => updatePickupAddress('city', value)}
                disabled={!data.pickupAddress.state}
              >
                <SelectTrigger className="input-premium">
                  <SelectValue placeholder={data.pickupAddress.state ? "Select city" : "Select state first"} />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-60">
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                  {/* Allow custom city if not in list */}
                  {data.pickupAddress.city && !availableCities.includes(data.pickupAddress.city) && (
                    <SelectItem value={data.pickupAddress.city}>{data.pickupAddress.city}</SelectItem>
                  )}
                </SelectContent>
              </Select>
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
              <Label>Full Name *</Label>
              <DebouncedInput
                placeholder="Recipient name"
                value={data.consigneeAddress.fullName}
                onChange={(value) => updateConsigneeAddress('fullName', value)}
                className="input-premium"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <DebouncedInput
                  type="tel"
                  placeholder="With country code (e.g., +971 50 123 4567)"
                  value={data.consigneeAddress.phone}
                  onChange={(value) => updateConsigneeAddress('phone', value)}
                  className="input-premium pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email Address</Label>
            <DebouncedInput
              type="email"
              placeholder="For delivery updates"
              value={data.consigneeAddress.email}
              onChange={(value) => updateConsigneeAddress('email', value)}
              className="input-premium"
            />
          </div>

          <div className="space-y-2">
            <Label>Country *</Label>
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryOpen}
                  className="w-full justify-between input-premium font-normal"
                >
                  {selectedCountry ? (
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {selectedCountry.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Search destination country...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search country..." className="h-10" />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-auto">
                      {COUNTRIES.map((country) => (
                        <CommandItem
                          key={country.code}
                          value={country.name}
                          onSelect={() => {
                            updateConsigneeAddress('country', country.code);
                            setCountryOpen(false);
                            lightTap();
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              data.consigneeAddress.country === country.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {country.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Address Line 1 *</Label>
            <DebouncedInput
              placeholder="Street address"
              value={data.consigneeAddress.addressLine1}
              onChange={(value) => updateConsigneeAddress('addressLine1', value)}
              className="input-premium"
            />
          </div>

          <div className="space-y-2">
            <Label>Address Line 2</Label>
            <DebouncedInput
              placeholder="Apartment, suite, etc."
              value={data.consigneeAddress.addressLine2}
              onChange={(value) => updateConsigneeAddress('addressLine2', value)}
              className="input-premium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City *</Label>
              <DebouncedInput
                placeholder="City"
                value={data.consigneeAddress.city}
                onChange={(value) => updateConsigneeAddress('city', value)}
                className="input-premium"
              />
            </div>
            <div className="space-y-2">
              <Label>ZIP/Postal Code *</Label>
              <DebouncedInput
                placeholder="ZIP code"
                value={data.consigneeAddress.zipcode}
                onChange={(value) => updateConsigneeAddress('zipcode', value)}
                className="input-premium font-typewriter"
              />
            </div>
          </div>

          {/* Passport Upload Section */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-coke-red/10">
                <FileText className="h-5 w-5 text-coke-red" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">Recipient's Passport/ID</Label>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Optional</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload passport pages to speed up customs clearance and avoid delivery delays
                </p>
              </div>
            </div>

            {/* Instructions Card */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border mb-4">
              <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-coke-red" />
                Which pages to upload?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Front page instruction */}
                <div className="flex gap-3">
                  <div className="w-16 h-20 rounded-lg bg-background border border-border flex-shrink-0 overflow-hidden">
                    {/* Passport front mock */}
                    <div className="h-full p-1.5 flex">
                      <div className="w-1/3 border-r border-dashed border-border flex items-center justify-center">
                        <div className="w-5 h-6 rounded-sm bg-muted-foreground/30" />
                      </div>
                      <div className="flex-1 p-1 space-y-1">
                        <div className="h-1 w-full bg-muted-foreground/20 rounded" />
                        <div className="h-1 w-3/4 bg-muted-foreground/20 rounded" />
                        <div className="h-1 w-full bg-muted-foreground/20 rounded" />
                        <div className="h-1 w-1/2 bg-muted-foreground/20 rounded" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Page 2 - Photo Page</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Contains photo, name, passport number, date of birth, and expiry date
                    </p>
                  </div>
                </div>
                
                {/* Back page instruction */}
                <div className="flex gap-3">
                  <div className="w-16 h-20 rounded-lg bg-background border border-border flex-shrink-0 overflow-hidden">
                    {/* Passport back/address mock */}
                    <div className="h-full p-1.5">
                      <div className="text-[6px] text-muted-foreground/50 mb-1">ADDRESS</div>
                      <div className="space-y-1">
                        <div className="h-1 w-full bg-muted-foreground/20 rounded" />
                        <div className="h-1 w-3/4 bg-muted-foreground/20 rounded" />
                        <div className="h-1 w-full bg-muted-foreground/20 rounded" />
                        <div className="h-1 w-2/3 bg-muted-foreground/20 rounded" />
                        <div className="h-1 w-1/2 bg-muted-foreground/20 rounded" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Last Page - Address Page</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Contains permanent address of the passport holder (usually last page)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Side Upload */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-coke-red/10 text-coke-red text-xs flex items-center justify-center font-semibold">1</span>
                  Photo Page (Page 2)
                </Label>
                
                {passportFrontPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-green-500/50 bg-muted/30">
                    <img 
                      src={passportFrontPreview} 
                      alt="Passport front" 
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-lg"
                        onClick={() => removeFile('front')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="flex items-center gap-1.5 text-white text-xs">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        Photo page uploaded
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => { lightTap(); frontInputRef.current?.click(); }}
                    className="relative rounded-xl border-2 border-dashed border-border hover:border-coke-red/50 bg-muted/20 hover:bg-coke-red/5 transition-all cursor-pointer group"
                  >
                    <div className="p-4 h-44 flex flex-col items-center justify-center">
                      {/* Passport mock illustration */}
                      <div className="w-24 h-28 rounded-lg bg-gradient-to-br from-blue-900 to-blue-950 border border-blue-800 mb-3 p-2 relative overflow-hidden">
                        <div className="text-[6px] text-blue-300/70 font-semibold mb-1">PASSPORT</div>
                        <div className="flex gap-1.5">
                          <div className="w-6 h-8 rounded-sm bg-gray-300/80 flex items-center justify-center">
                            <User className="h-3 w-3 text-gray-500" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="h-1 w-full bg-blue-300/30 rounded" />
                            <div className="h-1 w-3/4 bg-blue-300/30 rounded" />
                            <div className="h-1 w-full bg-blue-300/30 rounded" />
                            <div className="h-1 w-1/2 bg-blue-300/30 rounded" />
                          </div>
                        </div>
                        <div className="absolute bottom-1 left-1 right-1 h-2 bg-blue-300/20 rounded text-[4px] text-blue-300/50 flex items-center px-1">
                          &lt;&lt;&lt; MRZ CODE &gt;&gt;&gt;
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-coke-red transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm font-medium">Upload photo page</span>
                      </div>
                    </div>
                  </div>
                )}
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'front')}
                />
              </div>

              {/* Back Side Upload */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-coke-red/10 text-coke-red text-xs flex items-center justify-center font-semibold">2</span>
                  Address Page (Last Page)
                </Label>
                
                {passportBackPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-green-500/50 bg-muted/30">
                    <img 
                      src={passportBackPreview} 
                      alt="Passport back" 
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-lg"
                        onClick={() => removeFile('back')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="flex items-center gap-1.5 text-white text-xs">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        Address page uploaded
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => { lightTap(); backInputRef.current?.click(); }}
                    className="relative rounded-xl border-2 border-dashed border-border hover:border-coke-red/50 bg-muted/20 hover:bg-coke-red/5 transition-all cursor-pointer group"
                  >
                    <div className="p-4 h-44 flex flex-col items-center justify-center">
                      {/* Address page mock illustration */}
                      <div className="w-24 h-28 rounded-lg bg-gradient-to-br from-blue-900 to-blue-950 border border-blue-800 mb-3 p-2 relative overflow-hidden">
                        <div className="text-[6px] text-blue-300/70 font-semibold mb-1">ADDRESS</div>
                        <div className="space-y-1.5 mt-2">
                          <div className="h-1.5 w-full bg-blue-300/30 rounded" />
                          <div className="h-1.5 w-4/5 bg-blue-300/30 rounded" />
                          <div className="h-1.5 w-full bg-blue-300/30 rounded" />
                          <div className="h-1.5 w-3/5 bg-blue-300/30 rounded" />
                          <div className="h-1.5 w-2/3 bg-blue-300/30 rounded" />
                        </div>
                        <div className="absolute bottom-1 right-1 w-6 h-6 rounded border border-blue-300/30 flex items-center justify-center">
                          <div className="text-[5px] text-blue-300/50">SEAL</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-coke-red transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm font-medium">Upload address page</span>
                      </div>
                    </div>
                  </div>
                )}
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'back')}
                />
              </div>
            </div>

            <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Tip:</span> Make sure the entire page is visible, text is readable, and there's no glare. Accepted formats: JPG, PNG, PDF (max 5MB each)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

