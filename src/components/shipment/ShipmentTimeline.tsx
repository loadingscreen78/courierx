import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { TimelineEntry, TimelineSource } from '@/lib/shipment-lifecycle/types';
import {
  STATUS_LABEL_MAP,
  SOURCE_LABEL_MAP,
  formatTimelineDate,
} from '@/lib/shipment-lifecycle/statusLabelMap';

interface ShipmentTimelineProps {
  entries: TimelineEntry[];
  loading?: boolean;
}

const SOURCE_ICON_COLORS: Record<TimelineSource, string> = {
  NIMBUS: 'bg-blue-500',
  INTERNAL: 'bg-amber-500',
  SIMULATION: 'bg-purple-500',
  SYSTEM: 'bg-gray-500',
};

function TimelineLoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading timeline">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Skeleton className="h-3 w-3 rounded-full" />
            {i < 2 && <Skeleton className="h-12 w-0.5 mt-1" />}
          </div>
          <div className="flex-1 space-y-1.5 pb-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShipmentTimeline({ entries, loading }: ShipmentTimelineProps) {
  if (loading) return <TimelineLoadingSkeleton />;

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No timeline entries yet.
      </p>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <ol className="space-y-0" aria-label="Shipment timeline">
      {sorted.map((entry, idx) => {
        const statusInfo = STATUS_LABEL_MAP[entry.status];
        const sourceInfo = SOURCE_LABEL_MAP[entry.source];
        const iconColor = SOURCE_ICON_COLORS[entry.source] ?? 'bg-gray-500';
        const isLast = idx === sorted.length - 1;

        return (
          <li key={entry.id} className="flex gap-3">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <span
                className={cn('mt-1 h-3 w-3 rounded-full shrink-0', iconColor)}
                aria-hidden="true"
              />
              {!isLast && (
                <span className="w-0.5 flex-1 bg-border" aria-hidden="true" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <p className="text-sm font-medium leading-tight">
                {statusInfo?.label ?? entry.status}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTimelineDate(entry.created_at)}
              </p>
              <span
                className={cn(
                  'inline-block mt-1 text-xs font-medium',
                  sourceInfo?.color ?? 'text-gray-400'
                )}
              >
                {sourceInfo?.label ?? entry.source}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
