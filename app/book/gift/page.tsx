"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import GiftBooking from '@/views/GiftBooking';

export default function GiftBookingPage() {
  return (
    <ProtectedRoute requireKyc>
      <GiftBooking />
    </ProtectedRoute>
  );
}
