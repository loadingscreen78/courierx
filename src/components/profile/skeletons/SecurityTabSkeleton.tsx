import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const SecurityTabSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Password Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>

      {/* Active Sessions Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-destructive/50">
        <CardHeader>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-36" />
        </CardContent>
      </Card>
    </div>
  );
};
