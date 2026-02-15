import { memo } from 'react';
import { MedicineBookingData } from '@/views/MedicineBooking';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Shield, Package, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddonsStepProps {
  data: MedicineBookingData;
  onUpdate: (updates: Partial<MedicineBookingData>) => void;
}

const INSURANCE_PRICE = 150;
const SPECIAL_PACKAGING_PRICE = 200;

const AddonsStepComponent = ({ data, onUpdate }: AddonsStepProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-typewriter text-lg font-bold">Optional Add-ons</h3>
        <p className="text-sm text-muted-foreground">
          Enhance your shipment with additional protection and services.
        </p>
      </div>

      <div className="space-y-4">
        {/* Insurance */}
        <Card className={cn(
          "transition-all duration-300",
          data.insurance && "border-accent bg-accent/10"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  data.insurance ? "bg-accent" : "bg-muted"
                )}>
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">Shipment Insurance</CardTitle>
                  <CardDescription className="text-sm">
                    Protect against loss or damage during transit
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-typewriter font-bold text-foreground">
                  ₹{INSURANCE_PRICE}
                </span>
                <Switch
                  checked={data.insurance}
                  onCheckedChange={(checked) => onUpdate({ insurance: checked })}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm text-muted-foreground space-y-1 ml-15">
              <li>• Coverage up to declared value (max ₹25,000)</li>
              <li>• Claims processed within 7 business days</li>
              <li>• Full refund for lost shipments</li>
            </ul>
          </CardContent>
        </Card>

        {/* Special Packaging */}
        <Card className={cn(
          "transition-all duration-300",
          data.specialPackaging && "border-accent bg-accent/10"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  data.specialPackaging ? "bg-accent" : "bg-muted"
                )}>
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">Special Packaging</CardTitle>
                  <CardDescription className="text-sm">
                    Temperature-controlled & tamper-proof packaging
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-typewriter font-bold text-foreground">
                  ₹{SPECIAL_PACKAGING_PRICE}
                </span>
                <Switch
                  checked={data.specialPackaging}
                  onCheckedChange={(checked) => onUpdate({ specialPackaging: checked })}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm text-muted-foreground space-y-1 ml-15">
              <li>• Insulated packaging for temperature-sensitive medicines</li>
              <li>• Tamper-evident seals for security</li>
              <li>• Extra cushioning for fragile items</li>
              <li>• Recommended for liquids and semi-liquids</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation for liquid medicines */}
      {data.medicines?.some(m => m.form === 'liquid' || m.form === 'semi-liquid') && !data.specialPackaging && (
        <Card className="bg-warning/10 border-warning">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Recommended for Liquid Medicines
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Special packaging is highly recommended for liquid and semi-liquid medicines 
                  to prevent leakage and maintain temperature during transit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add-ons Summary */}
      <div className="p-4 bg-card rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Add-ons Total</span>
          <span className="font-typewriter font-bold text-lg text-foreground">
            ₹{(data.insurance ? INSURANCE_PRICE : 0) + (data.specialPackaging ? SPECIAL_PACKAGING_PRICE : 0)}
          </span>
        </div>
        {!data.insurance && !data.specialPackaging && (
          <p className="text-xs text-muted-foreground mt-2">
            No add-ons selected. You can proceed without them.
          </p>
        )}
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders on parent state changes
export const AddonsStep = memo(AddonsStepComponent);
