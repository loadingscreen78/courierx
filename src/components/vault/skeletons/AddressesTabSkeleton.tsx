import { Skeleton } from '@/components/ui/skeleton';

export const AddressesTabSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Pickup Section */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        {[1, 2].map((i) => (
          <div key={`pickup-${i}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>

      {/* Delivery Section */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        {[1, 2].map((i) => (
          <div key={`delivery-${i}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>
    </div>
  );
};
