import { memo } from 'react';
import { DocumentBookingData } from '@/views/DocumentBooking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { WalletBalanceCheck } from '@/components/booking/WalletBalanceCheck';
import { toast } from 'sonner';
import { FileText, MapPin, Shield, Droplets, Truck, Globe } from 'lucide-react';

interface DocumentReviewStepProps {
  data: DocumentBookingData;
  onConfirmBooking?: () => void;
}

const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States', 'GB': 'United Kingdom', 'DE': 'Germany', 'FR': 'France',
  'AE': 'United Arab Emirates', 'SA': 'Saudi Arabia', 'SG': 'Singapore',
  'AU': 'Australia', 'CA': 'Canada', 'NL': 'Netherlands',
};

const INSURANCE_PRICE = 100;
const WATERPROOF_PRICE = 75;

const getShippingPrice = (weight: number) => {
  if (weight <= 100) return 850;
  if (weight <= 500) return 1200;
  if (weight <= 1000) return 1650;
  return 2100;
};

export const DocumentReviewStep = memo(({ data, onConfirmBooking }: DocumentReviewStepProps) => {
  const shippingPrice = getShippingPrice(data.weight);
  const addonsTotal = (data.insurance ? INSURANCE_PRICE : 0) + (data.waterproofPackaging ? WATERPROOF_PRICE : 0);
  const grandTotal = shippingPrice + addonsTotal;

  const handleConfirmBooking = () => {
    toast.success('Booking confirmed successfully!', {
      description: 'Your document shipment has been booked.',
    });
    onConfirmBooking?.();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-typewriter text-lg font-bold">Review Your Shipment</h3>
        <p className="text-sm text-muted-foreground">Confirm all details before booking.</p>
      </div>

      {/* Document Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-destructive" />
            Document Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Packet Type</p>
              <p className="font-medium capitalize">{data.packetType?.replace('-', ' ') || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Document Type</p>
              <p className="font-medium">{data.documentType || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Weight</p>
              <p className="font-typewriter font-medium">{data.weight}g</p>
            </div>
            {data.length > 0 && (
              <div>
                <p className="text-muted-foreground">Dimensions</p>
                <p className="font-typewriter font-medium">{data.length} × {data.width} × {data.height} cm</p>
              </div>
            )}
          </div>
          {data.description && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground text-sm">Description</p>
                <p className="text-sm">{data.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-destructive" />
              Pickup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p className="font-medium">{data.pickupAddress.fullName}</p>
              <p className="text-muted-foreground">{data.pickupAddress.phone}</p>
              <p className="text-muted-foreground">{data.pickupAddress.addressLine1}</p>
              <p className="text-muted-foreground">{data.pickupAddress.city}, {data.pickupAddress.state} - {data.pickupAddress.pincode}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-destructive" />
              Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p className="font-medium">{data.consigneeAddress.fullName}</p>
              <p className="text-muted-foreground">{data.consigneeAddress.phone}</p>
              <p className="text-muted-foreground">{data.consigneeAddress.addressLine1}</p>
              <p className="text-muted-foreground">{data.consigneeAddress.city}, {data.consigneeAddress.zipcode}</p>
              <p className="font-medium">{COUNTRY_NAMES[data.consigneeAddress.country] || data.consigneeAddress.country}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipping */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-destructive" />
            Shipping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg border border-accent">
            <div>
              <p className="font-medium">DHL Express Documents</p>
              <p className="text-sm text-muted-foreground">Est. delivery: 2-4 business days</p>
            </div>
            <div className="text-right">
              <p className="font-typewriter font-bold text-lg">₹{shippingPrice}</p>
              <Badge className="bg-accent text-accent-foreground">Fastest</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add-ons */}
      {(data.insurance || data.waterproofPackaging) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Selected Add-ons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.insurance && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Document Insurance</span>
                </div>
                <span className="font-typewriter font-medium">₹{INSURANCE_PRICE}</span>
              </div>
            )}
            {data.waterproofPackaging && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  <span className="text-sm">Waterproof Packaging</span>
                </div>
                <span className="font-typewriter font-medium">₹{WATERPROOF_PRICE}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Total */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="py-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm opacity-80">
              <span>Shipping</span>
              <span>₹{shippingPrice}</span>
            </div>
            {addonsTotal > 0 && (
              <div className="flex justify-between text-sm opacity-80">
                <span>Add-ons</span>
                <span>₹{addonsTotal}</span>
              </div>
            )}
            <Separator className="bg-primary-foreground/20" />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total to Pay</span>
              <span className="font-typewriter text-2xl font-bold">₹{grandTotal}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Balance Check */}
      <WalletBalanceCheck totalAmount={grandTotal} onProceed={handleConfirmBooking} />
    </div>
  );
});

DocumentReviewStep.displayName = 'DocumentReviewStep';
