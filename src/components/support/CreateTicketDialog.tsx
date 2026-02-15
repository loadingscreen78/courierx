import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSupportTickets, type TicketCategory, type TicketPriority } from '@/hooks/useSupportTickets';
import { Loader2 } from 'lucide-react';

const ticketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject must be less than 100 characters'),
  category: z.enum(['shipment', 'payment', 'kyc', 'refund', 'qc_failure', 'customs', 'general', 'complaint']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  description: z.string().min(20, 'Please provide more details (at least 20 characters)').max(2000, 'Description must be less than 2000 characters'),
});

type TicketFormData = z.infer<typeof ticketSchema>;

const categoryOptions: { value: TicketCategory; label: string }[] = [
  { value: 'shipment', label: 'Shipment Issue' },
  { value: 'payment', label: 'Payment/Billing' },
  { value: 'kyc', label: 'KYC/Verification' },
  { value: 'refund', label: 'Refund Request' },
  { value: 'qc_failure', label: 'QC Failure' },
  { value: 'customs', label: 'Customs Issue' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'complaint', label: 'Complaint' },
];

const priorityOptions: { value: TicketPriority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'General inquiries' },
  { value: 'normal', label: 'Normal', description: 'Standard issues' },
  { value: 'high', label: 'High', description: 'Time-sensitive' },
  { value: 'urgent', label: 'Urgent', description: 'Critical issues' },
];

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTicketDialog({ open, onOpenChange }: CreateTicketDialogProps) {
  const { createTicket, isCreating } = useSupportTickets();
  
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      category: 'general',
      priority: 'normal',
      description: '',
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    try {
      await createTicket({
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        description: data.description,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-mono">Create Support Ticket</DialogTitle>
          <DialogDescription>
            Describe your issue and we&apos;ll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of your issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide details about your issue. Include any relevant booking IDs or tracking numbers."
                      className="min-h-[120px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Ticket
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
