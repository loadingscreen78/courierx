"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import MedicineBooking from '@/views/MedicineBooking';

export default function MedicineBookingPage() {
  return (
    <ProtectedRoute requireKyc>
      <MedicineBooking />
    </ProtectedRoute>
  );
}
