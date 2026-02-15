"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import { InboundStation } from '@/views/admin';

export default function InboundPage() {
  return (
    <AdminRoute>
      <InboundStation />
    </AdminRoute>
  );
}
