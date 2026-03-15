"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

/**
 * DigiLocker redirects back here after user completes consent.
 * We pass the verification_id back to the KYC page via query params.
 */
function KycCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verificationId = searchParams.get('verification_id');
    const referenceId = searchParams.get('reference_id');

    const params = new URLSearchParams();
    if (verificationId) params.set('verification_id', verificationId);
    if (referenceId) params.set('reference_id', referenceId);

    router.replace(`/auth/kyc?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Completing verification...</p>
    </div>
  );
}

export default function KycCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <KycCallbackInner />
    </Suspense>
  );
}
