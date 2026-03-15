'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet, CreditCard, Loader2, ArrowUpRight, ArrowDownLeft,
  Package, RefreshCw, TrendingUp, IndianRupee,
} from 'lucide-react';
import { format } from 'date-fns';

interface WalletTx {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone_number: string | null } | null;
}

interface CashfreeTx {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  cf_order_id: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

interface ShipmentPayment {
  id: string;
  total_amount: number;
  shipment_type: string;
  tracking_number: string;
  current_status: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${color} bg-white/[0.03]`}>
      <IndianRupee className="h-3.5 w-3.5 opacity-70" />
      <div>
        <p className="text-[10px] uppercase tracking-wider opacity-60">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}

export function TransactionsTab() {
  const [walletTxs, setWalletTxs] = useState<WalletTx[]>([]);
  const [cashfreeTxs, setCashfreeTxs] = useState<CashfreeTx[]>([]);
  const [shipmentPayments, setShipmentPayments] = useState<ShipmentPayment[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingCashfree, setLoadingCashfree] = useState(true);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [outerTab, setOuterTab] = useState('wallet-recharge');

  const fetchWallet = useCallback(async () => {
    setLoadingWallet(true);
    try {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('id, amount, type, description, created_at, profiles(full_name, phone_number)')
        .order('created_at', { ascending: false })
        .limit(200);
      setWalletTxs((data as any) || []);
    } finally { setLoadingWallet(false); }
  }, []);

  const fetchCashfree = useCallback(async () => {
    setLoadingCashfree(true);
    try {
      const { data } = await supabase
        .from('payments')
        .select('id, amount, status, payment_method, cf_order_id, created_at, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(200);
      setCashfreeTxs((data as any) || []);
    } finally { setLoadingCashfree(false); }
  }, []);

  const fetchShipmentPayments = useCallback(async () => {
    setLoadingShipments(true);
    try {
      const { data } = await supabase
        .from('shipments')
        .select('id, total_amount, shipment_type, tracking_number, current_status, created_at, profiles:user_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(200);
      setShipmentPayments((data as any) || []);
    } finally { setLoadingShipments(false); }
  }, []);

  useEffect(() => {
    fetchWallet(); fetchCashfree(); fetchShipmentPayments();

    // Realtime subscriptions
    const walletChannel = supabase
      .channel('admin-wallet-txs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wallet_transactions' }, fetchWallet)
      .subscribe();

    const paymentsChannel = supabase
      .channel('admin-cashfree-txs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, fetchCashfree)
      .subscribe();

    const shipmentsChannel = supabase
      .channel('admin-shipment-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, fetchShipmentPayments)
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(shipmentsChannel);
    };
  }, [fetchWallet, fetchCashfree, fetchShipmentPayments]);

  // Derived stats
  const totalRecharge = cashfreeTxs.filter(t => t.status === 'success').reduce((s, t) => s + (t.amount || 0), 0);
  const totalShipmentRevenue = shipmentPayments.reduce((s, t) => s + (t.total_amount || 0), 0);
  const walletCredits = walletTxs.filter(t => t.type === 'credit').reduce((s, t) => s + (t.amount || 0), 0);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return map[status] || 'bg-white/10 text-gray-400 border-white/10';
  };

  return (
    <div className="space-y-4">
      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Total Recharge (Cashfree)" value={`₹${totalRecharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="border-emerald-500/30 text-emerald-400" />
        <StatPill label="Shipment Revenue" value={`₹${totalShipmentRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="border-blue-500/30 text-blue-400" />
        <StatPill label="Wallet Credits" value={`₹${walletCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="border-purple-500/30 text-purple-400" />
      </div>

      {/* Outer tabs */}
      <Tabs value={outerTab} onValueChange={setOuterTab}>
        <TabsList className="bg-white/5 border border-white/10 rounded-xl p-1 gap-1 mb-4">
          <TabsTrigger value="wallet-recharge" className="rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-gray-400 text-sm px-4 py-2 flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5" />
            Wallet Recharge
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-gray-300">{cashfreeTxs.length}</span>
          </TabsTrigger>
          <TabsTrigger value="shipment-payments" className="rounded-lg data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 text-gray-400 text-sm px-4 py-2 flex items-center gap-2">
            <Package className="h-3.5 w-3.5" />
            Shipment Payments
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-gray-300">{shipmentPayments.length}</span>
          </TabsTrigger>
          <TabsTrigger value="wallet-ledger" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-gray-400 text-sm px-4 py-2 flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5" />
            Wallet Ledger
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-gray-300">{walletTxs.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Wallet Recharge (Cashfree) ── */}
        <TabsContent value="wallet-recharge">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-gray-400 font-medium">Live — Cashfree Payment Gateway</span>
            </div>
            <button onClick={fetchCashfree} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          {loadingCashfree ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /></div>
          ) : cashfreeTxs.length === 0 ? (
            <div className="text-center py-20">
              <CreditCard className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No Cashfree transactions yet</p>
              <p className="text-xs text-gray-600 mt-1">Wallet recharges via Cashfree will appear here in real-time</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Customer</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Amount</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Method</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">CF Order ID</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {cashfreeTxs.map(tx => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-gray-300">{tx.profiles?.full_name || '—'}</td>
                      <td className="px-4 py-3 text-emerald-400 font-bold">₹{tx.amount?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-400 capitalize text-xs">{tx.payment_method || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{tx.cf_order_id || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] capitalize border ${statusBadge(tx.status)}`}>{tx.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Shipment Payments (wallet deductions) ── */}
        <TabsContent value="shipment-payments">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs text-gray-400 font-medium">Live — Wallet deductions for booked shipments</span>
            </div>
            <button onClick={fetchShipmentPayments} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          {loadingShipments ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /></div>
          ) : shipmentPayments.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No shipment payments yet</p>
              <p className="text-xs text-gray-600 mt-1">Amounts paid from wallet for shipments appear here</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Customer</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Tracking</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Amount Paid</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {shipmentPayments.map(tx => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-gray-300">{(tx.profiles as any)?.full_name || '—'}</td>
                      <td className="px-4 py-3 text-white font-mono text-xs">{tx.tracking_number}</td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                          {tx.shipment_type === 'medicine' ? '💊' : tx.shipment_type === 'document' ? '📄' : '🎁'} {tx.shipment_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-blue-400 font-bold">₹{tx.total_amount?.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Badge className="text-[10px] capitalize border bg-white/5 border-white/10 text-gray-400">{tx.current_status?.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Wallet Ledger (all wallet movements) ── */}
        <TabsContent value="wallet-ledger">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs text-gray-400 font-medium">Live — All wallet credits & debits</span>
            </div>
            <button onClick={fetchWallet} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          {loadingWallet ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /></div>
          ) : walletTxs.length === 0 ? (
            <div className="text-center py-20">
              <Wallet className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No wallet transactions</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Customer</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Amount</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Description</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {walletTxs.map(tx => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-gray-300">{tx.profiles?.full_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs font-medium capitalize ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === 'credit' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">{tx.description || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
