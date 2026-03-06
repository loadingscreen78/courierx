import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Package, Search, Eye, ExternalLink, Clock } from 'lucide-react';
import { useCXBCAuth } from '@/hooks/useCXBCAuth';
import { useCXBCShipments } from '@/hooks/useCXBCShipments';
import { supabase } from '@/integrations/supabase/client';
import { getStatusLabel, getStatusDotColor, getLegLabel } from '@/lib/shipment-lifecycle/statusLabelMap';
import type { ShipmentStatus, ShipmentLeg, TimelineEntry } from '@/lib/shipment-lifecycle/types';
import { CXBCLayout } from '@/components/cxbc/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Shipment } from '@/hooks/useShipments';

const SOURCE_LABEL_MAP: Record<string, { label: string; color: string }> = {
  NIMBUS: { label: 'Domestic Tracking', color: 'text-blue-600' },
  INTERNAL: { label: 'Warehouse', color: 'text-purple-600' },
  SIMULATION: { label: 'International', color: 'text-orange-600' },
  SYSTEM: { label: 'System', color: 'text-gray-500' },
};

const CXBCShipments = () => {
  const { partner } = useCXBCAuth();
  const {
    shipments,
    activeShipments,
    deliveredShipments,
    failedShipments,
    loading,
  } = useCXBCShipments(partner?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const timelineSubRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch timeline entries and subscribe to Realtime when a shipment is selected
  useEffect(() => {
    if (!selectedShipment?.id) {
      setTimelineEntries([]);
      return;
    }

    const shipmentId = selectedShipment.id;

    async function fetchTimeline() {
      setTimelineLoading(true);
      try {
        const { data, error } = await supabase
          .from('shipment_timeline')
          .select('*')
          .eq('shipment_id', shipmentId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('[CXBCShipments] Error fetching timeline:', error);
        } else {
          setTimelineEntries((data as unknown as TimelineEntry[]) || []);
        }
      } catch (err) {
        console.error('[CXBCShipments] Error fetching timeline:', err);
      } finally {
        setTimelineLoading(false);
      }
    }

    fetchTimeline();

    // Subscribe to new timeline entries
    const subscription = supabase
      .channel(`cxbc_timeline_${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipment_timeline',
          filter: `shipment_id=eq.${shipmentId}`,
        },
        (payload: any) => {
          const newEntry = payload.new as TimelineEntry;
          setTimelineEntries((prev) => {
            // Maintain chronological order — append and sort by created_at ASC
            const updated = [...prev, newEntry];
            updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return updated;
          });
        }
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[CXBCShipments] Timeline channel error, will refresh on reconnect');
        }
        if (status === 'SUBSCRIBED') {
          fetchTimeline();
        }
      });

    timelineSubRef.current = subscription;

    return () => {
      subscription.unsubscribe();
      timelineSubRef.current = null;
    };
  }, [selectedShipment?.id]);

  const filterBySearch = (list: Shipment[]) =>
    list.filter((shipment) => {
      const q = searchQuery.toLowerCase();
      return (
        shipment.recipient_name.toLowerCase().includes(q) ||
        shipment.tracking_number?.toLowerCase().includes(q) ||
        shipment.destination_country.toLowerCase().includes(q)
      );
    });

  const filteredShipments = (() => {
    if (activeTab === 'active') return filterBySearch(activeShipments);
    if (activeTab === 'delivered') return filterBySearch(deliveredShipments);
    if (activeTab === 'cancelled') return filterBySearch(failedShipments);
    return filterBySearch(shipments);
  })();

  const stats = {
    total: shipments.length,
    active: activeShipments.length,
    delivered: deliveredShipments.length,
    thisMonth: shipments.filter(
      (s) => new Date(s.created_at).getMonth() === new Date().getMonth()
    ).length,
  };

  return (
    <CXBCLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Shipments</h1>
          <p className="text-muted-foreground">Track all shipments booked through your counter</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.thisMonth}</p>
            </CardContent>
          </Card>
        </div>

        {/* Shipments Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>All Shipments</CardTitle>
                <CardDescription>Track shipment status and details</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shipments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                <TabsTrigger value="delivered">Delivered ({stats.delivered})</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled/Failed ({failedShipments.length})</TabsTrigger>
              </TabsList>
            </Tabs>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No shipments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Leg</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-mono text-sm">
                          {shipment.tracking_number || 'Pending'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{shipment.recipient_name}</p>
                            <p className="text-sm text-muted-foreground">{shipment.recipient_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{shipment.destination_country}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{shipment.shipment_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block h-2 w-2 rounded-full ${getStatusDotColor(shipment.current_status as ShipmentStatus)}`} />
                            <span className="text-sm">{getStatusLabel(shipment.current_status as ShipmentStatus)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {getLegLabel(shipment.current_leg as ShipmentLeg)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">₹{shipment.total_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(shipment.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedShipment(shipment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipment Detail Dialog */}
        <Dialog open={!!selectedShipment} onOpenChange={() => setSelectedShipment(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Shipment Details</DialogTitle>
            </DialogHeader>
            {selectedShipment && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${getStatusDotColor(selectedShipment.current_status as ShipmentStatus)}`} />
                    <span className="text-sm font-medium">{getStatusLabel(selectedShipment.current_status as ShipmentStatus)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {getLegLabel(selectedShipment.current_leg as ShipmentLeg)}
                    </Badge>
                    <Badge variant="outline" className="capitalize">{selectedShipment.shipment_type}</Badge>
                  </div>
                </div>

                {selectedShipment.tracking_number && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-mono font-medium">{selectedShipment.tracking_number}</p>
                  </div>
                )}

                {selectedShipment.domestic_awb && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Domestic AWB</p>
                    <p className="font-mono font-medium">{selectedShipment.domestic_awb}</p>
                  </div>
                )}

                {selectedShipment.international_awb && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">International AWB</p>
                    <p className="font-mono font-medium">{selectedShipment.international_awb}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Recipient</p>
                    <p className="font-medium">{selectedShipment.recipient_name}</p>
                    {selectedShipment.recipient_phone && (
                      <p className="text-sm">{selectedShipment.recipient_phone}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p>{selectedShipment.destination_country}</p>
                    <p className="text-sm text-muted-foreground">{selectedShipment.destination_address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p>{selectedShipment.weight_kg || '-'} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Declared Value</p>
                      <p>₹{selectedShipment.declared_value.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span>Shipping Cost</span>
                      <span>₹{selectedShipment.shipping_cost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST</span>
                      <span>₹{selectedShipment.gst_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                      <span>Total</span>
                      <span>₹{selectedShipment.total_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Created: {format(new Date(selectedShipment.created_at), 'dd MMM yyyy, HH:mm')}
                  </div>
                </div>

                {/* Shipment Timeline */}
                <div className="border-t pt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Shipment Timeline</p>
                  </div>
                  {timelineLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : timelineEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No timeline entries yet</p>
                  ) : (
                    <div className="space-y-3">
                      {timelineEntries.map((entry) => {
                        const sourceInfo = SOURCE_LABEL_MAP[entry.source] || { label: entry.source, color: 'text-gray-500' };
                        return (
                          <div key={entry.id} className="flex items-start gap-3">
                            <div className="mt-1.5">
                              <span className={`inline-block h-2 w-2 rounded-full ${getStatusDotColor(entry.status as ShipmentStatus)}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{getStatusLabel(entry.status as ShipmentStatus)}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={sourceInfo.color}>{sourceInfo.label}</span>
                                <span className="text-muted-foreground">
                                  {format(new Date(entry.created_at), 'dd MMM yyyy, HH:mm')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedShipment.tracking_number && (
                  <Button className="w-full" variant="outline" asChild>
                    <a href={`/public/track?tracking=${selectedShipment.tracking_number}`} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Track Shipment
                    </a>
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CXBCLayout>
  );
};

export default CXBCShipments;
