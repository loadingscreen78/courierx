import { GiftBookingData } from '@/views/GiftBooking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Shield, Gift, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GiftAddonsStepProps {
  data: GiftBookingData;
  onUpdate: (updates: Partial<GiftBookingData>) => void;
}

const INSURANCE_PRICE = 150;
const GIFT_WRAPPING_PRICE = 175;

export const GiftAddonsStep = ({ data, onUpdate }: GiftAddonsStepProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-typewriter text-lg font-bold">Optional Add-ons</h3>
        <p className="text-sm text-muted-foreground">
          Enhance your gift shipment with additional services.
        </p>
      </div>

      <div className="space-y-4">
        {/* Insurance */}
        <Card className={cn("transition-all duration-300", data.insurance && "border-primary/50")}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", data.insurance ? "bg-primary/20" : "bg-muted")}>
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">Shipment Insurance</CardTitle>
                  <CardDescription className="text-sm">Protect against loss or total damage</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-typewriter font-bold text-foreground">₹{INSURANCE_PRICE}</span>
                <Switch checked={data.insurance} onCheckedChange={(checked) => onUpdate({ insurance: checked })} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {/* Default Coverage Info */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Default Coverage:</span> All shipments include basic protection up to <span className="font-semibold text-foreground">$100 (≈₹8,300)</span> at no extra cost.
                </p>
              </div>
            </div>

            {/* Insurance Benefits */}
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">
                {data.insurance ? "✓ Enhanced Protection Active" : "With Insurance:"}
              </p>
              <ul className="space-y-1 ml-1">
                <li>• Coverage up to full declared value (max $25,000 / ₹20,75,000)</li>
                <li>• Full refund for lost or totally damaged items</li>
                <li>• Fast claim processing within 7 business days</li>
                <li>• No deductibles or hidden fees</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Gift Wrapping */}
        <Card className={cn("transition-all duration-300", data.giftWrapping && "border-primary/50")}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", data.giftWrapping ? "bg-primary/20" : "bg-muted")}>
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">Premium Gift Wrapping</CardTitle>
                  <CardDescription className="text-sm">Luxurious presentation for your special gift</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-typewriter font-bold text-foreground">₹{GIFT_WRAPPING_PRICE}</span>
                <Switch checked={data.giftWrapping} onCheckedChange={(checked) => onUpdate({ giftWrapping: checked })} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Premium Wrapping Includes:</p>
              <ul className="space-y-1 ml-1">
                <li>• High-quality matte/glossy gift wrapping paper</li>
                <li>• Premium satin ribbon with decorative bow</li>
                <li>• Tissue paper inner lining for protection</li>
                <li>• Personalized gift message card</li>
                <li>• Decorative gift tag with recipient name</li>
                <li>• Elegant gift box (for eligible items)</li>
                <li>• Eco-friendly packaging materials</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="p-4 bg-card rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Add-ons Total</span>
          <span className="font-typewriter font-bold text-lg text-foreground">
            ₹{(data.insurance ? INSURANCE_PRICE : 0) + (data.giftWrapping ? GIFT_WRAPPING_PRICE : 0)}
          </span>
        </div>
      </div>
    </div>
  );
};
