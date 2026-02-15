"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import { RoleManagement } from '@/views/admin';

export default function RolesPage() {
  return (
    <AdminRoute requireAdmin>
      <RoleManagement />
    </AdminRoute>
  );
}
