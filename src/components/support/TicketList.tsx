import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Ticket, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupportTickets, type SupportTicket, type TicketStatus } from '@/hooks/useSupportTickets';
import { TicketStatusBadge, TicketPriorityBadge } from './TicketStatusBadge';
import { CreateTicketDialog } from './CreateTicketDialog';
import { TicketDetail } from './TicketDetail';
import { Skeleton } from '@/components/ui/skeleton';

export function TicketList() {
  const { tickets, isLoading } = useSupportTickets();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');

  const filteredTickets = statusFilter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === statusFilter);

  if (selectedTicket) {
    return (
      <TicketDetail 
        ticket={selectedTicket} 
        onBack={() => setSelectedTicket(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TicketStatus | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-foreground mb-1">No tickets found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {statusFilter === 'all' 
                ? "You haven't created any support tickets yet."
                : `No tickets with status "${statusFilter.replace('_', ' ')}".`}
            </p>
            <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <TicketCard 
              key={ticket.id} 
              ticket={ticket} 
              onClick={() => setSelectedTicket(ticket)}
            />
          ))}
        </div>
      )}

      <CreateTicketDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </div>
  );
}

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  const categoryLabels: Record<string, string> = {
    shipment: 'Shipment Issue',
    payment: 'Payment/Billing',
    kyc: 'KYC/Verification',
    refund: 'Refund Request',
    qc_failure: 'QC Failure',
    customs: 'Customs Issue',
    general: 'General Inquiry',
    complaint: 'Complaint',
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">
                {ticket.ticket_number}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {categoryLabels[ticket.category]}
              </span>
            </div>
            <CardTitle className="text-sm font-medium line-clamp-1">
              {ticket.subject}
            </CardTitle>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-xs line-clamp-2 mb-3">
          {ticket.description}
        </CardDescription>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(ticket.created_at), 'MMM d, yyyy')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
