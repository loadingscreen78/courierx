"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import { OutboundManifest } from '@/views/admin';

export default function OutboundPage() {
  return (
    <AdminRoute>
      <OutboundManifest />
    </AdminRoute>
  );
}
