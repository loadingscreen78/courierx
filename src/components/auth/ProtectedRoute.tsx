"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireKyc?: boolean;
}

export const ProtectedRoute = ({ children, requireKyc = false }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // Extra grace period after initial load to handle post-external-redirect session restore
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Give Supabase a tick to restore session from storage after external redirects
      const t = setTimeout(() => setSettled(true), 300);
      return () => clearTimeout(t);
    }
  }, [loading]);

  useEffect(() => {
    if (settled && !user) {
      router.replace(`/auth?from=${encodeURIComponent(pathname)}`);
    }
  }, [settled, user, pathname, router]);

  useEffect(() => {
    if (!loading && requireKyc && profile && !profile.aadhaar_verified) {
      router.replace(`/auth/kyc?from=${encodeURIComponent(pathname)}`);
    }
  }, [loading, requireKyc, profile, pathname, router]);

  if (loading || !settled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-typewriter">Loading...</p>
        </div>
      </div>
    );
  }

  if (!settled || !user) {
    return null;
  }

  if (requireKyc && profile && !profile.aadhaar_verified) {
    return null;
  }

  return <>{children}</>;
};
