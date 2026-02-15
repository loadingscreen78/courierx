import { useState } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Send, AlertTriangle, Clock, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTicketMessages, useSupportTickets, type SupportTicket } from '@/hooks/useSupportTickets';
import { TicketStatusBadge, TicketPriorityBadge } from './TicketStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface TicketDetailProps {
  ticket: SupportTicket;
  onBack: () => void;
}

export function TicketDetail({ ticket, onBack }: TicketDetailProps) {
  const { messages, isLoading, addMessage, isSending } = useTicketMessages(ticket.id);
  const { updateTicket } = useSupportTickets();
  const [newMessage, setNewMessage] = useState('');

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

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await addMessage({
        ticket_id: ticket.id,
        message: newMessage.trim(),
      });
      setNewMessage('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEscalate = async () => {
    try {
      await updateTicket({
        id: ticket.id,
        status: 'escalated',
        escalated_at: new Date().toISOString(),
        escalation_reason: 'User requested escalation',
      });
      toast.success('Ticket has been escalated');
    } catch (error) {
      toast.error('Failed to escalate ticket');
    }
  };

  const canEscalate = 
    ticket.status !== 'escalated' && 
    ticket.status !== 'resolved' && 
    ticket.status !== 'closed' &&
    new Date(ticket.created_at).getTime() < Date.now() - 24 * 60 * 60 * 1000; // 24 hours

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">
              {ticket.ticket_number}
            </span>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <h2 className="text-lg font-semibold font-mono text-foreground">
            {ticket.subject}
          </h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{categoryLabels[ticket.category]}</span>
            <span>•</span>
            <span>Created {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}</span>
          </div>
        </div>
      </div>

      {/* Escalation Alert */}
      {ticket.status === 'escalated' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This ticket has been escalated and is being reviewed by our senior support team.
          </AlertDescription>
        </Alert>
      )}

      {/* Original Description */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Issue Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {ticket.description}
          </p>
        </CardContent>
      </Card>

      {/* Messages Thread */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs">Our support team will respond shortly.</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.is_from_support 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      {message.is_from_support ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {message.is_from_support ? 'Support Team' : 'You'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Reply Input */}
          {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex items-center justify-between">
                  {canEscalate && (
                    <Button variant="outline" size="sm" onClick={handleEscalate}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Escalate Ticket
                    </Button>
                  )}
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || isSending}
                    className="ml-auto"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
