"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import { FinanceManagement } from '@/views/admin/FinanceManagement';

export default function FinancePage() {
  return (
    <AdminRoute requireAdmin>
      <FinanceManagement />
    </AdminRoute>
  );
}
