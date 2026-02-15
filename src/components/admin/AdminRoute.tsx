"use client";

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const AdminRoute = ({ children, requireAdmin = false }: AdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAdminAccess, isAdmin, isLoading: roleLoading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[AdminRoute] No user, redirecting to auth');
      router.replace(`/auth?panel=admin&from=${encodeURIComponent(pathname)}`);
    }
  }, [authLoading, user, pathname, router]);

  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      const hasRequiredRole = requireAdmin ? isAdmin : hasAdminAccess;
      console.log('[AdminRoute] Role check:', { 
        requireAdmin, 
        isAdmin, 
        hasAdminAccess, 
        hasRequiredRole,
        pathname 
      });
      if (!hasRequiredRole) {
        console.log('[AdminRoute] ❌ No required role, redirecting to auth');
        router.replace(`/auth?panel=admin&from=${encodeURIComponent(pathname)}`);
      } else {
        console.log('[AdminRoute] ✅ Has required role, allowing access');
      }
    }
  }, [authLoading, roleLoading, user, requireAdmin, isAdmin, hasAdminAccess, router, pathname]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const hasRequiredRole = requireAdmin ? isAdmin : hasAdminAccess;

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-typewriter font-bold">Access Denied</h1>
          <p className="text-muted-foreground max-w-md">
            You don&apos;t have permission to access this area. 
            Please contact an administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
