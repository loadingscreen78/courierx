"use client";

import { CXBCRoute } from '@/components/cxbc/CXBCRoute';
import { CXBCDashboard } from '@/views/cxbc';

export default function CXBCPage() {
  return (
    <CXBCRoute>
      <CXBCDashboard />
    </CXBCRoute>
  );
}
