"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CXBCLayout } from '@/components/cxbc/layout';
import { useCXBCAuth } from '@/hooks/useCXBCAuth';
import { useCXBCDrafts } from '@/hooks/useCXBCDrafts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Calculator,
  Wallet,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  IndianRupee,
  FileText,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  todayBookings: number;
  todayRevenue: number;
  pendingShipments: number;
  totalBookings: number;
}

interface RecentBooking {
  id: string;
  recipient_name: string;
  destination_country: string;
  shipment_type: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export default function CXBCDashboard() {
  const { partner } = useCXBCAuth();
  const { drafts } = useCXBCDrafts(partner?.id);
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    todayRevenue: 0,
    pendingShipments: 0,
    totalBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (partner) {
      fetchDashboardData();
    }
  }, [partner]);

  const fetchDashboardData = async () => {
    if (!partner) return;

    try {
      setIsLoading(true);
      
      // Fetch today's bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('cxbc_partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const todayShipments = shipments?.filter(s => 
        new Date(s.created_at) >= today
      ) || [];

      setStats({
        todayBookings: todayShipments.length,
        todayRevenue: todayShipments.reduce((sum, s) => sum + s.total_amount, 0),
        pendingShipments: shipments?.filter(s => 
          !['delivered', 'cancelled'].includes(s.status)
        ).length || 0,
        totalBookings: shipments?.length || 0,
      });

      setRecentBookings(shipments?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-success text-success-foreground';
      case 'in_transit': return 'bg-primary text-primary-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-warning text-warning-foreground';
    }
  };

  return (
    <CXBCLayout title="Dashboard" subtitle="Welcome back to your partner portal">
      <div className="space-y-6">
        {/* Pending Drafts Alert */}
        {drafts.length > 0 && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-warning/20">
                    <Edit className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium">You have {drafts.length} pending draft{drafts.length > 1 ? 's' : ''}</p>
                    <p className="text-sm text-muted-foreground">
                      Continue where you left off
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/cxbc/book">
                    Resume
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Button asChild size="lg" className="h-auto py-4 flex-col gap-2">
            <Link href="/cxbc/book">
              <Plus className="h-6 w-6" />
              <span>New Booking</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-auto py-4 flex-col gap-2">
            <Link href="/cxbc/rate-calculator">
              <Calculator className="h-6 w-6" />
              <span>Rate Calculator</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-auto py-4 flex-col gap-2">
            <Link href="/cxbc/wallet">
              <Wallet className="h-6 w-6" />
              <span>Add Funds</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-auto py-4 flex-col gap-2">
            <Link href="/cxbc/bills">
              <FileText className="h-6 w-6" />
              <span>View Bills</span>
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Today&apos;s Bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.todayBookings}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Today&apos;s Revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Shipments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pendingShipments}</p>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-primary-foreground/80">
                <Wallet className="h-4 w-4" />
                Wallet Balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(partner?.wallet_balance || 0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Profit Margin Card */}
        {partner && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Your Profit Margin</CardTitle>
                  <CardDescription>Current margin applied to all bookings</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/cxbc/settings">
                    Adjust Margin
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success transition-all duration-500"
                    style={{ width: `${Math.min(partner.profit_margin_percent / 2, 100)}%` }}
                  />
                </div>
                <Badge variant="outline" className="text-lg font-bold px-4 py-1">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {partner.profit_margin_percent}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Drafts */}
        {drafts.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Saved Drafts</CardTitle>
                  <CardDescription>Incomplete bookings you can resume</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/cxbc/book">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {drafts.slice(0, 3).map((draft) => (
                  <Link
                    key={draft.id}
                    href="/cxbc/book"
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-muted">
                        <Edit className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{draft.shipment_type} Shipment</p>
                        <p className="text-sm text-muted-foreground">
                          {draft.customer_name || 'No customer'} • {draft.destination_country || 'No destination'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(draft.updated_at), 'dd MMM, HH:mm')}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Draft
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Bookings</CardTitle>
                <CardDescription>Your latest customer shipments</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/cxbc/shipments">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No bookings yet</p>
                <Button asChild className="mt-4">
                  <Link href="/cxbc/book">Create Your First Booking</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-muted">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{booking.recipient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.destination_country} • {booking.shipment_type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(booking.total_amount)}</p>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CXBCLayout>
  );
}


