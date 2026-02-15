"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Index from '@/views/Index';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Index />
    </ProtectedRoute>
  );
}
