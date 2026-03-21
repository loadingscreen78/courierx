import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Truck, Clock, Star, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { DomesticBookingData, CourierOption } from '@/lib/domestic/types';

interface Props {
  data: DomesticBookingData;
  onUpdate: (updates: Partial<DomesticBookingData>) => void;
}

const DomesticCourierStepComponent = ({ data, onUpdate }: Props) => {
  const { session } = useAuth();
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/domestic/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          pickupPincode: data.pickupAddress.pincode,
          deliveryPincode: data.deliveryAddress.pincode,
          weightKg: data.weightKg,
          lengthCm: data.lengthCm,
          widthCm: data.widthCm,
          heightCm: data.heightCm,
          declaredValue: data.declaredValue,
          shipmentType: data.shipmentType,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || 'Failed to fetch rates');
        return;
      }

      setCouriers(result.couriers || []);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (courier: CourierOption) => {
    onUpdate({ selectedCourier: courier });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-coke-red/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-coke-red" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold">Finding best courier options...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Checking {data.pickupAddress.pincode} → {data.deliveryAddress.pincode}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={fetchRates} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (couriers.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          <Truck className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-medium">No couriers available for this route</p>
        <p className="text-sm text-muted-foreground">
          Try a different pickup or delivery pincode
        </p>
        <Button onClick={fetchRates} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Available Couriers</h3>
          <p className="text-sm text-muted-foreground">
            {couriers.length} option{couriers.length !== 1 ? 's' : ''} for {data.pickupAddress.pincode} → {data.deliveryAddress.pincode}
          </p>
        </div>
        <Button onClick={fetchRates} variant="ghost" size="sm" className="gap-1 text-xs">
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      {/* Courier Cards */}
      <div className="space-y-3">
        {couriers.map((courier) => {
          const isSelected = data.selectedCourier?.courier_company_id === courier.courier_company_id;

          return (
            <Card
              key={courier.courier_company_id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected
                  ? 'border-coke-red bg-coke-red/5 shadow-md ring-1 ring-coke-red/20'
                  : 'border-border hover:border-coke-red/30'
              )}
              onClick={() => handleSelect(courier)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  {/* Left: Courier info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      isSelected ? 'bg-coke-red/15' : 'bg-muted'
                    )}>
                      {isSelected ? (
                        <CheckCircle2 className="h-5 w-5 text-coke-red" />
                      ) : (
                        <Truck className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'font-semibold truncate',
                          isSelected ? 'text-coke-red' : 'text-foreground'
                        )}>
                          {courier.courier_name}
                        </p>
                        {courier.is_recommended && (
                          <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20 shrink-0">
                            <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                            Best Value
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {courier.estimated_delivery_days} day{courier.estimated_delivery_days !== 1 ? 's' : ''}
                        </span>
                        {courier.rating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {courier.rating.toFixed(1)}
                          </span>
                        )}
                        {courier.pickup_availability && (
                          <span className="text-xs text-green-600">Pickup available</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price */}
                  <div className="text-right shrink-0 ml-3">
                    <p className={cn(
                      'text-xl font-bold font-typewriter',
                      isSelected ? 'text-coke-red' : 'text-foreground'
                    )}>
                      ₹{courier.customer_price.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">incl. all charges</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info note */}
      <p className="text-xs text-center text-muted-foreground pt-2">
        Prices include pickup charges. Pickup will be raised automatically after booking.
      </p>
    </div>
  );
};

export const DomesticCourierStep = memo(DomesticCourierStepComponent);
