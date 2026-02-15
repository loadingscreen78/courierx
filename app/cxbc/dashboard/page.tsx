"use client";

import { CXBCRoute } from '@/components/cxbc/CXBCRoute';
import { CXBCDashboard } from '@/views/cxbc';

export default function CXBCDashboardPage() {
  return (
    <CXBCRoute>
      <CXBCDashboard />
    </CXBCRoute>
  );
}
