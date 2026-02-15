import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Package, Search, Eye, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCXBCAuth } from '@/hooks/useCXBCAuth';
import { CXBCLayout } from '@/components/cxbc/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Database } from '@/integrations/supabase/types';

type Shipment = Database['public']['Tables']['shipments']['Row'];
type ShipmentStatus = Database['public']['Enums']['shipment_status'];

const statusColors: Record<ShipmentStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  payment_received: 'bg-green-100 text-green-800',
  pickup_scheduled: 'bg-purple-100 text-purple-800',
  out_for_pickup: 'bg-orange-100 text-orange-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  at_warehouse: 'bg-cyan-100 text-cyan-800',
  qc_in_progress: 'bg-yellow-100 text-yellow-800',
  qc_passed: 'bg-green-100 text-green-800',
  qc_failed: 'bg-red-100 text-red-800',
  pending_payment: 'bg-amber-100 text-amber-800',
  dispatched: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-blue-100 text-blue-800',
  customs_clearance: 'bg-orange-100 text-orange-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const CXBCShipments = () => {
  const { partner } = useCXBCAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['cxbc-shipments', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('cxbc_partner_id', partner.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Shipment[];
    },
    enabled: !!partner?.id,
  });

  const filteredShipments = shipments?.filter(shipment => {
    const matchesSearch = 
      shipment.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.destination_country.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && !['delivered', 'cancelled'].includes(shipment.status);
    if (activeTab === 'delivered') return matchesSearch && shipment.status === 'delivered';
    if (activeTab === 'cancelled') return matchesSearch && shipment.status === 'cancelled';
    return matchesSearch;
  }) || [];

  const stats = {
    total: shipments?.length || 0,
    active: shipments?.filter(s => !['delivered', 'cancelled'].includes(s.status)).length || 0,
    delivered: shipments?.filter(s => s.status === 'delivered').length || 0,
    thisMonth: shipments?.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length || 0,
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
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>

            {isLoading ? (
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
                          <Badge className={statusColors[shipment.status]}>
                            {shipment.status.replace(/_/g, ' ')}
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Shipment Details</DialogTitle>
            </DialogHeader>
            {selectedShipment && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={statusColors[selectedShipment.status]}>
                    {selectedShipment.status.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="outline" className="capitalize">{selectedShipment.shipment_type}</Badge>
                </div>

                {selectedShipment.tracking_number && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-mono font-medium">{selectedShipment.tracking_number}</p>
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
