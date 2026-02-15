"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import { QCDetail } from '@/views/admin';

export default function QCDetailPage() {
  return (
    <AdminRoute>
      <QCDetail />
    </AdminRoute>
  );
}
