import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  ScanLine, 
  ClipboardCheck, 
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  pendingInbound: number;
  pendingQC: number;
  readyToDispatch: number;
  onHold: number;
  todayProcessed: number;
  avgQCTime: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentShipments, setRecentShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch shipment counts by status with user info
        const { data: shipments, error } = await supabase
          .from('shipments')
          .select(`
            *,
            profiles:user_id (
              full_name,
              email,
              phone
            )
          `);

        if (error) throw error;

        const pendingInbound = shipments?.filter(s => 
          ['pickup_scheduled', 'out_for_pickup', 'picked_up'].includes(s.status)
        ).length || 0;

        const pendingQC = shipments?.filter(s => 
          ['at_warehouse', 'qc_in_progress'].includes(s.status)
        ).length || 0;

        const readyToDispatch = shipments?.filter(s => 
          s.status === 'qc_passed'
        ).length || 0;

        const onHold = shipments?.filter(s => 
          ['qc_failed', 'pending_payment'].includes(s.status)
        ).length || 0;

        // Today's processed
        const today = new Date().toISOString().split('T')[0];
        const todayProcessed = shipments?.filter(s => 
          s.qc_completed_at && s.qc_completed_at.startsWith(today)
        ).length || 0;

        setStats({
          pendingInbound,
          pendingQC,
          readyToDispatch,
          onHold,
          todayProcessed,
          avgQCTime: '~12 min',
        });

        // Fetch recent shipments with user details
        const { data: recent } = await supabase
          .from('shipments')
          .select(`
            *,
            profiles:user_id (
              full_name,
              email,
              phone
            )
          `)
          .order('updated_at', { ascending: false })
          .limit(5);

        setRecentShipments(recent || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    {
      title: 'Pending Inbound',
      value: stats?.pendingInbound || 0,
      icon: ScanLine,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Pending QC',
      value: stats?.pendingQC || 0,
      icon: ClipboardCheck,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Ready to Dispatch',
      value: stats?.readyToDispatch || 0,
      icon: Truck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'On Hold',
      value: stats?.onHold || 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'Draft', variant: 'secondary' },
      payment_received: { label: 'Paid', variant: 'default' },
      pickup_scheduled: { label: 'Pickup Scheduled', variant: 'outline' },
      at_warehouse: { label: 'At Warehouse', variant: 'default' },
      qc_in_progress: { label: 'QC In Progress', variant: 'outline' },
      qc_passed: { label: 'QC Passed', variant: 'default' },
      qc_failed: { label: 'QC Failed', variant: 'destructive' },
      dispatched: { label: 'Dispatched', variant: 'default' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-typewriter font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Warehouse operations overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            statCards.map((stat) => (
              <Card key={stat.title} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-typewriter font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processed Today</p>
                <p className="text-xl font-typewriter font-bold">{stats?.todayProcessed || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg QC Time</p>
                <p className="text-xl font-typewriter font-bold">{stats?.avgQCTime || '--'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Shipments */}
        <Card>
          <CardHeader>
            <CardTitle className="font-typewriter">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentShipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No shipments yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentShipments.map((shipment) => (
                  <div 
                    key={shipment.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/admin/qc/${shipment.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{shipment.tracking_number || 'No tracking'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {shipment.recipient_name} • {shipment.profiles?.full_name || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 ml-2">
                      {getStatusBadge(shipment.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
