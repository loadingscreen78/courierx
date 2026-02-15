import { useState } from 'react';
import { GiftBookingData } from '@/views/GiftBooking';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Battery, 
  FlaskConical, 
  Droplets, 
  Gem, 
  Ban, 
  AlertTriangle, 
  Shield,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface GiftSafetyStepProps {
  data: GiftBookingData;
  onUpdate: (updates: Partial<GiftBookingData>) => void;
}

const PROHIBITED_KEYWORDS = [
  'gold', 'silver', 'platinum', 'antique', 'currency', 'cash', 'money',
  'credit card', 'debit card', 'passport', 'visa', 'hazardous', 'explosive',
  'firearm', 'weapon', 'drug', 'narcotic', 'tobacco', 'alcohol', 'wine',
  'lottery', 'gambling', 'counterfeit', 'replica'
];

const SAFETY_ITEMS = [
  { key: 'containsBattery', label: 'Contains Battery', icon: Battery, warning: 'Lithium batteries require special handling and documentation' },
  { key: 'containsChemical', label: 'Contains Chemicals', icon: FlaskConical, warning: 'Chemical products may be restricted in some countries' },
  { key: 'containsLiquid', label: 'Contains Liquid', icon: Droplets, warning: 'Liquids require leak-proof packaging' },
  { key: 'containsImitationJewellery', label: 'Contains Imitation Jewellery', icon: Gem, warning: 'Must be clearly marked as imitation/artificial' },
];

const PROHIBITED_ITEMS = [
  'Gold, Silver, Platinum (bullion or jewelry)',
  'Antiques and artifacts',
  'Currency, Cash, or Financial instruments',
  'Credit/Debit Cards',
  'Passports or Government IDs',
  'Hazardous materials',
  'Weapons or explosives',
  'Drugs or narcotics',
  'Tobacco or alcohol',
];

export const GiftSafetyStep = ({ data, onUpdate }: GiftSafetyStepProps) => {
  const [prohibitedCheck, setProhibitedCheck] = useState('');
  const { errorFeedback } = useHaptics();
  const { playError } = useSoundEffects();

  const updateSafetyChecklist = (key: string, value: boolean) => {
    onUpdate({
      safetyChecklist: { ...data.safetyChecklist, [key]: value }
    });
  };

  const checkForProhibitedItems = (text: string) => {
    setProhibitedCheck(text);
    const lowerText = text.toLowerCase();
    const hasProhibited = PROHIBITED_KEYWORDS.some(keyword => lowerText.includes(keyword));
    
    if (hasProhibited && !data.prohibitedItemAttempted) {
      errorFeedback();
      playError();
      onUpdate({ prohibitedItemAttempted: true });
    } else if (!hasProhibited && data.prohibitedItemAttempted) {
      onUpdate({ prohibitedItemAttempted: false });
    }
  };

  const hasAnyWarning = Object.values(data.safetyChecklist).some(v => v);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-typewriter text-lg font-bold">Safety & Compliance Check</h3>
        <p className="text-sm text-muted-foreground">
          Please verify your shipment contents comply with international shipping regulations.
        </p>
      </div>

      {/* Prohibited Items Check */}
      <Card className={cn(
        "border-2",
        data.prohibitedItemAttempted ? "border-destructive bg-destructive/5" : "border-border"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Prohibited Items Declaration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Type any item name to check if it is prohibited for shipping:
          </p>
          <Input
            placeholder="Type item name to check..."
            value={prohibitedCheck}
            onChange={(e) => checkForProhibitedItems(e.target.value)}
            className={cn("input-premium", data.prohibitedItemAttempted && "border-destructive")}
          />
          
          {data.prohibitedItemAttempted && (
            <Alert variant="destructive">
              <Ban className="h-4 w-4" />
              <AlertTitle>Prohibited Item Detected</AlertTitle>
              <AlertDescription>
                The item you entered is prohibited for international shipping. 
                This shipment cannot proceed with prohibited items.
              </AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-3">The following items are strictly prohibited:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PROHIBITED_ITEMS.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ban className="h-3 w-3 text-destructive flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please indicate if your shipment contains any of the following:
          </p>

          <div className="space-y-3">
            {SAFETY_ITEMS.map((item) => {
              const Icon = item.icon;
              const isChecked = data.safetyChecklist[item.key as keyof typeof data.safetyChecklist];
              
              return (
                <div key={item.key} className="space-y-2">
                  <div className={cn(
                    "flex items-start space-x-3 p-4 rounded-lg border transition-all",
                    isChecked ? "bg-warning/10 border-warning" : "border-border"
                  )}>
                    <Checkbox
                      id={item.key}
                      checked={isChecked}
                      onCheckedChange={(checked) => updateSafetyChecklist(item.key, checked === true)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={item.key} className="cursor-pointer font-medium flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Label>
                      {isChecked && (
                        <p className="text-xs text-warning mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {item.warning}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Confirmation */}
      <Card className={cn(
        "transition-all",
        !data.prohibitedItemAttempted && "border-accent bg-accent/10"
      )}>
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            {data.prohibitedItemAttempted ? (
              <Ban className="h-6 w-6 text-destructive flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-accent-foreground flex-shrink-0" />
            )}
            <div>
              <p className="font-medium">
                {data.prohibitedItemAttempted 
                  ? "Cannot proceed - Prohibited items detected"
                  : "Ready to proceed"
                }
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {data.prohibitedItemAttempted 
                  ? "Please remove prohibited items from your shipment to continue."
                  : hasAnyWarning
                    ? "Your shipment contains items that may require special handling. Additional fees may apply."
                    : "Your shipment appears to comply with international shipping regulations."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

