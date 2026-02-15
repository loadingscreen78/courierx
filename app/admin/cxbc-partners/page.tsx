"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import { CXBCPartnerManagement } from '@/views/admin';

export default function CXBCPartnersPage() {
  return (
    <AdminRoute requireAdmin>
      <CXBCPartnerManagement />
    </AdminRoute>
  );
}
