"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Support from '@/views/Support';

export default function SupportPage() {
  return (
    <ProtectedRoute>
      <Support />
    </ProtectedRoute>
  );
}
