"use client";

import { CXBCRoute } from '@/components/cxbc/CXBCRoute';
import { CXBCRateCalculator } from '@/views/cxbc';

export default function CXBCRateCalculatorPage() {
  return (
    <CXBCRoute>
      <CXBCRateCalculator />
    </CXBCRoute>
  );
}
