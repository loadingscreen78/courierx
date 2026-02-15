import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Truck,
  Package,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Plane,
  Warehouse,
  ClipboardCheck,
  Globe,
  Home,
  FileText,
  Pill,
  Gift,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShipments, getShipmentDetails, type Shipment as DBShipment, type ShipmentWithItems } from '@/hooks/useShipments';
import { supabase } from '@/integrations/supabase/client';

// Version: 2.0.0 - Fixed status mapping and added defensive coding

type ShipmentStatus = 
  | 'draft'
  | 'booking_confirmed'
  | 'domestic_pickup'
  | 'arrived_warehouse'
  | 'qc_passed'
  | 'qc_failed'
  | 'handed_to_carrier'
  | 'customs_clearance'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

type ShipmentType = 'medicine' | 'document' | 'gift';

interface TimelineEvent {
  status: ShipmentStatus;
  title: string;
  description: string;
  date: Date | null;
  completed: boolean;
  current: boolean;
  failed?: boolean;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  type: ShipmentType;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  destinationCountry: string;
  carrier: string;
  estimatedDelivery: Date;
  createdAt: Date;
  recipientName: string;
  timeline: TimelineEvent[];
  totalAmount: number;
  declaredValue: number;
  weight: number | null;
}

// Helper function to generate timeline based on current status
function generateTimeline(status: ShipmentStatus, createdAt: Date): TimelineEvent[] {
  const statusOrder: ShipmentStatus[] = [
    'booking_confirmed',
    'domestic_pickup',
    'arrived_warehouse',
    'qc_passed',
    'handed_to_carrier',
    'customs_clearance',
    'out_for_delivery',
    'delivered',
  ];

  const currentIndex = statusOrder.indexOf(status);
  const isQCFailed = status === 'qc_failed';

  return statusOrder.map((s, index) => {
    let completed = index < currentIndex || (s === status && status !== 'qc_failed');
    let current = s === status && !isQCFailed;
    let failed = false;

    // Handle QC failed case
    if (isQCFailed && s === 'qc_passed') {
      completed = false;
      current = true;
      failed = true;
    }

    // Generate approximate dates for completed events
    let date: Date | null = null;
    if (completed || current) {
      const daysOffset = index * 1; // Each step takes ~1 day
      date = new Date(createdAt);
      date.setDate(date.getDate() + daysOffset);
    }

    return {
      status: s,
      title: getStatusTitle(s),
      description: getStatusDescription(s),
      date,
      completed,
      current,
      failed,
    };
  });
}

function getStatusTitle(status: ShipmentStatus): string {
  const titles: Record<ShipmentStatus, string> = {
    draft: 'Draft',
    booking_confirmed: 'Booking Confirmed',
    domestic_pickup: 'Domestic Pickup',
    arrived_warehouse: 'Arrived at Warehouse',
    qc_passed: 'Quality Check Passed',
    qc_failed: 'Quality Check Failed',
    handed_to_carrier: 'Handed to Carrier',
    customs_clearance: 'Customs Clearance',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return titles[status] || status;
}

function getStatusDescription(status: ShipmentStatus): string {
  const descriptions: Record<ShipmentStatus, string> = {
    draft: 'Shipment is being prepared',
    booking_confirmed: 'Your shipment has been booked',
    domestic_pickup: 'Package picked up from origin',
    arrived_warehouse: 'Package received at CourierX facility',
    qc_passed: 'Package cleared internal verification',
    qc_failed: 'Additional documentation required',
    handed_to_carrier: 'Package dispatched for international transit',
    customs_clearance: 'Being processed at destination customs',
    out_for_delivery: 'Package with delivery partner',
    delivered: 'Package delivered successfully',
    cancelled: 'Shipment cancelled',
  };
  return descriptions[status] || '';
}

// Helper to get carrier name based on destination
function getCarrierName(country: string): string {
  const carriers: Record<string, string> = {
    'AE': 'Aramex',
    'SA': 'Aramex',
    'US': 'FedEx',
    'GB': 'DHL Express',
    'CA': 'FedEx',
    'AU': 'DHL Express',
    'SG': 'DHL Express',
  };
  return carriers[country] || 'FedEx';
}

// Transform DB shipment to UI shipment
function transformShipment(dbShipment: DBShipment): Shipment {
  const createdAt = new Date(dbShipment.created_at);
  const estimatedDelivery = new Date(createdAt);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7); // Estimate 7 days

  // Map database status to UI status
  const statusMap: Record<string, ShipmentStatus> = {
    'draft': 'draft',
    'confirmed': 'booking_confirmed',
    'booking_confirmed': 'booking_confirmed',
    'payment_received': 'booking_confirmed',
    'pickup_scheduled': 'booking_confirmed',
    'out_for_pickup': 'domestic_pickup',
    'picked_up': 'domestic_pickup',
    'domestic_pickup': 'domestic_pickup',
    'at_warehouse': 'arrived_warehouse',
    'arrived_warehouse': 'arrived_warehouse',
    'qc_in_progress': 'arrived_warehouse',
    'qc_passed': 'qc_passed',
    'qc_failed': 'qc_failed',
    'pending_payment': 'qc_failed',
    'dispatched': 'handed_to_carrier',
    'handed_to_carrier': 'handed_to_carrier',
    'in_transit': 'handed_to_carrier',
    'customs_clearance': 'customs_clearance',
    'customs_cleared': 'customs_clearance',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
  };

  const displayStatus = statusMap[dbShipment.status] || 'booking_confirmed';

  return {
    id: dbShipment.id,
    trackingNumber: dbShipment.tracking_number,
    type: dbShipment.shipment_type,
    status: displayStatus,
    origin: dbShipment.origin_address,
    destination: dbShipment.destination_address,
    destinationCountry: dbShipment.destination_country,
    carrier: getCarrierName(dbShipment.destination_country),
    estimatedDelivery,
    createdAt,
    recipientName: dbShipment.recipient_name,
    timeline: generateTimeline(displayStatus, createdAt),
    totalAmount: dbShipment.total_amount,
    declaredValue: dbShipment.declared_value,
    weight: dbShipment.weight_kg,
  };
}

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: <Circle className="h-4 w-4" /> },
  booking_confirmed: { label: 'Booking Confirmed', color: 'bg-primary/20 text-primary', icon: <CheckCircle2 className="h-4 w-4" /> },
  domestic_pickup: { label: 'Picked Up', color: 'bg-accent/20 text-accent-foreground', icon: <Truck className="h-4 w-4" /> },
  arrived_warehouse: { label: 'At Warehouse', color: 'bg-accent/20 text-accent-foreground', icon: <Warehouse className="h-4 w-4" /> },
  qc_passed: { label: 'QC Passed', color: 'bg-accent/20 text-accent-foreground', icon: <ClipboardCheck className="h-4 w-4" /> },
  qc_failed: { label: 'QC Failed', color: 'bg-destructive/20 text-destructive', icon: <AlertTriangle className="h-4 w-4" /> },
  handed_to_carrier: { label: 'In Transit', color: 'bg-primary/20 text-primary', icon: <Plane className="h-4 w-4" /> },
  customs_clearance: { label: 'Customs', color: 'bg-warning/20 text-warning', icon: <Globe className="h-4 w-4" /> },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-accent/20 text-accent-foreground', icon: <Truck className="h-4 w-4" /> },
  delivered: { label: 'Delivered', color: 'bg-accent text-accent-foreground', icon: <Home className="h-4 w-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground', icon: <Circle className="h-4 w-4" /> },
};

const TYPE_ICONS: Record<ShipmentType, React.ReactNode> = {
  medicine: <Pill className="h-5 w-5" />,
  document: <FileText className="h-5 w-5" />,
  gift: <Gift className="h-5 w-5" />,
};

const ShipmentCard = ({ shipment, onClick }: { shipment: Shipment; onClick: () => void }) => {
  // Safety check for shipment object
  if (!shipment) {
    console.error('[ShipmentCard] Shipment is undefined!');
    return null;
  }

  // Get status config with fallback
  const statusConfig = STATUS_CONFIG[shipment.status] || {
    label: 'Unknown',
    color: 'bg-muted text-muted-foreground',
    icon: <Circle className="h-4 w-4" />
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 card-hover"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Icon */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              shipment.status === 'qc_failed' ? 'bg-destructive/10' : 'bg-muted'
            )}>
              {TYPE_ICONS[shipment.type] || <Package className="h-5 w-5" />}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-typewriter font-bold text-sm truncate">{shipment.trackingNumber}</p>
                <Badge className={cn("text-xs shrink-0", statusConfig?.color || 'bg-muted text-muted-foreground')}>
                  {statusConfig?.icon || <Circle className="h-4 w-4" />}
                  <span className="ml-1">{statusConfig?.label || 'Unknown'}</span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                To: <span className="font-medium">{shipment.recipientName}</span>, {shipment.destination}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {shipment.carrier}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ETA: {format(shipment.estimatedDelivery, 'dd MMM')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Arrow */}
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const TimelineView = ({ timeline }: { timeline: TimelineEvent[] }) => {
  return (
    <div className="relative">
      {timeline.map((event, index) => {
        const isLast = index === timeline.length - 1;
        
        return (
          <div key={event.status} className="flex gap-4">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2",
                event.completed && !event.failed && "bg-accent border-accent",
                event.failed && "bg-destructive border-destructive",
                event.current && !event.failed && "bg-primary border-primary",
                !event.completed && !event.current && "bg-background border-muted-foreground/30"
              )}>
                {event.completed ? (
                  event.failed ? (
                    <AlertTriangle className="h-4 w-4 text-destructive-foreground" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
                  )
                ) : (
                  <Circle className={cn(
                    "h-4 w-4",
                    event.current ? "text-primary-foreground" : "text-muted-foreground/30"
                  )} />
                )}
              </div>
              {!isLast && (
                <div className={cn(
                  "w-0.5 h-16 -my-1",
                  event.completed ? "bg-accent" : "bg-muted-foreground/20"
                )} />
              )}
            </div>
            
            {/* Event content */}
            <div className={cn(
              "flex-1 pb-8",
              !event.completed && !event.current && "opacity-50"
            )}>
              <div className="flex items-center gap-2">
                <p className={cn(
                  "font-medium text-sm",
                  event.failed && "text-destructive"
                )}>
                  {event.title}
                </p>
                {event.current && (
                  <Badge variant="outline" className="text-xs">Current</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {event.description}
              </p>
              {event.date && (
                <p className="text-xs text-muted-foreground mt-1 font-typewriter">
                  {format(event.date, 'dd MMM yyyy, hh:mm a')}
                </p>
              )}
              {event.failed && (
                <Button size="sm" variant="destructive" className="mt-2">
                  Upload Documents
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ShipmentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [shipmentDetails, setShipmentDetails] = useState<ShipmentWithItems | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const { shipments: dbShipments, loading, error } = useShipments();

  // Debug: Log the raw shipments from database
  useEffect(() => {
    console.log('[Shipments] Raw DB shipments:', dbShipments);
    console.log('[Shipments] Count:', dbShipments.length);
    if (dbShipments.length > 0) {
      console.log('[Shipments] First shipment:', dbShipments[0]);
    }
  }, [dbShipments]);

  // Transform DB shipments to UI shipments
  const shipments = dbShipments.map(transformShipment);

  console.log('[Shipments] Transformed shipments:', shipments);

  const filteredShipments = shipments.filter(shipment =>
    shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show all shipments including draft for now
  const activeShipments = filteredShipments.filter(s => !['delivered', 'cancelled'].includes(s.status));
  const needsAttention = filteredShipments.filter(s => s.status === 'qc_failed');
  const inTransit = filteredShipments.filter(s => s.status === 'handed_to_carrier');
  const atCustoms = filteredShipments.filter(s => s.status === 'customs_clearance');

  // Load shipment details when selected
  useEffect(() => {
    if (selectedShipment) {
      setLoadingDetails(true);
      getShipmentDetails(selectedShipment.id).then(details => {
        setShipmentDetails(details);
        setLoadingDetails(false);
      });
    } else {
      setShipmentDetails(null);
    }
  }, [selectedShipment]);

  return (
    <AppLayout>
      <div className="space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div>
          <h1 className="font-typewriter text-2xl font-bold">Track Shipments</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your active shipments in real-time
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-6 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <>
            {/* Stats Grid - Admin Panel Style */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">In Transit</p>
                      <p className="font-typewriter text-2xl font-bold mt-1">
                        {inTransit.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Plane className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">At Customs</p>
                      <p className="font-typewriter text-2xl font-bold mt-1">
                        {atCustoms.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Need Action</p>
                      <p className="font-typewriter text-2xl font-bold mt-1 text-destructive">
                        {needsAttention.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tracking number, recipient, or destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Needs Attention */}
            {needsAttention.length > 0 && (
              <Card className="border-destructive bg-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Needs Your Attention ({needsAttention.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {needsAttention.map(shipment => (
                    <ShipmentCard 
                      key={shipment.id} 
                      shipment={shipment} 
                      onClick={() => setSelectedShipment(shipment)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Active Shipments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Active Shipments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeShipments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Truck className="h-8 w-8 opacity-50" />
                    </div>
                    <h3 className="font-semibold mb-1">No active shipments</h3>
                    <p className="text-sm mb-4">Start shipping your medicines, documents, or gifts internationally</p>
                    <Button variant="default" className="bg-coke-red hover:bg-coke-red/90" asChild>
                      <a href="/">Book a new shipment</a>
                    </Button>
                  </div>
                ) : (
                  activeShipments
                    .filter(s => s.status !== 'qc_failed')
                    .map(shipment => (
                      <ShipmentCard 
                        key={shipment.id} 
                        shipment={shipment} 
                        onClick={() => setSelectedShipment(shipment)}
                      />
                    ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Shipment Detail Sheet */}
      <Sheet open={!!selectedShipment} onOpenChange={() => setSelectedShipment(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedShipment && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center gap-2">
                  {TYPE_ICONS[selectedShipment.type]}
                  <span className="font-typewriter">{selectedShipment.trackingNumber}</span>
                </SheetTitle>
              </SheetHeader>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-sm", STATUS_CONFIG[selectedShipment.status].color)}>
                      {STATUS_CONFIG[selectedShipment.status].icon}
                      <span className="ml-1">{STATUS_CONFIG[selectedShipment.status].label}</span>
                    </Badge>
                  </div>

                  {/* Route Info */}
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">From</p>
                          <p className="font-medium text-sm">{selectedShipment.origin}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-0.5 bg-muted-foreground/30" />
                          <Plane className="h-4 w-4 text-muted-foreground" />
                          <div className="w-8 h-0.5 bg-muted-foreground/30" />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-xs text-muted-foreground">To</p>
                          <p className="font-medium text-sm">{selectedShipment.destination}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Recipient</p>
                      <p className="font-medium">{selectedShipment.recipientName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Carrier</p>
                      <p className="font-medium">{selectedShipment.carrier}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Booked On</p>
                      <p className="font-typewriter">{format(selectedShipment.createdAt, 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Est. Delivery</p>
                      <p className="font-typewriter">{format(selectedShipment.estimatedDelivery, 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Amount</p>
                      <p className="font-typewriter font-bold">₹{selectedShipment.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Weight</p>
                      <p className="font-typewriter">{selectedShipment.weight ? `${selectedShipment.weight.toFixed(2)} kg` : 'N/A'}</p>
                    </div>
                  </div>

                  {/* Shipment Type Specific Details */}
                  {shipmentDetails && (
                    <>
                      {selectedShipment.type === 'medicine' && shipmentDetails.medicine_items && shipmentDetails.medicine_items.length > 0 && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Medicine Items</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {shipmentDetails.medicine_items.map((item: any, index: number) => (
                              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                                <p className="font-medium text-sm">{item.medicine_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.medicine_type} • {item.form} • Qty: {item.unit_count}
                                </p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {shipmentDetails.shipment_addons && shipmentDetails.shipment_addons.length > 0 && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Add-ons</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {shipmentDetails.shipment_addons.map((addon: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                <span className="text-sm">{addon.addon_name}</span>
                                <span className="font-typewriter text-sm">₹{addon.addon_cost}</span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  <Separator />

                  {/* Timeline */}
                  <div>
                    <h4 className="font-medium mb-4">Shipment Timeline</h4>
                    <TimelineView timeline={selectedShipment.timeline} />
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default ShipmentsPage;
