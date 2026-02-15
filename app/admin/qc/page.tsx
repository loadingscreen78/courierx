"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import { QCWorkbench } from '@/views/admin';

export default function QCPage() {
  return (
    <AdminRoute>
      <QCWorkbench />
    </AdminRoute>
  );
}
