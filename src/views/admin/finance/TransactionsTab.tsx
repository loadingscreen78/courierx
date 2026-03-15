'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, CreditCard, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';

interface WalletTx {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone_number: string | null } | null;
}

interface BankingTx {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export function TransactionsTab() {
  const [walletTxs, setWalletTxs] = useState<WalletTx[]>([]);
  const [bankingTxs, setBankingTxs] = useState<BankingTx[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingBanking, setLoadingBanking] = useState(true);

  const fetchWallet = useCallback(async () => {
    setLoadingWallet(true);
    try {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('id, amount, type, description, created_at, profiles(full_name, phone_number)')
        .order('created_at', { ascending: false })
        .limit(100);
      setWalletTxs((data as any) || []);
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  const fetchBanking = useCallback(async () => {
    setLoadingBanking(true);
    try {
      const { data } = await supabase
        .from('payments')
        .select('id, amount, status, payment_method, created_at, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);
      setBankingTxs((data as any) || []);
    } finally {
      setLoadingBanking(false);
    }
  }, []);

  useEffect(() => { fetchWallet(); fetchBanking(); }, [fetchWallet, fetchBanking]);

  const txTypeColor = (type: string) =>
    type === 'credit' ? 'text-emerald-400' : 'text-red-400';

  return (
    <Tabs defaultValue="wallet">
      <TabsList className="bg-white/5 border border-white/10 rounded-xl p-1 gap-1 mb-4">
        <TabsTrigger value="wallet" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 text-sm px-4 py-2 flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5" /> Wallet
        </TabsTrigger>
        <TabsTrigger value="banking" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 text-sm px-4 py-2 flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5" /> Banking
        </TabsTrigger>
      </TabsList>

      <TabsContent value="wallet">
        {loadingWallet ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
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
                      <span className={`flex items-center gap-1 text-xs font-medium capitalize ${txTypeColor(tx.type)}`}>
                        {tx.type === 'credit'
                          ? <ArrowDownLeft className="h-3 w-3" />
                          : <ArrowUpRight className="h-3 w-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${txTypeColor(tx.type)}`}>
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

      <TabsContent value="banking">
        {loadingBanking ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : bankingTxs.length === 0 ? (
          <div className="text-center py-20">
            <CreditCard className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No banking transactions</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Method</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {bankingTxs.map(tx => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-gray-300">{tx.profiles?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-white font-medium">₹{tx.amount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-400 capitalize text-xs">{tx.payment_method || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] capitalize ${tx.status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : tx.status === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
