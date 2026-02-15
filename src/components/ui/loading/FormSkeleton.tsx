import { Skeleton } from '@/components/ui/skeleton';

interface FormSkeletonProps {
  fields?: number;
  showButton?: boolean;
  className?: string;
}

export const FormSkeleton = ({ fields = 3, showButton = true, className }: FormSkeletonProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      {showButton && (
        <Skeleton className="h-10 w-full mt-6" />
      )}
    </div>
  );
};
