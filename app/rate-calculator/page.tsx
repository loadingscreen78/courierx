"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import RateCalculator from '@/views/RateCalculator';

export default function RateCalculatorPage() {
  return (
    <ProtectedRoute>
      <RateCalculator />
    </ProtectedRoute>
  );
}
