import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FileText, Download, Search, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCXBCAuth } from '@/hooks/useCXBCAuth';
import { CXBCLayout } from '@/components/cxbc/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { generateCXBCBillPDF } from '@/lib/generateCXBCBillPDF';
import { toast } from 'sonner';

interface Bill {
  id: string;
  bill_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  base_cost: number;
  partner_margin: number;
  gst_amount: number;
  total_amount: number;
  payment_method: string;
  created_at: string;
  shipment_id: string | null;
}

const CXBCBills = () => {
  const { partner } = useCXBCAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const { data: bills, isLoading } = useQuery({
    queryKey: ['cxbc-bills', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data, error } = await supabase
        .from('cxbc_customer_bills')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Bill[];
    },
    enabled: !!partner?.id,
  });

  const filteredBills = bills?.filter(bill =>
    bill.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.customer_phone.includes(searchQuery)
  ) || [];

  const totalRevenue = bills?.reduce((sum, bill) => sum + bill.partner_margin, 0) || 0;

  const handleDownloadPDF = (bill: Bill) => {
    if (!partner) {
      toast.error('Partner information not available');
      return;
    }

    try {
      generateCXBCBillPDF({
        billNumber: bill.bill_number,
        createdAt: bill.created_at,
        partner: {
          businessName: partner.business_name,
          address: partner.address,
          city: partner.city,
          state: partner.state,
          pincode: partner.pincode,
          phone: partner.phone,
          gstNumber: partner.gst_number,
        },
        customer: {
          name: bill.customer_name,
          phone: bill.customer_phone,
          email: bill.customer_email,
        },
        breakdown: {
          baseCost: bill.base_cost,
          partnerMargin: bill.partner_margin,
          gstAmount: bill.gst_amount,
          totalAmount: bill.total_amount,
        },
        paymentMethod: bill.payment_method,
        shipmentId: bill.shipment_id,
        isGstRegistered: !!partner.gst_number,
      });
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <CXBCLayout title="Customer Bills" subtitle="View and download bills for walk-in customers">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{bills?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">₹{totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {bills?.filter(b => new Date(b.created_at).getMonth() === new Date().getMonth()).length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bills Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>All Bills</CardTitle>
                <CardDescription>Search and manage customer bills</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bills found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill No.</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Your Margin</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-mono text-sm">{bill.bill_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{bill.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{bill.customer_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">₹{bill.total_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-success">+₹{bill.partner_margin.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{bill.payment_method}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(bill.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedBill(bill)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadPDF(bill)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bill Detail Dialog */}
        <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Bill Details</DialogTitle>
            </DialogHeader>
            {selectedBill && (
              <div className="space-y-4">
                <div className="text-center border-b pb-4">
                  <p className="font-bold text-lg">{partner?.business_name}</p>
                  <p className="text-sm text-muted-foreground">{partner?.address}</p>
                  {partner?.gst_number && (
                    <p className="text-xs text-muted-foreground">GST: {partner.gst_number}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bill No:</span>
                    <span className="font-mono">{selectedBill.bill_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{format(new Date(selectedBill.created_at), 'dd MMM yyyy, HH:mm')}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <p className="font-medium">Customer Details</p>
                  <p>{selectedBill.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedBill.customer_phone}</p>
                  {selectedBill.customer_email && (
                    <p className="text-sm text-muted-foreground">{selectedBill.customer_email}</p>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Base Cost</span>
                    <span>₹{selectedBill.base_cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span>₹{selectedBill.partner_margin.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%)</span>
                    <span>₹{selectedBill.gst_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>₹{selectedBill.total_amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground border-t pt-4">
                  <span>Payment Method</span>
                  <span className="capitalize">{selectedBill.payment_method}</span>
                </div>

                <Button className="w-full" variant="outline" onClick={() => handleDownloadPDF(selectedBill)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CXBCLayout>
  );
};

export default CXBCBills;
