"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Shipments from '@/views/Shipments';

export default function ShipmentsPage() {
  return (
    <ProtectedRoute>
      <Shipments />
    </ProtectedRoute>
  );
}
