'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface InvoiceIssue {
  id: string;
  tracking_number: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; phone_number: string | null } | null;
}

const ISSUE_STATUSES = ['payment_failed', 'payment_pending', 'cancelled'];

export function InvoiceIssuesTab() {
  const [issues, setIssues] = useState<InvoiceIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('shipments')
        .select('id, tracking_number, total_amount, status, created_at, profiles(full_name, phone_number)')
        .in('status', ISSUE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(100);
      setIssues((data as any) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const statusColor: Record<string, string> = {
    payment_failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    payment_pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No invoice issues</p>
          <p className="text-sm text-gray-500 mt-1">All invoices are in good standing</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">AWB</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Customer</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Issue</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {issues.map(issue => (
                <tr key={issue.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-white text-xs">{issue.tracking_number || '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{issue.profiles?.full_name || '—'}</td>
                  <td className="px-4 py-3 text-white font-medium">₹{issue.total_amount?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] capitalize ${statusColor[issue.status] || 'bg-white/10 text-gray-300'}`}>
                      <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                      {issue.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(issue.created_at), 'dd MMM yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
