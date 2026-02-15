"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ClipboardCheck, 
  Package, 
  ArrowRight, 
  Search,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface QCShipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  destination_country: string;
  shipment_type: string;
  status: string;
  created_at: string;
  weight_kg: number;
}

export default function QCWorkbench() {
  const [shipments, setShipments] = useState<QCShipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress'>('pending');
  const router = useRouter();

  useEffect(() => {
    const fetchShipments = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('shipments')
          .select('*')
          .order('created_at', { ascending: false });

        if (filter === 'pending') {
          query = query.eq('status', 'at_warehouse');
        } else if (filter === 'in_progress') {
          query = query.eq('status', 'qc_in_progress');
        } else {
          query = query.in('status', ['at_warehouse', 'qc_in_progress', 'qc_passed', 'qc_failed']);
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
  }, [filter]);

  const filteredShipments = shipments.filter(s => 
    s.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      at_warehouse: { label: 'Pending QC', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
      qc_in_progress: { label: 'In Progress', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
      qc_passed: { label: 'Passed', className: 'bg-success/10 text-success border-success/30' },
      qc_failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive border-destructive/30' },
    };
    const cfg = config[status] || { label: status, className: '' };
    return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
  };

  const getShipmentTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      medicine: '💊',
      document: '📄',
      gift: '🎁',
    };
    return icons[type] || '📦';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-typewriter font-bold">QC Workbench</h1>
            <p className="text-muted-foreground">Quality control and verification</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
              {shipments.filter(s => s.status === 'at_warehouse').length} Pending
            </Badge>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tracking or recipient..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['pending', 'in_progress', 'all'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f === 'in_progress' ? 'In Progress' : f}
              </Button>
            ))}
          </div>
        </div>

        {/* Shipments List */}
        <div className="space-y-3">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : filteredShipments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold mb-1">No Shipments</h3>
                <p className="text-muted-foreground text-sm">
                  {filter === 'pending' 
                    ? 'No shipments pending QC'
                    : 'No shipments found matching your criteria'
                  }
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                        {getShipmentTypeIcon(shipment.shipment_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-typewriter font-semibold">
                            {shipment.tracking_number || 'No tracking'}
                          </p>
                          {getStatusBadge(shipment.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {shipment.recipient_name} • {shipment.destination_country}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {shipment.weight_kg || '?'} kg
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(shipment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-5 w-5" />
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

