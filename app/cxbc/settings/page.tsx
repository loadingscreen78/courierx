"use client";

import { CXBCRoute } from '@/components/cxbc/CXBCRoute';
import { CXBCSettings } from '@/views/cxbc';

export default function CXBCSettingsPage() {
  return (
    <CXBCRoute>
      <CXBCSettings />
    </CXBCRoute>
  );
}
