"use client";

import { CXBCRoute } from '@/components/cxbc/CXBCRoute';
import { CXBCWallet } from '@/views/cxbc';

export default function CXBCWalletPage() {
  return (
    <CXBCRoute>
      <CXBCWallet />
    </CXBCRoute>
  );
}
