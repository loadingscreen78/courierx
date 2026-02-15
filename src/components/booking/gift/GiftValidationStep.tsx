import { useEffect, useState } from 'react';
import { GiftBookingData } from '@/views/GiftBooking';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, AlertTriangle, Ban, Loader2, RefreshCw } from 'lucide-react';
import { validateMultipleItems, getValidationSummary, ValidationResult } from '@/lib/customs/validationService';
import { HSNValidationCard } from './HSNValidationCard';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface GiftValidationStepProps {
  data: GiftBookingData;
  onUpdate: (updates: Partial<GiftBookingData>) => void;
}

export const GiftValidationStep = ({ data, onUpdate }: GiftValidationStepProps) => {
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);

  const destinationCountry = data.consigneeAddress.country;

  // Run validation
  const runValidation = () => {
    if (!destinationCountry || data.items.length === 0) return;

    setIsValidating(true);
    setValidationComplete(false);

    // Simulate async validation with delay for better UX
    setTimeout(() => {
      const items = data.items.map(item => ({
        hsnCode: item.hsnCode,
        name: item.name,
      }));

      const results = validateMultipleItems(items, destinationCountry);
      setValidationResults(results);
      setIsValidating(false);
      setValidationComplete(true);
    }, 1500);
  };

  // Auto-run validation on mount and when items/country changes
  useEffect(() => {
    if (destinationCountry && data.items.length > 0) {
      runValidation();
    }
  }, [destinationCountry, data.items.length]);

  const summary = validationComplete ? getValidationSummary(validationResults) : null;

  if (!destinationCountry) {
    return (
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Destination Country Required</h3>
          <p className="text-muted-foreground text-sm">
            Please go back and select a destination country to validate your items.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data.items.length === 0) {
    return (
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Items to Validate</h3>
          <p className="text-muted-foreground text-sm">
            Please go back and add items to your shipment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-typewriter text-lg font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Customs Validation
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Checking HSN codes and country-specific restrictions for {data.consigneeAddress.country}
        </p>
      </div>

      {/* Validation Progress */}
      {isValidating && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <div>
                <h4 className="font-semibold mb-2">Validating Items...</h4>
                <p className="text-sm text-muted-foreground">
                  Checking {data.items.length} item{data.items.length > 1 ? 's' : ''} against customs database
                </p>
              </div>
              <Progress value={66} className="w-64 mx-auto" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Summary */}
      {validationComplete && summary && (
        <Card className={cn(
          'border-2',
          summary.canProceed ? 'border-green-500/50 bg-green-500/5' : 'border-destructive/50 bg-destructive/5'
        )}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                'p-3 rounded-xl',
                summary.canProceed ? 'bg-green-500/20' : 'bg-destructive/20'
              )}>
                {summary.canProceed ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : (
                  <Ban className="h-8 w-8 text-destructive" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-2">
                  {summary.canProceed ? 'Validation Passed' : 'Validation Failed'}
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {summary.canProceed 
                    ? 'All items have been validated and can proceed to customs clearance.'
                    : 'Some items cannot be shipped to the selected destination. Please review the issues below.'
                  }
                </p>
                
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-background border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Total Items</p>
                    <p className="text-2xl font-bold">{summary.total}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-xs text-muted-foreground mb-1">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{summary.valid}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs text-muted-foreground mb-1">Restricted</p>
                    <p className="text-2xl font-bold text-amber-600">{summary.restricted}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <p className="text-xs text-muted-foreground mb-1">Prohibited</p>
                    <p className="text-2xl font-bold text-destructive">{summary.prohibited + summary.invalid}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Item Validations */}
      {validationComplete && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Item Validation Results</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={runValidation}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Re-validate
            </Button>
          </div>
          
          {Array.from(validationResults.entries()).map(([key, result], index) => {
            const item = data.items[index];
            return (
              <HSNValidationCard
                key={key}
                itemName={item.name}
                validation={result}
                itemIndex={index}
              />
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Need Help?</p>
              <p className="text-xs text-muted-foreground">
                If you have questions about HSN codes or customs restrictions, our support team is here to help.
                Contact us at support@courierx.com or call +91-1800-XXX-XXXX.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
