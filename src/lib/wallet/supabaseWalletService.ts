// Wallet Service - Works with localStorage until Supabase tables are created
// Once you run the migration, this will automatically use Supabase
import { supabase } from '@/integrations/supabase/client';
import { 
  LedgerEntry, 
  TransactionType, 
  TransactionFilters,
  MIN_RECHARGE_AMOUNT,
  MIN_BALANCE_REQUIRED,
} from './types';

const LEDGER_KEY = 'courierx_wallet_ledger';
const RECEIPTS_KEY = 'courierx_wallet_receipts';

// Check if Supabase tables exist
let useSupabase = false;

async function checkSupabaseTables(): Promise<boolean> {
  try {
    const { error } = await supabase.from('wallet_ledger').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Initialize - check if we can use Supabase
checkSupabaseTables().then(result => {
  useSupabase = result;
  console.log('Wallet using:', useSupabase ? 'Supabase' : 'localStorage');
});

// LocalStorage helpers
function getLocalEntries(userId: string): LedgerEntry[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(`${LEDGER_KEY}_${userId}`);
  if (!data) return getInitialEntries(userId);
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveLocalEntries(userId: string, entries: LedgerEntry[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${LEDGER_KEY}_${userId}`, JSON.stringify(entries));
  }
}

function getInitialEntries(userId: string): LedgerEntry[] {
  const entries: LedgerEntry[] = [
    {
      id: 'txn_init_001',
      userId,
      type: 'credit',
      amount: 5000,
      description: 'Wallet recharge via UPI',
      referenceId: 'PAY-INIT-001',
      referenceType: 'payment',
      createdAt: new Date('2024-12-10T10:30:00Z').toISOString(),
    },
    {
      id: 'txn_init_002',
      userId,
      type: 'debit',
      amount: 1850,
      description: 'Medicine shipment to UAE',
      referenceId: 'SHP-MED-001',
      referenceType: 'shipment',
      createdAt: new Date('2024-12-11T14:22:00Z').toISOString(),
    },
    {
      id: 'txn_init_003',
      userId,
      type: 'debit',
      amount: 950,
      description: 'Document shipment to UK',
      referenceId: 'SHP-DOC-002',
      referenceType: 'shipment',
      createdAt: new Date('2024-12-12T09:15:00Z').toISOString(),
    },
    {
      id: 'txn_init_004',
      userId,
      type: 'refund',
      amount: 300,
      description: 'Partial refund - Shipment cancelled',
      referenceId: 'SHP-DOC-002',
      referenceType: 'refund',
      createdAt: new Date('2024-12-13T16:45:00Z').toISOString(),
    },
  ];
  saveLocalEntries(userId, entries);
  return entries;
}

function generateId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get all ledger entries
export async function getEntries(userId: string): Promise<LedgerEntry[]> {
  if (useSupabase) {
    const { data, error } = await supabase
      .from('wallet_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        type: row.transaction_type as TransactionType,
        amount: parseFloat(row.amount),
        description: row.description,
        referenceId: row.reference_id,
        referenceType: row.reference_type,
        idempotencyKey: row.idempotency_key,
        metadata: row.metadata,
        createdAt: row.created_at,
      }));
    }
  }
  return getLocalEntries(userId);
}

// Add entry
export async function addEntry(
  userId: string,
  type: TransactionType,
  amount: number,
  description: string,
  options?: {
    referenceId?: string;
    referenceType?: 'payment' | 'shipment' | 'refund';
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<LedgerEntry | null> {
  const entry: LedgerEntry = {
    id: generateId(),
    userId,
    type,
    amount: Math.abs(amount),
    description,
    referenceId: options?.referenceId,
    referenceType: options?.referenceType,
    idempotencyKey: options?.idempotencyKey,
    metadata: options?.metadata,
    createdAt: new Date().toISOString(),
  };

  if (useSupabase) {
    const { data, error } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: userId,
        transaction_type: type,
        amount: Math.abs(amount),
        description,
        reference_id: options?.referenceId,
        reference_type: options?.referenceType,
        idempotency_key: options?.idempotencyKey,
        metadata: options?.metadata || {},
      })
      .select()
      .single();
    if (!error && data) {
      return {
        id: data.id,
        userId: data.user_id,
        type: data.transaction_type as TransactionType,
        amount: parseFloat(data.amount),
        description: data.description,
        referenceId: data.reference_id,
        referenceType: data.reference_type,
        idempotencyKey: data.idempotency_key,
        metadata: data.metadata,
        createdAt: data.created_at,
      };
    }
  }

  // Use localStorage
  const entries = getLocalEntries(userId);
  
  // Check idempotency
  if (options?.idempotencyKey) {
    const existing = entries.find(e => e.idempotencyKey === options.idempotencyKey);
    if (existing) return existing;
  }
  
  entries.unshift(entry);
  saveLocalEntries(userId, entries);
  return entry;
}

// Compute balance
export async function computeBalance(userId: string): Promise<number> {
  const entries = await getEntries(userId);
  return entries.reduce((balance, entry) => {
    switch (entry.type) {
      case 'credit':
      case 'refund':
      case 'release':
        return balance + entry.amount;
      case 'debit':
      case 'hold':
        return balance - entry.amount;
      default:
        return balance;
    }
  }, 0);
}

// Compute available balance
export async function computeAvailableBalance(userId: string): Promise<number> {
  return computeBalance(userId);
}

// Validate recharge
export function validateRecharge(amount: number): { valid: boolean; error?: string } {
  if (amount < MIN_RECHARGE_AMOUNT) {
    return { valid: false, error: `Minimum recharge amount is ₹${MIN_RECHARGE_AMOUNT}` };
  }
  return { valid: true };
}

// Validate deduction
export async function validateDeduction(userId: string, amount: number): Promise<{ valid: boolean; error?: string }> {
  const balance = await computeAvailableBalance(userId);
  if (amount <= 0) return { valid: false, error: 'Amount must be greater than zero' };
  if (balance < amount) return { valid: false, error: `Insufficient balance. Available: ₹${balance.toLocaleString('en-IN')}` };
  if (balance - amount < MIN_BALANCE_REQUIRED) return { valid: false, error: `Minimum balance of ₹${MIN_BALANCE_REQUIRED} required` };
  return { valid: true };
}

// Add funds
export async function addFunds(userId: string, amount: number, paymentRef: string, description: string = 'Wallet recharge'): Promise<LedgerEntry | null> {
  return addEntry(userId, 'credit', amount, description, {
    referenceId: paymentRef,
    referenceType: 'payment',
    idempotencyKey: paymentRef,
  });
}

// Deduct funds
export async function deductFunds(userId: string, amount: number, shipmentId: string, description?: string): Promise<LedgerEntry | null> {
  const validation = await validateDeduction(userId, amount);
  if (!validation.valid) throw new Error(validation.error);
  return addEntry(userId, 'debit', amount, description || 'Shipment booking', {
    referenceId: shipmentId,
    referenceType: 'shipment',
    idempotencyKey: `debit_${shipmentId}`,
  });
}

// Process refund
export async function processRefund(userId: string, amount: number, shipmentId: string, description?: string): Promise<LedgerEntry | null> {
  return addEntry(userId, 'refund', amount, description || 'Refund processed', {
    referenceId: shipmentId,
    referenceType: 'refund',
  });
}

// Get transaction history
export async function getTransactionHistory(userId: string, filters?: TransactionFilters): Promise<LedgerEntry[]> {
  let entries = await getEntries(userId);
  if (filters?.type) entries = entries.filter(e => e.type === filters.type);
  if (filters?.startDate) entries = entries.filter(e => new Date(e.createdAt) >= new Date(filters.startDate!));
  if (filters?.endDate) entries = entries.filter(e => new Date(e.createdAt) <= new Date(filters.endDate!));
  const offset = filters?.offset || 0;
  const limit = filters?.limit || entries.length;
  return entries.slice(offset, offset + limit);
}

// Receipt storage (localStorage only for now)
export async function storeReceipt(userId: string, ledgerEntryId: string, receiptData: any): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const receipts = JSON.parse(localStorage.getItem(`${RECEIPTS_KEY}_${userId}`) || '[]');
  receipts.unshift({ id: `rcp_${Date.now()}`, ledger_entry_id: ledgerEntryId, ...receiptData, created_at: new Date().toISOString() });
  localStorage.setItem(`${RECEIPTS_KEY}_${userId}`, JSON.stringify(receipts));
  return true;
}

export async function getReceiptByLedgerEntryId(userId: string, ledgerEntryId: string): Promise<any | null> {
  if (typeof window === 'undefined') return null;
  const receipts = JSON.parse(localStorage.getItem(`${RECEIPTS_KEY}_${userId}`) || '[]');
  return receipts.find((r: any) => r.ledger_entry_id === ledgerEntryId) || null;
}
