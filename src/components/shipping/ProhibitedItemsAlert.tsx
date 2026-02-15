import { useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronDown, ChevronUp, Ban, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ProhibitedItem, globalProhibitedItems, giftRestrictedItems } from '@/lib/shipping/prohibitedItems';

interface ProhibitedItemsAlertProps {
  countryName?: string;
  countrySpecificItems?: ProhibitedItem[];
  className?: string;
}

export const ProhibitedItemsAlert = ({
  countryName,
  countrySpecificItems = [],
  className,
}: ProhibitedItemsAlertProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-3 h-auto bg-destructive/5 hover:bg-destructive/10 border border-destructive/20"
        >
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-destructive" />
            <span className="font-medium text-destructive">
              View Prohibited Items
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-destructive" />
          ) : (
            <ChevronDown className="h-4 w-4 text-destructive" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-4">
        {/* Global prohibited items */}
        <div>
          <h4 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4" />
            Strictly Prohibited (Worldwide)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {globalProhibitedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-destructive/5 rounded-md text-sm"
              >
                <Ban className="h-3 w-3 text-destructive flex-shrink-0" />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Country-specific prohibitions */}
        {countrySpecificItems.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" />
              Prohibited in {countryName}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {countrySpecificItems
                .filter((item) => item.severity === 'blocked')
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 bg-destructive/5 rounded-md text-sm"
                  >
                    <Ban className="h-3 w-3 text-destructive flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Restricted items with warnings */}
        <div>
          <h4 className="text-sm font-semibold text-amber-600 flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            Restricted Items (Special Handling Required)
          </h4>
          <div className="space-y-2">
            {giftRestrictedItems
              .filter((item) => item.severity === 'warning' || item.severity === 'restricted')
              .slice(0, 6)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 p-2 bg-amber-500/5 rounded-md text-sm"
                >
                  <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <Alert className="border-blue-500/50 bg-blue-500/5">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm text-muted-foreground">
            Shipping prohibited items may result in customs seizure, fines, or legal action.
            Please ensure your shipment complies with all regulations.
          </AlertDescription>
        </Alert>
      </CollapsibleContent>
    </Collapsible>
  );
};

// Inline prohibited item warning
interface ProhibitedItemWarningProps {
  item: ProhibitedItem;
  className?: string;
}

export const ProhibitedItemWarning = ({ item, className }: ProhibitedItemWarningProps) => {
  const isBlocked = item.severity === 'blocked';

  return (
    <Alert
      variant={isBlocked ? 'destructive' : 'default'}
      className={cn(
        !isBlocked && 'border-amber-500/50 bg-amber-500/10',
        className
      )}
    >
      {isBlocked ? (
        <Ban className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      )}
      <AlertTitle className={!isBlocked ? 'text-amber-600' : ''}>
        {item.name} - {isBlocked ? 'Prohibited' : 'Restricted'}
      </AlertTitle>
      <AlertDescription className={!isBlocked ? 'text-muted-foreground' : ''}>
        {item.description}
      </AlertDescription>
    </Alert>
  );
};
