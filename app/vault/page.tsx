"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import MyVault from '@/views/MyVault';

export default function VaultPage() {
  return (
    <ProtectedRoute>
      <MyVault />
    </ProtectedRoute>
  );
}
