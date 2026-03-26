import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TicketStatus, TicketPriority } from '@/hooks/useSupportTickets';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800' },
  awaiting_response: { label: 'Awaiting Response', className: 'bg-purple-100 text-purple-800' },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground' },
  escalated: { label: 'Escalated', className: 'bg-destructive/10 text-destructive' },
};

const priorityConfig: Record<TicketPriority, { label: string; className: string; icon: string }> = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground', icon: '🟢' },
  normal: { label: 'Normal', className: 'bg-blue-100 text-blue-800', icon: '🟡' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-800', icon: '🟠' },
  urgent: { label: 'Urgent', className: 'bg-destructive/10 text-destructive', icon: '🔴' },
};

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

export function TicketPriorityBadge({ priority, className }: TicketPriorityBadgeProps) {
  const config = priorityConfig[priority];
  
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}
