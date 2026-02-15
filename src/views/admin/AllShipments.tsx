"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  destination_country: string;
  shipment_type: string;
  status: string;
  created_at: string;
  weight_kg: number;
  total_amount: number;
  user_id: string;
  pickup_address: any;
  consignee_address: any;
  profiles?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'payment_received', label: 'Payment Received' },
  { value: 'pickup_scheduled', label: 'Pickup Scheduled' },
  { value: 'out_for_pickup', label: 'Out for Pickup' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'at_warehouse', label: 'At Warehouse' },
  { value: 'qc_in_progress', label: 'QC In Progress' },
  { value: 'qc_passed', label: 'QC Passed' },
  { value: 'qc_failed', label: 'QC Failed' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
];

export default function AllShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const fetchShipments = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('shipments')
          .select(`
            *,
            profiles:user_id (
              full_name,
              email,
              phone
            )
          `)
          .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter as any);
        }

        if (typeFilter !== 'all') {
          query = query.eq('shipment_type', typeFilter as any);
        }

        const { data, error } = await query;

        if (error) throw error;
        setShipments(data || []);
      } catch (error) {
        console.error('Error fetching shipments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShipments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-shipments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments'
        },
        () => {
          fetchShipments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter, typeFilter]);

  const filteredShipments = shipments.filter(s => 
    s.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.destination_country?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
      payment_received: { label: 'Paid', className: 'bg-success/10 text-success' },
      pickup_scheduled: { label: 'Pickup Scheduled', className: 'bg-blue-500/10 text-blue-600' },
      out_for_pickup: { label: 'Out for Pickup', className: 'bg-blue-500/10 text-blue-600' },
      picked_up: { label: 'Picked Up', className: 'bg-blue-500/10 text-blue-600' },
      at_warehouse: { label: 'At Warehouse', className: 'bg-amber-500/10 text-amber-600' },
      qc_in_progress: { label: 'QC In Progress', className: 'bg-amber-500/10 text-amber-600' },
      qc_passed: { label: 'QC Passed', className: 'bg-success/10 text-success' },
      qc_failed: { label: 'QC Failed', className: 'bg-destructive/10 text-destructive' },
      pending_payment: { label: 'Pending Payment', className: 'bg-destructive/10 text-destructive' },
      dispatched: { label: 'Dispatched', className: 'bg-purple-500/10 text-purple-600' },
      in_transit: { label: 'In Transit', className: 'bg-primary/10 text-primary' },
      delivered: { label: 'Delivered', className: 'bg-success/10 text-success' },
    };
    const cfg = config[status] || { label: status, className: 'bg-muted' };
    return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-typewriter font-bold">All Shipments</h1>
          <p className="text-muted-foreground">View and manage all shipments</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracking, recipient, or country..."
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="medicine">Medicine</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="gift">Gift</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <Badge variant="secondary" className="shrink-0">
            Total: {filteredShipments.length}
          </Badge>
          <Badge variant="outline" className="shrink-0 bg-amber-500/10 text-amber-600">
            Pending QC: {filteredShipments.filter(s => ['at_warehouse', 'qc_in_progress'].includes(s.status)).length}
          </Badge>
          <Badge variant="outline" className="shrink-0 bg-success/10 text-success">
            Ready: {filteredShipments.filter(s => s.status === 'qc_passed').length}
          </Badge>
        </div>

        {/* Shipments List */}
        <div className="space-y-2">
          {isLoading ? (
            Array(10).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))
          ) : filteredShipments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold mb-1">No Shipments Found</h3>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your filters or search query
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredShipments.map((shipment) => (
              <Card 
                key={shipment.id} 
                className="card-hover cursor-pointer"
                onClick={() => router.push(`/admin/qc/${shipment.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                        {shipment.shipment_type === 'medicine' && '💊'}
                        {shipment.shipment_type === 'document' && '📄'}
                        {shipment.shipment_type === 'gift' && '🎁'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-typewriter font-medium">
                            {shipment.tracking_number || 'No tracking'}
                          </p>
                          {getStatusBadge(shipment.status)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          <span className="font-medium">{shipment.recipient_name}</span> → {shipment.destination_country}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          User: {shipment.profiles?.full_name || 'Unknown'} • {shipment.profiles?.email || 'No email'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">
                        ₹{shipment.total_amount?.toLocaleString() || '0'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(shipment.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(shipment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

