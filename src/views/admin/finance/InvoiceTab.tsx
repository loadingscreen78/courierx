'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  tracking_number: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; phone_number: string | null } | null;
}

export function InvoiceTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('shipments')
        .select('id, tracking_number, total_amount, status, created_at, profiles(full_name, phone_number)')
        .order('created_at', { ascending: false })
        .limit(100);
      setInvoices((data as any) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const filtered = invoices.filter(inv =>
    !search ||
    inv.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
    inv.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by AWB or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No invoices found</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">AWB</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Customer</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-white text-xs">{inv.tracking_number || '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{inv.profiles?.full_name || '—'}</td>
                  <td className="px-4 py-3 text-white font-medium">₹{inv.total_amount?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge className="text-[10px] capitalize bg-white/10 text-gray-300 border-white/10">{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(inv.created_at), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-500 hover:text-white">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
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
