import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const NotificationsTabSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Notification Channels Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Skeleton className="h-10 w-full" />
    </div>
  );
};
