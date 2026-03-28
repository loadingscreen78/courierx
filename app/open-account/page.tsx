"use client";

import { Suspense } from 'react';
import OpenAccount from '@/views/OpenAccount';

export default function OpenAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <OpenAccount />
    </Suspense>
  );
}
