'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCcw, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Refund {
  id: string;
  amount: number;
  status: string;
  reason: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone_number: string | null } | null;
  shipments: { tracking_number: string | null } | null;
}

export function RefundTab() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('refunds')
        .select('id, amount, status, reason, created_at, profiles(full_name, phone_number), shipments(tracking_number)')
        .order('created_at', { ascending: false })
        .limit(100);
      setRefunds((data as any) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="h-3 w-3" />;
    if (status === 'rejected') return <XCircle className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  const statusColor = (status: string) => {
    if (status === 'completed') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (status === 'rejected') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('refunds').update({ status: 'completed' }).eq('id', id);
    if (error) { toast.error('Failed to approve refund'); return; }
    toast.success('Refund approved');
    fetchRefunds();
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from('refunds').update({ status: 'rejected' }).eq('id', id);
    if (error) { toast.error('Failed to reject refund'); return; }
    toast.success('Refund rejected');
    fetchRefunds();
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      ) : refunds.length === 0 ? (
        <div className="text-center py-20">
          <RotateCcw className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No refund requests</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Customer</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">AWB</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Reason</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {refunds.map(refund => (
                <tr key={refund.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-gray-300">{refund.profiles?.full_name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-white text-xs">{refund.shipments?.tracking_number || '—'}</td>
                  <td className="px-4 py-3 text-white font-medium">₹{refund.amount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[160px] truncate">{refund.reason || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] capitalize flex items-center gap-1 w-fit ${statusColor(refund.status)}`}>
                      {statusIcon(refund.status)}{refund.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(refund.created_at), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3">
                    {refund.status === 'pending' && (
                      <div className="flex items-center gap-1">
                        <Button size="sm" onClick={() => handleApprove(refund.id)} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2">
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleReject(refund.id)} className="h-7 text-xs text-red-400 hover:text-red-300 px-2">
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
