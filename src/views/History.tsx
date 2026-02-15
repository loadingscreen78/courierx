'use client';

import { useState, useEffect } from 'react';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  CalendarIcon,
  FileText,
  Pill,
  Gift,
  CheckCircle2,
  MapPin,
  Truck,
  IndianRupee,
  Download,
  Filter,
  X,
  RefreshCw,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CourierXLoader } from '@/components/landing/CourierXLoader';

type ShipmentType = 'medicine' | 'document' | 'gift';

interface CompletedShipment {
  id: string;
  trackingNumber: string;
  type: ShipmentType;
  origin: string;
  destination: string;
  destinationCountry: string;
  carrier: string;
  deliveredAt: Date;
  createdAt: Date;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  cost: number;
  declaredValue: number;
  weight: number;
  notes: string;
  // Additional details for rebooking
  items?: any[];
  addons?: any[];
}

const TYPE_ICONS: Record<ShipmentType, React.ReactNode> = {
  medicine: <Pill className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  gift: <Gift className="h-4 w-4" />,
};

const TYPE_LABELS: Record<ShipmentType, string> = {
  medicine: 'Medicine',
  document: 'Document',
  gift: 'Gift/Sample',
};

const ShipmentHistoryCard = ({ 
  shipment, 
  onRebook 
}: { 
  shipment: CompletedShipment;
  onRebook: (shipment: CompletedShipment) => void;
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              {TYPE_ICONS[shipment.type]}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-typewriter font-bold text-sm">{shipment.trackingNumber}</p>
                <Badge className="bg-accent/20 text-accent-foreground text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Delivered
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                To: {shipment.recipientName}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {shipment.destination}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-typewriter font-bold">₹{shipment.cost.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(shipment.deliveredAt, 'dd MMM yyyy')}
            </p>
          </div>
        </div>
        
        <Separator className="my-3" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              {shipment.carrier}
            </span>
            <span className="capitalize">{shipment.type}</span>
            <span>Booked: {format(shipment.createdAt, 'dd MMM')}</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs h-8"
            onClick={() => onRebook(shipment)}
          >
            <Repeat className="h-3 w-3" />
            Rebook
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const HistoryPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<ShipmentType | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [completedShipments, setCompletedShipments] = useState<CompletedShipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch completed shipments from database
  useEffect(() => {
    fetchCompletedShipments();
  }, []);

  const fetchCompletedShipments = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in');
        setLoading(false);
        return;
      }

      // Fetch delivered shipments
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'delivered')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching shipments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load shipment history',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      console.log('Fetched shipments:', shipments);

      // Transform database shipments to UI format
      const transformedShipments: CompletedShipment[] = await Promise.all(
        (shipments || []).map(async (shipment) => {
          // Fetch related items based on type
          let items = [];
          if (shipment.shipment_type === 'medicine') {
            const { data } = await supabase
              .from('medicine_items')
              .select('*')
              .eq('shipment_id', shipment.id);
            items = data || [];
          } else if (shipment.shipment_type === 'document') {
            const { data } = await supabase
              .from('document_items')
              .select('*')
              .eq('shipment_id', shipment.id);
            items = data || [];
          } else if (shipment.shipment_type === 'gift') {
            const { data } = await supabase
              .from('gift_items')
              .select('*')
              .eq('shipment_id', shipment.id);
            items = data || [];
          }

          // Fetch addons
          const { data: addons } = await supabase
            .from('shipment_addons')
            .select('*')
            .eq('shipment_id', shipment.id);

          return {
            id: shipment.id,
            trackingNumber: shipment.tracking_number || 'N/A',
            type: shipment.shipment_type as ShipmentType,
            origin: shipment.origin_address,
            destination: shipment.destination_address,
            destinationCountry: shipment.destination_country,
            carrier: getCarrierForCountry(shipment.destination_country),
            deliveredAt: new Date(shipment.updated_at),
            createdAt: new Date(shipment.created_at),
            recipientName: shipment.recipient_name,
            recipientPhone: shipment.recipient_phone || '',
            recipientEmail: shipment.recipient_email || '',
            cost: Number(shipment.total_amount),
            declaredValue: Number(shipment.declared_value),
            weight: Number(shipment.weight_kg),
            notes: shipment.notes || '',
            items: items,
            addons: addons || [],
          };
        })
      );

      setCompletedShipments(transformedShipments);
      console.log('Transformed shipments:', transformedShipments);
    } catch (error) {
      console.error('Error in fetchCompletedShipments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shipment history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to assign carrier based on country
  const getCarrierForCountry = (countryCode: string): string => {
    const gccCountries = ['AE', 'SA', 'QA', 'KW', 'BH', 'OM'];
    if (gccCountries.includes(countryCode)) {
      return 'Aramex';
    }
    return 'DHL Express';
  };

  // Handle rebook - save shipment data to localStorage and navigate to booking page
  const handleRebook = (shipment: CompletedShipment) => {
    try {
      // Create rebook data with all shipment info except addresses
      const rebookData = {
        type: shipment.type,
        items: shipment.items,
        addons: shipment.addons,
        declaredValue: shipment.declaredValue,
        weight: shipment.weight,
        notes: shipment.notes,
        // Addresses will be editable by user
        destinationCountry: shipment.destinationCountry,
        recipientName: '', // User can change
        recipientPhone: '', // User can change
        recipientEmail: '', // User can change
        originAddress: '', // User must enter
        destinationAddress: '', // User must enter
      };

      // Save to localStorage
      localStorage.setItem('rebookShipment', JSON.stringify(rebookData));

      toast({
        title: 'Rebook Initiated',
        description: 'Shipment details loaded. Please update addresses.',
      });

      // Navigate to appropriate booking page
      if (shipment.type === 'medicine') {
        router.push('/book/medicine');
      } else if (shipment.type === 'document') {
        router.push('/book/document');
      } else if (shipment.type === 'gift') {
        router.push('/book/gift');
      }
    } catch (error) {
      console.error('Error rebooking:', error);
      toast({
        title: 'Error',
        description: 'Failed to rebook shipment',
        variant: 'destructive',
      });
    }
  };

  const filteredShipments = completedShipments.filter(shipment => {
    // Type filter
    if (typeFilter !== 'all' && shipment.type !== typeFilter) {
      return false;
    }
    
    // Date range filter
    if (dateRange.from && dateRange.to) {
      const isInRange = isWithinInterval(shipment.deliveredAt, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to),
      });
      if (!isInRange) return false;
    }
    
    return true;
  });

  // Calculate stats
  const totalSpent = filteredShipments.reduce((sum, s) => sum + s.cost, 0);
  const typeBreakdown = {
    medicine: filteredShipments.filter(s => s.type === 'medicine').length,
    document: filteredShipments.filter(s => s.type === 'document').length,
    gift: filteredShipments.filter(s => s.type === 'gift').length,
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setDateRange({ from: subDays(new Date(), 30), to: new Date() });
  };

  const hasActiveFilters = typeFilter !== 'all';

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <CourierXLoader />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-typewriter text-2xl font-bold">Shipment History</h1>
          <p className="text-sm text-muted-foreground">
            View all your completed deliveries
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Date Range Picker */}
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal flex-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd MMM')} - {format(dateRange.to, 'dd MMM yyyy')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd MMM yyyy')
                      )
                    ) : (
                      <span>Pick date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range: any) => {
                      setDateRange({ from: range?.from, to: range?.to });
                      if (range?.from && range?.to) {
                        setIsDatePickerOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ShipmentType | 'all')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="medicine">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Medicine
                    </div>
                  </SelectItem>
                  <SelectItem value="document">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Document
                    </div>
                  </SelectItem>
                  <SelectItem value="gift">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Gift/Sample
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="font-typewriter text-2xl font-bold">{filteredShipments.length}</p>
              <p className="text-xs text-muted-foreground">Shipments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="font-typewriter text-2xl font-bold text-primary">
                ₹{totalSpent.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </CardContent>
          </Card>
          <Card className="hidden md:block">
            <CardContent className="py-4">
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Pill className="h-3 w-3 text-destructive" />
                  <span>{typeBreakdown.medicine}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-primary" />
                  <span>{typeBreakdown.document}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gift className="h-3 w-3 text-accent-foreground" />
                  <span>{typeBreakdown.gift}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1">By Type</p>
            </CardContent>
          </Card>
          <Card className="hidden md:block">
            <CardContent className="py-4 text-center">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Download CSV</p>
            </CardContent>
          </Card>
        </div>

        {/* Shipment List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Completed Deliveries
              <Badge variant="outline" className="ml-auto font-typewriter">
                {filteredShipments.length} results
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredShipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No shipments found for the selected filters</p>
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              </div>
            ) : (
              filteredShipments.map(shipment => (
                <ShipmentHistoryCard 
                  key={shipment.id} 
                  shipment={shipment}
                  onRebook={handleRebook}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default HistoryPage;
