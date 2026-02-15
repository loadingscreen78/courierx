// Receipt Generator - Creates receipt data for wallet transactions
import { Receipt, LedgerEntry, PaymentResult, PaymentMethod, COMPANY_DETAILS, GST_RATE } from './types';

const RECEIPTS_KEY_PREFIX = 'courierx_wallet_receipts_';

function getReceiptsKey(userId: string): string {
  return `${RECEIPTS_KEY_PREFIX}${userId}`;
}

function generateReceiptNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `RCP${year}${month}${random}`;
}

function generateReceiptId(): string {
  return `rcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get all receipts for a user
export function getReceipts(userId: string): Receipt[] {
  if (typeof window === 'undefined') return [];
  
  const key = getReceiptsKey(userId);
  const data = localStorage.getItem(key);
  
  if (!data) return [];
  
  try {
    return JSON.parse(data) as Receipt[];
  } catch {
    return [];
  }
}

// Store a receipt
function storeReceipt(userId: string, receipt: Receipt): void {
  if (typeof window === 'undefined') return;
  
  const receipts = getReceipts(userId);
  receipts.unshift(receipt);
  localStorage.setItem(getReceiptsKey(userId), JSON.stringify(receipts));
}

// Generate a receipt for a payment
export function generateReceipt(
  userId: string,
  ledgerEntry: LedgerEntry,
  paymentResult: PaymentResult,
  customerName: string,
  customerEmail?: string
): Receipt {
  const baseAmount = paymentResult.amount / (1 + GST_RATE);
  const gstAmount = paymentResult.amount - baseAmount;

  const receipt: Receipt = {
    id: generateReceiptId(),
    receiptNumber: generateReceiptNumber(),
    transactionId: paymentResult.transactionId,
    ledgerEntryId: ledgerEntry.id,
    amount: Math.round(baseAmount * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    totalAmount: paymentResult.amount,
    paymentMethod: paymentResult.method,
    date: paymentResult.timestamp,
    customerName,
    customerEmail,
    companyDetails: COMPANY_DETAILS,
  };

  storeReceipt(userId, receipt);
  return receipt;
}

// Get receipt by transaction ID
export function getReceiptByTransactionId(userId: string, transactionId: string): Receipt | null {
  const receipts = getReceipts(userId);
  return receipts.find(r => r.transactionId === transactionId) || null;
}

// Get receipt by ledger entry ID
export function getReceiptByLedgerEntryId(userId: string, ledgerEntryId: string): Receipt | null {
  const receipts = getReceipts(userId);
  return receipts.find(r => r.ledgerEntryId === ledgerEntryId) || null;
}

// Format payment method for display
export function formatPaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case 'upi':
      return 'UPI';
    case 'card':
      return 'Credit/Debit Card';
    case 'netbanking':
      return 'Net Banking';
    default:
      return method;
  }
}

// Format amount in Indian currency
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format date for receipt
export function formatReceiptDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
