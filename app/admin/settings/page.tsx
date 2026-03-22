"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import WarehouseSettings from '@/views/admin/WarehouseSettings';

export default function SettingsPage() {
  return (
    <AdminRoute>
      <WarehouseSettings />
    </AdminRoute>
  );
}
