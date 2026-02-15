// Mock Payment Gateway - Simulates real payment processing
import { PaymentMethod, PaymentSession, PaymentResult, PaymentStatus } from './types';

const PAYMENT_SESSIONS_KEY = 'courierx_payment_sessions';

// Status messages for UI display
export const PAYMENT_STATUS_MESSAGES: Record<PaymentStatus, string> = {
  pending: 'Initializing payment...',
  processing: 'Processing your payment...',
  success: 'Payment successful!',
  failed: 'Payment failed. Please try again.',
};

// Detailed status messages for loading overlay
export const PAYMENT_PROGRESS_MESSAGES = [
  'Connecting to payment gateway...',
  'Verifying payment details...',
  'Processing transaction...',
  'Confirming with bank...',
  'Finalizing payment...',
];

function generateSessionId(): string {
  return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateTransactionId(): string {
  return `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

// Store payment session
function storeSession(session: PaymentSession): void {
  if (typeof window === 'undefined') return;
  
  const sessions = getSessions();
  sessions[session.sessionId] = session;
  localStorage.setItem(PAYMENT_SESSIONS_KEY, JSON.stringify(sessions));
}

// Get all sessions
function getSessions(): Record<string, PaymentSession> {
  if (typeof window === 'undefined') return {};
  
  const data = localStorage.getItem(PAYMENT_SESSIONS_KEY);
  return data ? JSON.parse(data) : {};
}

// Get session by ID
export function getSession(sessionId: string): PaymentSession | null {
  const sessions = getSessions();
  return sessions[sessionId] || null;
}

// Update session status
function updateSessionStatus(sessionId: string, status: PaymentStatus): void {
  const sessions = getSessions();
  if (sessions[sessionId]) {
    sessions[sessionId].status = status;
    localStorage.setItem(PAYMENT_SESSIONS_KEY, JSON.stringify(sessions));
  }
}

// Initiate a new payment session
export function initiatePayment(amount: number, method: PaymentMethod): PaymentSession {
  const session: PaymentSession = {
    sessionId: generateSessionId(),
    amount,
    method,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  storeSession(session);
  return session;
}

// Simulate payment processing with realistic delays
export async function processPayment(
  sessionId: string,
  onStatusChange?: (status: PaymentStatus, message: string) => void
): Promise<PaymentResult> {
  const session = getSession(sessionId);
  
  if (!session) {
    throw new Error('Payment session not found');
  }
  
  // Simulate processing stages with delays
  const stages: Array<{ status: PaymentStatus; message: string; delay: number }> = [
    { status: 'pending', message: PAYMENT_PROGRESS_MESSAGES[0], delay: 500 },
    { status: 'processing', message: PAYMENT_PROGRESS_MESSAGES[1], delay: 800 },
    { status: 'processing', message: PAYMENT_PROGRESS_MESSAGES[2], delay: 1000 },
    { status: 'processing', message: PAYMENT_PROGRESS_MESSAGES[3], delay: 700 },
    { status: 'processing', message: PAYMENT_PROGRESS_MESSAGES[4], delay: 500 },
  ];
  
  // Process each stage
  for (const stage of stages) {
    updateSessionStatus(sessionId, stage.status);
    onStatusChange?.(stage.status, stage.message);
    await delay(stage.delay);
  }
  
  // Simulate 90% success rate
  const isSuccess = Math.random() < 0.9;
  
  const finalStatus: PaymentStatus = isSuccess ? 'success' : 'failed';
  updateSessionStatus(sessionId, finalStatus);
  
  const result: PaymentResult = {
    success: isSuccess,
    transactionId: isSuccess ? generateTransactionId() : '',
    amount: session.amount,
    method: session.method,
    timestamp: new Date().toISOString(),
    errorMessage: isSuccess ? undefined : getRandomErrorMessage(),
  };
  
  onStatusChange?.(finalStatus, PAYMENT_STATUS_MESSAGES[finalStatus]);
  
  return result;
}

// Get payment status
export function getPaymentStatus(sessionId: string): PaymentStatus | null {
  const session = getSession(sessionId);
  return session?.status || null;
}

// Helper: delay function
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random error messages for failed payments
function getRandomErrorMessage(): string {
  const errors = [
    'Transaction declined by bank. Please try again.',
    'Payment timeout. Please retry.',
    'Insufficient funds in source account.',
    'Network error. Please check your connection.',
    'Bank server unavailable. Try after some time.',
  ];
  return errors[Math.floor(Math.random() * errors.length)];
}

// Quick payment - combines initiate and process
export async function quickPayment(
  amount: number,
  method: PaymentMethod,
  onStatusChange?: (status: PaymentStatus, message: string) => void
): Promise<PaymentResult> {
  const session = initiatePayment(amount, method);
  return processPayment(session.sessionId, onStatusChange);
}
