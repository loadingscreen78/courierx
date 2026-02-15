import { Skeleton } from '@/components/ui/skeleton';

interface ListItemSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  className?: string;
}

export const ListItemSkeleton = ({ count = 3, showAvatar = false, className }: ListItemSkeletonProps) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 py-3 border-b border-border last:border-0"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
};
