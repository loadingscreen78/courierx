import { Skeleton } from '@/components/ui/skeleton';

export const DocumentsTabSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Aadhaar Card Skeleton */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Other Documents Placeholder */}
      <div className="border-t pt-8 space-y-3">
        <Skeleton className="h-10 w-10 mx-auto rounded-lg" />
        <Skeleton className="h-4 w-48 mx-auto" />
        <Skeleton className="h-3 w-56 mx-auto" />
      </div>
    </div>
  );
};

