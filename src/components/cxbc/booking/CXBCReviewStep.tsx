import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Package, User, Globe, MapPin, CreditCard, Banknote, Smartphone, 
  FileText, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { SenderDetails } from './CXBCSenderStep';
import { ConsigneeDetails } from './CXBCConsigneeStep';
import { Carrier } from '@/lib/shipping/rateCalculator';

type PaymentMethod = 'cash' | 'upi' | 'card';

const paymentMethods: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'card', label: 'Card', icon: CreditCard },
];

interface CXBCReviewStepProps {
  shipmentType: string;
  selectedCountry: string;
  selectedCountryName: string;
  weightGrams: number;
  declaredValue: number;
  selectedCarrier: Carrier | null;
  sender: SenderDetails;
  consignee: ConsigneeDetails;
  notes: string;
  setNotes: (notes: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  basePrice: number;
  profitMargin: number;
  marginAmount: number;
  gstAmount: number;
  totalCustomerPrice: number;
  walletBalance: number;
  isGstRegistered: boolean;
  partnerAddress: string;
}

export const CXBCReviewStep = ({
  shipmentType,
  selectedCountryName,
  weightGrams,
  declaredValue,
  selectedCarrier,
  sender,
  consignee,
  notes,
  setNotes,
  paymentMethod,
  setPaymentMethod,
  basePrice,
  profitMargin,
  marginAmount,
  gstAmount,
  totalCustomerPrice,
  walletBalance,
  isGstRegistered,
  partnerAddress,
}: CXBCReviewStepProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasInsufficientBalance = walletBalance < basePrice;

  return (
    <div className="space-y-6">
      {/* Wallet Balance Warning */}
      {hasInsufficientBalance && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Insufficient Wallet Balance</p>
                <p className="text-sm text-muted-foreground">
                  Required: {formatCurrency(basePrice)} | Available: {formatCurrency(walletBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{shipmentType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Destination</p>
              <p className="font-medium">{selectedCountryName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Weight</p>
              <p className="font-medium">{weightGrams}g ({(weightGrams / 1000).toFixed(2)} kg)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Declared Value</p>
              <p className="font-medium">{formatCurrency(declaredValue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Courier</p>
              <p className="font-medium">{selectedCarrier || 'Best Available'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">QC Required</p>
              <Badge variant={shipmentType === 'document' ? 'secondary' : 'default'}>
                {shipmentType === 'document' ? 'No' : 'Yes'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sender Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Sender Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{sender.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{sender.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{sender.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID Type</p>
              <p className="font-medium capitalize">{sender.idType.replace('_', ' ')}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-medium">
              {sender.addressLine1}
              {sender.addressLine2 && `, ${sender.addressLine2}`}
              <br />
              {sender.city}, {sender.state} - {sender.pincode}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ID Number</p>
            <p className="font-mono font-medium">{sender.idNumber}</p>
          </div>
          {sender.idDocument && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle className="h-4 w-4" />
              ID Document uploaded: {sender.idDocument.name}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consignee Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Consignee Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{consignee.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{consignee.phone}</p>
            </div>
            {consignee.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{consignee.email}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Country</p>
              <p className="font-medium">{selectedCountryName}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Delivery Address</p>
            <p className="font-medium">
              {consignee.addressLine1}
              {consignee.addressLine2 && `, ${consignee.addressLine2}`}
              <br />
              {consignee.city}{consignee.state && `, ${consignee.state}`} - {consignee.zipcode}
            </p>
          </div>
          {consignee.idType && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">ID Proof</p>
              <p className="font-medium capitalize">{consignee.idType.replace('_', ' ')}: {consignee.idNumber || 'Not provided'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pickup Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Pickup Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{partnerAddress}</p>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            className="flex gap-4"
          >
            {paymentMethods.map((method) => (
              <div key={method.value} className="flex items-center space-x-2">
                <RadioGroupItem value={method.value} id={method.value} />
                <Label htmlFor={method.value} className="flex items-center gap-2 cursor-pointer">
                  <method.icon className="h-4 w-4" />
                  {method.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Additional Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions or notes for this shipment..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Pricing Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Shipping Cost</span>
            <span className="font-mono">{formatCurrency(basePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your Margin ({profitMargin}%)</span>
            <span className="font-mono text-success">+{formatCurrency(marginAmount)}</span>
          </div>
          {isGstRegistered && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="font-mono">+{formatCurrency(gstAmount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Customer Pays</span>
            <span className="font-mono">{formatCurrency(totalCustomerPrice)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deducted from your wallet</span>
            <span className="font-mono">{formatCurrency(basePrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your profit</span>
            <span className="font-mono text-success">+{formatCurrency(marginAmount)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
