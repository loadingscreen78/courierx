"use client";

import { CXBCRoute } from '@/components/cxbc/CXBCRoute';
import { CXBCBills } from '@/views/cxbc';

export default function CXBCBillsPage() {
  return (
    <CXBCRoute>
      <CXBCBills />
    </CXBCRoute>
  );
}
