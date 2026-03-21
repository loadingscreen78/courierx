"use client";

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className }: PageTransitionProps) => {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timeout = setTimeout(() => {
      setIsTransitioning(false);
    }, 150);

    return () => clearTimeout(timeout);
  // Only trigger on route changes, NOT on children prop changes (would flicker on every keystroke)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      className={cn(
        'transition-all duration-200 ease-smooth',
        isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0',
        className
      )}
    >
      {children}
    </div>
  );
};
