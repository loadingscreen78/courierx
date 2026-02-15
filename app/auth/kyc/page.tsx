"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AadhaarKyc from '@/views/AadhaarKyc';

export default function KycPage() {
  return (
    <ProtectedRoute>
      <AadhaarKyc />
    </ProtectedRoute>
  );
}
