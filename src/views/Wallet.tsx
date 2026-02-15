'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout';
import { useWallet, MIN_RECHARGE_AMOUNT, Transaction } from '@/contexts/WalletContext';
import { useInvoices } from '@/hooks/useInvoices';
import { generateInvoicePDF, generateAllInvoicesPDF } from '@/lib/generateInvoicePDF';
import { PaymentLoadingOverlay } from '@/components/wallet/PaymentLoadingOverlay';
import { PaymentMethod } from '@/lib/wallet/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Clock,
  Filter,
  FileText,
  Download,
  Loader2,
  Smartphone,
  CreditCard,
  Building2,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type FilterType = 'all' | 'credit' | 'debit' | 'refund';
type InvoiceStatus = Database['public']['Enums']['invoice_status'];

const TransactionIcon = ({ type }: { type: Transaction['type'] }) => {
  switch (type) {
    case 'credit':
      return <ArrowDownLeft className="h-4 w-4 text-accent-foreground" />;
    case 'debit':
      return <ArrowUpRight className="h-4 w-4 text-destructive" />;
    case 'refund':
      return <RotateCcw className="h-4 w-4 text-primary" />;
  }
};

const TransactionBadge = ({ type }: { type: Transaction['type'] }) => {
  switch (type) {
    case 'credit':
      return <Badge className="bg-accent/20 text-accent-foreground border-accent">Credit</Badge>;
    case 'debit':
      return <Badge variant="destructive">Debit</Badge>;
    case 'refund':
      return <Badge className="bg-primary/20 text-primary border-primary">Refund</Badge>;
  }
};

const InvoiceStatusBadge = ({ status }: { status: InvoiceStatus }) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-success/20 text-success border-success">Paid</Badge>;
    case 'pending':
      return <Badge className="bg-warning/20 text-warning border-warning">Pending</Badge>;
    case 'refunded':
      return <Badge className="bg-primary/20 text-primary border-primary">Refunded</Badge>;
  }
};

const PaymentMethodButton = ({ 
  method, 
  icon: Icon, 
  label, 
  selected, 
  onClick 
}: { 
  method: PaymentMethod; 
  icon: React.ElementType; 
  label: string; 
  selected: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
      selected 
        ? "border-primary bg-primary/10" 
        : "border-muted hover:border-primary/50"
    )}
  >
    <Icon className={cn("h-6 w-6", selected ? "text-primary" : "text-muted-foreground")} />
    <span className={cn("text-sm font-medium", selected ? "text-primary" : "text-muted-foreground")}>
      {label}
    </span>
  </button>
);

const WalletPage = () => {
  const { 
    balance, 
    transactions, 
    isPaymentProcessing,
    paymentStatus,
    paymentMessage,
    addFundsWithPayment,
    resetPaymentState,
    downloadTransactionReceipt,
  } = useWallet();
  
  const { invoices, loading: invoicesLoading } = useInvoices();
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('upi');
  const [filter, setFilter] = useState<FilterType>('all');
  const [activeTab, setActiveTab] = useState('transactions');
  const [lastReceipt, setLastReceipt] = useState<{ receiptNumber: string } | null>(null);

  const handleRecharge = async () => {
    const amount = parseInt(rechargeAmount);
    if (isNaN(amount) || amount < MIN_RECHARGE_AMOUNT) {
      toast.error(`Minimum recharge amount is ₹${MIN_RECHARGE_AMOUNT}`);
      return;
    }
    
    setShowRechargeDialog(false);
    
    const result = await addFundsWithPayment(amount, selectedPaymentMethod);
    
    if (result.success && result.receipt) {
      setLastReceipt({ receiptNumber: result.receipt.receiptNumber });
      toast.success(
        <div className="flex flex-col gap-1">
          <span>₹{amount.toLocaleString('en-IN')} added to wallet</span>
          <button 
            onClick={() => downloadTransactionReceipt(result.receipt!.ledgerEntryId)}
            className="text-xs text-primary underline text-left"
          >
            Download Receipt
          </button>
        </div>
      );
    } else if (!result.success) {
      toast.error(result.error || 'Payment failed');
    }
    
    setRechargeAmount('');
  };

  const handlePaymentOverlayClose = () => {
    resetPaymentState();
  };

  const handlePaymentRetry = () => {
    resetPaymentState();
    setShowRechargeDialog(true);
  };

  const quickRechargeAmounts = [500, 1000, 2000, 5000];

  const filteredTransactions = transactions.filter(t => 
    filter === 'all' || t.type === filter
  );

  // Calculate stats
  const totalCredits = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDebits = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = transactions
    .filter(t => t.type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleDownloadInvoice = (invoice: Database['public']['Tables']['invoices']['Row']) => {
    try {
      generateInvoicePDF(invoice);
      toast.success('Invoice downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate invoice');
    }
  };

  const handleExportAllInvoices = () => {
    if (invoices.length === 0) {
      toast.error('No invoices to export');
      return;
    }
    try {
      generateAllInvoicesPDF(invoices);
      toast.success('All invoices exported');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to export invoices');
    }
  };

  const handleDownloadTransactionReceipt = (transactionId: string) => {
    downloadTransactionReceipt(transactionId);
    toast.success('Receipt downloaded');
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-typewriter text-2xl font-bold">Wallet & Billing</h1>
          <p className="text-sm text-muted-foreground">
            Manage your balance, transactions, and invoices
          </p>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <CardContent className="py-8 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm opacity-80 flex items-center gap-2">
                  <WalletIcon className="h-4 w-4" />
                  Available Balance
                </p>
                <p className="font-typewriter text-4xl font-bold">
                  ₹{balance.toLocaleString('en-IN')}
                </p>
                <p className="text-xs opacity-60">
                  Minimum ₹1,000 required for bookings
                </p>
              </div>
              <Button 
                onClick={() => setShowRechargeDialog(true)}
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Money
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-accent/20">
                  <TrendingUp className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Credits</p>
                  <p className="font-typewriter font-bold text-accent-foreground">
                    ₹{totalCredits.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/20">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Debits</p>
                  <p className="font-typewriter font-bold text-destructive">
                    ₹{totalDebits.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <RotateCcw className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Refunds</p>
                  <p className="font-typewriter font-bold text-primary">
                    ₹{totalRefunds.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Transactions and Invoices */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Transaction History
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    {(['all', 'credit', 'debit', 'refund'] as FilterType[]).map((f) => (
                      <Button
                        key={f}
                        variant={filter === f ? 'default' : 'ghost'}
                        size="sm"
                        className="h-7 px-2 text-xs capitalize"
                        onClick={() => setFilter(f)}
                      >
                        {f}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <IndianRupee className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No transactions found</p>
                  </div>
                ) : (
                  filteredTransactions.map((transaction, index) => (
                    <div key={transaction.id}>
                      {index > 0 && <Separator className="my-3" />}
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-full",
                          transaction.type === 'credit' && "bg-accent/20",
                          transaction.type === 'debit' && "bg-destructive/20",
                          transaction.type === 'refund' && "bg-primary/20"
                        )}>
                          <TransactionIcon type={transaction.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{transaction.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(transaction.date, 'dd MMM yyyy, hh:mm a')}</span>
                            {transaction.referenceId && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{transaction.referenceId}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className={cn(
                              "font-typewriter font-bold",
                              transaction.type === 'credit' && "text-accent-foreground",
                              transaction.type === 'debit' && "text-destructive",
                              transaction.type === 'refund' && "text-primary"
                            )}>
                              {transaction.type === 'debit' ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN')}
                            </p>
                            <TransactionBadge type={transaction.type} />
                          </div>
                          {transaction.type === 'credit' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDownloadTransactionReceipt(transaction.id)}
                              title="Download Receipt"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Shipment Invoices
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={handleExportAllInvoices}
                    disabled={invoices.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Export All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoicesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No invoices yet</p>
                    <p className="text-sm">Invoices will appear here after your first shipment</p>
                  </div>
                ) : (
                  invoices.map((invoice, index) => (
                    <div key={invoice.id}>
                      {index > 0 && <Separator className="my-3" />}
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-muted">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{invoice.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{invoice.invoice_number}</span>
                            <span>•</span>
                            <span>{format(new Date(invoice.created_at), 'dd MMM yyyy')}</span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="font-typewriter font-bold">
                              ₹{Number(invoice.total_amount).toLocaleString('en-IN')}
                            </p>
                            <InvoiceStatusBadge status={invoice.status} />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Invoice Info */}
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">About Invoices</p>
                    <p>Invoices are automatically generated for each completed shipment and include GST details for business claims.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card - Only show on transactions tab */}
        {activeTab === 'transactions' && (
          <Card className="bg-muted/50">
            <CardContent className="py-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Wallet Guidelines</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Minimum recharge amount: ₹{MIN_RECHARGE_AMOUNT}</li>
                  <li>Minimum balance of ₹1,000 required for bookings</li>
                  <li>Refunds are processed within 24-48 hours</li>
                  <li>Withdrawals only available upon account closure</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recharge Dialog */}
      <Dialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-typewriter">Add Money to Wallet</DialogTitle>
            <DialogDescription>
              Choose an amount and payment method. Minimum: ₹{MIN_RECHARGE_AMOUNT}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Quick Amount Selection */}
            <div className="grid grid-cols-4 gap-2">
              {quickRechargeAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setRechargeAmount(amount.toString())}
                  className={cn(
                    "font-typewriter",
                    rechargeAmount === amount.toString() && "border-primary bg-primary/10"
                  )}
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
            
            <Separator />
            
            {/* Custom Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Amount</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="pl-10 font-typewriter"
                  min={MIN_RECHARGE_AMOUNT}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                <PaymentMethodButton
                  method="upi"
                  icon={Smartphone}
                  label="UPI"
                  selected={selectedPaymentMethod === 'upi'}
                  onClick={() => setSelectedPaymentMethod('upi')}
                />
                <PaymentMethodButton
                  method="card"
                  icon={CreditCard}
                  label="Card"
                  selected={selectedPaymentMethod === 'card'}
                  onClick={() => setSelectedPaymentMethod('card')}
                />
                <PaymentMethodButton
                  method="netbanking"
                  icon={Building2}
                  label="Net Banking"
                  selected={selectedPaymentMethod === 'netbanking'}
                  onClick={() => setSelectedPaymentMethod('netbanking')}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleRecharge} 
              className="w-full gap-2"
              disabled={!rechargeAmount || parseInt(rechargeAmount) < MIN_RECHARGE_AMOUNT}
            >
              <Plus className="h-4 w-4" />
              Pay ₹{rechargeAmount ? parseInt(rechargeAmount).toLocaleString('en-IN') : '0'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Loading Overlay */}
      <PaymentLoadingOverlay
        isOpen={isPaymentProcessing || paymentStatus === 'success' || paymentStatus === 'failed'}
        status={paymentStatus}
        message={paymentMessage}
        amount={parseInt(rechargeAmount) || 0}
        method={selectedPaymentMethod}
        onClose={handlePaymentOverlayClose}
        onRetry={handlePaymentRetry}
      />
    </AppLayout>
  );
};

export default WalletPage;
