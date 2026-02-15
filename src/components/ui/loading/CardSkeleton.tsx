import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface CardSkeletonProps {
  hasHeader?: boolean;
  lines?: number;
  className?: string;
}

// Deterministic widths to avoid hydration mismatch
const lineWidths = ['85%', '70%', '90%', '65%', '80%', '75%'];

export const CardSkeleton = ({ hasHeader = true, lines = 3, className }: CardSkeletonProps) => {
  return (
    <Card className={className}>
      {hasHeader && (
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="h-4" 
            style={{ width: lineWidths[i % lineWidths.length] }}
          />
        ))}
      </CardContent>
    </Card>
  );
};
