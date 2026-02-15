// Ledger Store - Append-only localStorage operations
import { LedgerEntry, TransactionType } from './types';

const LEDGER_KEY_PREFIX = 'courierx_wallet_ledger_';

function getLedgerKey(userId: string): string {
  return `${LEDGER_KEY_PREFIX}${userId}`;
}

function generateId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get all ledger entries for a user
export function getEntries(userId: string): LedgerEntry[] {
  if (typeof window === 'undefined') return [];
  
  const key = getLedgerKey(userId);
  const data = localStorage.getItem(key);
  
  if (!data) return getInitialEntries(userId);
  
  try {
    return JSON.parse(data) as LedgerEntry[];
  } catch {
    return [];
  }
}

// Add a new entry (append-only - no updates allowed)
export function addEntry(
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
): LedgerEntry {
  // Check for duplicate idempotency key
  if (options?.idempotencyKey) {
    const existing = findByIdempotencyKey(userId, options.idempotencyKey);
    if (existing) return existing;
  }

  const entry: LedgerEntry = {
    id: generateId(),
    userId,
    type,
    amount: Math.abs(amount), // Always store positive amounts
    description,
    referenceId: options?.referenceId,
    referenceType: options?.referenceType,
    idempotencyKey: options?.idempotencyKey,
    metadata: options?.metadata,
    createdAt: new Date().toISOString(),
  };

  const entries = getEntries(userId);
  entries.unshift(entry); // Add to beginning (newest first)
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(getLedgerKey(userId), JSON.stringify(entries));
  }

  return entry;
}

// Find entry by idempotency key (for deduplication)
export function findByIdempotencyKey(userId: string, idempotencyKey: string): LedgerEntry | null {
  const entries = getEntries(userId);
  return entries.find(e => e.idempotencyKey === idempotencyKey) || null;
}

// Find entry by ID
export function findById(userId: string, entryId: string): LedgerEntry | null {
  const entries = getEntries(userId);
  return entries.find(e => e.id === entryId) || null;
}

// Find entries by reference ID (e.g., all transactions for a shipment)
export function findByReferenceId(userId: string, referenceId: string): LedgerEntry[] {
  const entries = getEntries(userId);
  return entries.filter(e => e.referenceId === referenceId);
}

// Get initial demo entries for new users
function getInitialEntries(userId: string): LedgerEntry[] {
  const initialEntries: LedgerEntry[] = [
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

  // Store initial entries
  if (typeof window !== 'undefined') {
    localStorage.setItem(getLedgerKey(userId), JSON.stringify(initialEntries));
  }

  return initialEntries;
}

// Clear all entries for a user (for testing only)
export function clearEntries(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getLedgerKey(userId));
  }
}
