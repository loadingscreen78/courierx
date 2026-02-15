"use client";

import { CXBCRoute } from '@/components/cxbc/CXBCRoute';
import { CXBCBooking } from '@/views/cxbc';

export default function CXBCBookPage() {
  return (
    <CXBCRoute>
      <CXBCBooking />
    </CXBCRoute>
  );
}
