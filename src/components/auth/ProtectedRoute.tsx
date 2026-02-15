"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireKyc?: boolean;
}

export const ProtectedRoute = ({ children, requireKyc = false }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth?from=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    if (!loading && requireKyc && profile && !profile.aadhaar_verified) {
      router.replace(`/auth/kyc?from=${encodeURIComponent(pathname)}`);
    }
  }, [loading, requireKyc, profile, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-typewriter">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireKyc && profile && !profile.aadhaar_verified) {
    return null;
  }

  return <>{children}</>;
};
