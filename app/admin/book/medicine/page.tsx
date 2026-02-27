"use client";

import { AdminRoute } from '@/components/admin/AdminRoute';
import { AdminLayout } from '@/components/admin/layout';
import MedicineBooking from '@/views/MedicineBooking';

export default function AdminMedicineBookingPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <div className="admin-dark">
          <MedicineBooking isAdminMode={true} />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
