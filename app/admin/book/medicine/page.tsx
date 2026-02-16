"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import MedicineBooking from '@/views/MedicineBooking';

export default function AdminMedicineBookingPage() {
  return (
    <AdminRoute>
      <MedicineBooking isAdminMode={true} />
    </AdminRoute>
  );
}
