import { DocumentBookingData } from '@/views/DocumentBooking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Shield, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentAddonsStepProps {
  data: DocumentBookingData;
  onUpdate: (updates: Partial<DocumentBookingData>) => void;
}

const INSURANCE_PRICE = 100;
const WATERPROOF_PRICE = 75;

export const DocumentAddonsStep = ({ data, onUpdate }: DocumentAddonsStepProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-typewriter text-lg font-bold">Optional Add-ons</h3>
        <p className="text-sm text-muted-foreground">
          Protect your important documents during transit.
        </p>
      </div>

      <div className="space-y-4">
        {/* Insurance */}
        <Card className={cn("transition-all duration-300", data.insurance && "border-accent bg-accent/10")}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", data.insurance ? "bg-accent" : "bg-muted")}>
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">Document Insurance</CardTitle>
                  <CardDescription className="text-sm">Coverage for loss or damage</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-typewriter font-bold text-foreground">₹{INSURANCE_PRICE}</span>
                <Switch checked={data.insurance} onCheckedChange={(checked) => onUpdate({ insurance: checked })} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm text-muted-foreground space-y-1 ml-15">
              <li>• Coverage for replacement costs</li>
              <li>• Fast claim processing</li>
              <li>• Proof of mailing certificate</li>
            </ul>
          </CardContent>
        </Card>

        {/* Waterproof Packaging */}
        <Card className={cn("transition-all duration-300", data.waterproofPackaging && "border-accent bg-accent/10")}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", data.waterproofPackaging ? "bg-accent" : "bg-muted")}>
                  <Droplets className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">Waterproof Packaging</CardTitle>
                  <CardDescription className="text-sm">Protection from moisture and spills</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-typewriter font-bold text-foreground">₹{WATERPROOF_PRICE}</span>
                <Switch checked={data.waterproofPackaging} onCheckedChange={(checked) => onUpdate({ waterproofPackaging: checked })} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm text-muted-foreground space-y-1 ml-15">
              <li>• Sealed waterproof pouch</li>
              <li>• Extra protection for originals</li>
              <li>• Recommended for legal documents</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="p-4 bg-card rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Add-ons Total</span>
          <span className="font-typewriter font-bold text-lg text-foreground">
            ₹{(data.insurance ? INSURANCE_PRICE : 0) + (data.waterproofPackaging ? WATERPROOF_PRICE : 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

