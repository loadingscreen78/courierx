"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import { AdminDashboard } from '@/views/admin';

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}
