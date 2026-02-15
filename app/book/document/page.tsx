"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DocumentBooking from '@/views/DocumentBooking';

export default function DocumentBookingPage() {
  return (
    <ProtectedRoute requireKyc>
      <DocumentBooking />
    </ProtectedRoute>
  );
}
