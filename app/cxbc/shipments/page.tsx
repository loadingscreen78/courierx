"use client";

import { CXBCRoute } from '@/components/cxbc/CXBCRoute';
import { CXBCShipments } from '@/views/cxbc';

export default function CXBCShipmentsPage() {
  return (
    <CXBCRoute>
      <CXBCShipments />
    </CXBCRoute>
  );
}
