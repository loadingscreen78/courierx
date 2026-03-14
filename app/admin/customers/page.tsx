"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import { CustomerCRM } from '@/views/admin';

export default function CustomersPage() {
  return (
    <AdminRoute requireAdmin>
      <CustomerCRM />
    </AdminRoute>
  );
}
