"use client";

import { Suspense } from 'react';
import Auth from '@/views/Auth';
import { Loader2 } from 'lucide-react';

function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-typewriter">Loading...</p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <Auth />
    </Suspense>
  );
}
