"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import { AllShipments } from '@/views/admin';

export default function AdminShipmentsPage() {
  return (
    <AdminRoute>
      <AllShipments />
    </AdminRoute>
  );
}
