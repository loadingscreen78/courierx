import { Calendar, Clock, Package, Truck, CheckCircle, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ETACalculation, formatPickupDate } from '@/lib/shipping/etaCalculator';

interface ETADisplayProps {
  eta: ETACalculation;
  className?: string;
}

export const ETADisplay = ({ eta, className }: ETADisplayProps) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  };

  const earliest = eta.estimatedDeliveryDate.earliest.toLocaleDateString('en-IN', options);
  const latest = eta.estimatedDeliveryDate.latest.toLocaleDateString('en-IN', options);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Estimated Delivery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            {earliest === latest ? earliest : `${earliest} - ${latest}`}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {eta.totalBusinessDays.min === eta.totalBusinessDays.max
            ? `${eta.totalBusinessDays.min} business days`
            : `${eta.totalBusinessDays.min}-${eta.totalBusinessDays.max} business days`}
        </p>
      </CardContent>
    </Card>
  );
};

// Detailed timeline breakdown
interface ETATimelineProps {
  eta: ETACalculation;
  className?: string;
}

export const ETATimeline = ({ eta, className }: ETATimelineProps) => {
  const steps = [
    {
      icon: Package,
      label: 'Pickup',
      duration: formatPickupDate(),
      sublabel: `${eta.breakdown.pickupToWarehouse} day to warehouse`,
    },
    {
      icon: Building,
      label: 'Warehouse QC',
      duration: `${eta.breakdown.warehouseProcessing} day`,
      sublabel: 'Quality check & packaging',
    },
    {
      icon: Truck,
      label: 'International Transit',
      duration: `${eta.breakdown.internationalTransit.min}-${eta.breakdown.internationalTransit.max} days`,
      sublabel: `Via ${eta.carrier}`,
    },
    {
      icon: Clock,
      label: 'Customs Clearance',
      duration: `${eta.breakdown.customsClearance.min}-${eta.breakdown.customsClearance.max} days`,
      sublabel: 'Documentation processing',
    },
    {
      icon: CheckCircle,
      label: 'Delivery',
      duration: `${eta.breakdown.lastMileDelivery.min}-${eta.breakdown.lastMileDelivery.max} days`,
      sublabel: 'Last mile delivery',
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Delivery Timeline
      </h4>
      
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="relative z-10 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                <step.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{step.label}</p>
                  <span className="text-sm font-semibold text-primary">{step.duration}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step.sublabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Compact ETA display
interface ETACompactProps {
  eta: ETACalculation;
  className?: string;
}

export const ETACompact = ({ eta, className }: ETACompactProps) => {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  };

  const earliest = eta.estimatedDeliveryDate.earliest.toLocaleDateString('en-IN', options);
  const latest = eta.estimatedDeliveryDate.latest.toLocaleDateString('en-IN', options);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">
        Delivery by{' '}
        <span className="font-medium">
          {earliest === latest ? earliest : `${earliest} - ${latest}`}
        </span>
      </span>
    </div>
  );
};
