"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import History from '@/views/History';

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  );
}
