'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CouponManagement } from './CouponManagement';
import { InvoiceTab } from './finance/InvoiceTab';
import { InvoiceIssuesTab } from './finance/InvoiceIssuesTab';
import { TransactionsTab } from './finance/TransactionsTab';
import { RefundTab } from './finance/RefundTab';
import { DollarSign } from 'lucide-react';

export function FinanceManagement() {
  const [tab, setTab] = useState('invoices');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10">
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Finance</h2>
            <p className="text-sm text-gray-400">Invoices, transactions, coupons &amp; refunds</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <TabsTrigger value="invoices" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 text-sm px-4 py-2">
              Invoice
            </TabsTrigger>
            <TabsTrigger value="invoice-issues" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 text-sm px-4 py-2">
              Invoice Issues
            </TabsTrigger>
            <TabsTrigger value="transactions" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 text-sm px-4 py-2">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="coupons" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 text-sm px-4 py-2">
              Coupons
            </TabsTrigger>
            <TabsTrigger value="refunds" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 text-sm px-4 py-2">
              Refund
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-4">
            <InvoiceTab />
          </TabsContent>
          <TabsContent value="invoice-issues" className="mt-4">
            <InvoiceIssuesTab />
          </TabsContent>
          <TabsContent value="transactions" className="mt-4">
            <TransactionsTab />
          </TabsContent>
          <TabsContent value="coupons" className="mt-4">
            <CouponManagement embedded />
          </TabsContent>
          <TabsContent value="refunds" className="mt-4">
            <RefundTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
