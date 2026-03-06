"use client";

import { useEffect, useRef, useState, ReactNode, Suspense } from 'react';

interface SectionLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Root margin — how far before the section enters viewport to start loading */
  rootMargin?: string;
  className?: string;
}

/**
 * Lazy-loads a section using IntersectionObserver.
 * The section is rendered only once it's near the viewport.
 * A skeleton fallback is shown until then.
 */
export function SectionLoader({
  children,
  fallback,
  rootMargin = '200px',
  className,
}: SectionLoaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        <Suspense fallback={fallback ?? <SectionSkeleton />}>
          {children}
        </Suspense>
      ) : (
        fallback ?? <SectionSkeleton />
      )}
    </div>
  );
}

/** Generic pulsing skeleton shown while a section hasn't entered the viewport yet */
function SectionSkeleton() {
  return (
    <div className="py-24 animate-pulse" aria-hidden="true">
      <div className="container space-y-8">
        <div className="mx-auto h-6 w-40 rounded-full bg-muted" />
        <div className="mx-auto h-10 w-2/3 rounded-lg bg-muted" />
        <div className="mx-auto h-5 w-1/2 rounded-lg bg-muted" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
