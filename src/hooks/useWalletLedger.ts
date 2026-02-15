'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LedgerEntry, 
  PaymentMethod, 
  PaymentStatus, 
  Receipt,
  TransactionFilters,
  WalletState,
  MIN_RECHARGE_AMOUNT,
  MIN_BALANCE_REQUIRED,
  GST_RATE,
  COMPANY_DETAILS,
} from '@/lib/wallet/types';
import {
  computeBalance,
  computeAvailableBalance,
  addFunds as addFundsToLedger,
  deductFunds as deductFundsFromLedger,
  processRefund as processRefundInLedger,
  getTransactionHistory,
  validateRecharge,
  validateDeduction,
  storeReceipt,
  getReceiptByLedgerEntryId,
} from '@/lib/wallet/supabaseWalletService';
import { quickPayment, PAYMENT_STATUS_MESSAGES } from '@/lib/wallet/mockPaymentGateway';
import { generateWalletReceiptPDF } from '@/lib/wallet/generateWalletReceiptPDF';

export interface UseWalletLedgerReturn {
  balance: number;
  availableBalance: number;
  heldAmount: number;
  transactions: LedgerEntry[];
  isLoading: boolean;
  error: string | null;
  isPaymentProcessing: boolean;
  paymentStatus: PaymentStatus;
  paymentMessage: string;
  addFunds: (amount: number, method: PaymentMethod) => Promise<{ success: boolean; receipt?: Receipt; error?: string }>;
  deductFunds: (amount: number, shipmentId: string, description?: string) => Promise<{ success: boolean; entry?: LedgerEntry; error?: string }>;
  processRefund: (amount: number, shipmentId: string, description?: string) => Promise<{ success: boolean; entry?: LedgerEntry; error?: string }>;
  refreshBalance: () => Promise<void>;
  getHistory: (filters?: TransactionFilters) => Promise<LedgerEntry[]>;
  downloadTransactionReceipt: (ledgerEntryId: string) => Promise<void>;
  hasMinimumBalance: (requiredAmount?: number) => boolean;
  resetPaymentState: () => void;
}

function generateReceiptNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `RCP${year}${month}${random}`;
}

export function useWalletLedger(): UseWalletLedgerReturn {
  const { user, profile } = useAuth();
  
  const [state, setState] = useState<WalletState>({
    balance: 0,
    availableBalance: 0,
    heldAmount: 0,
    transactions: [],
    isLoading: true,
    error: null,
  });
  
  const [paymentState, setPaymentState] = useState({
    isProcessing: false,
    status: 'pending' as PaymentStatus,
    message: '',
  });

  const refreshBalance = useCallback(async () => {
    if (!user?.id) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }
    try {
      const [balance, availableBalance, transactions] = await Promise.all([
        computeBalance(user.id),
        computeAvailableBalance(user.id),
        getTransactionHistory(user.id),
      ]);
      setState({
        balance,
        availableBalance,
        heldAmount: balance - availableBalance,
        transactions,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error refreshing wallet:', error);
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to load wallet data' }));
    }
  }, [user?.id]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const addFunds = useCallback(async (amount: number, method: PaymentMethod) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    const validation = validateRecharge(amount);
    if (!validation.valid) return { success: false, error: validation.error };

    setPaymentState({ isProcessing: true, status: 'pending', message: PAYMENT_STATUS_MESSAGES.pending });

    try {
      const paymentResult = await quickPayment(amount, method, (status, message) => {
        setPaymentState(prev => ({ ...prev, status, message }));
      });

      if (!paymentResult.success) {
        setPaymentState({ isProcessing: false, status: 'failed', message: paymentResult.errorMessage || PAYMENT_STATUS_MESSAGES.failed });
        return { success: false, error: paymentResult.errorMessage };
      }

      const ledgerEntry = await addFundsToLedger(user.id, amount, paymentResult.transactionId, `Wallet recharge via ${method.toUpperCase()}`);
      if (!ledgerEntry) {
        setPaymentState({ isProcessing: false, status: 'failed', message: 'Failed to record transaction' });
        return { success: false, error: 'Failed to record transaction' };
      }

      const baseAmount = amount / (1 + GST_RATE);
      const gstAmount = amount - baseAmount;
      const receipt: Receipt = {
        id: `rcp_${Date.now()}`,
        receiptNumber: generateReceiptNumber(),
        transactionId: paymentResult.transactionId,
        ledgerEntryId: ledgerEntry.id,
        amount: Math.round(baseAmount * 100) / 100,
        gstAmount: Math.round(gstAmount * 100) / 100,
        totalAmount: amount,
        paymentMethod: method,
        date: paymentResult.timestamp,
        customerName: profile?.full_name || 'Customer',
        customerEmail: profile?.email || undefined,
        companyDetails: COMPANY_DETAILS,
      };

      await storeReceipt(user.id, ledgerEntry.id, {
        receiptNumber: receipt.receiptNumber,
        transactionId: receipt.transactionId,
        amount: receipt.amount,
        gstAmount: receipt.gstAmount,
        totalAmount: receipt.totalAmount,
        paymentMethod: method,
        customerName: receipt.customerName,
        customerEmail: receipt.customerEmail,
      });

      await refreshBalance();
      setPaymentState({ isProcessing: false, status: 'success', message: PAYMENT_STATUS_MESSAGES.success });
      return { success: true, receipt };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setPaymentState({ isProcessing: false, status: 'failed', message: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [user?.id, profile, refreshBalance]);

  const deductFunds = useCallback(async (amount: number, shipmentId: string, description?: string) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    const validation = await validateDeduction(user.id, amount);
    if (!validation.valid) return { success: false, error: validation.error };

    try {
      const entry = await deductFundsFromLedger(user.id, amount, shipmentId, description);
      if (entry) {
        await refreshBalance();
        return { success: true, entry };
      }
      return { success: false, error: 'Failed to deduct funds' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Deduction failed' };
    }
  }, [user?.id, refreshBalance]);

  const processRefund = useCallback(async (amount: number, shipmentId: string, description?: string) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    try {
      const entry = await processRefundInLedger(user.id, amount, shipmentId, description);
      if (entry) {
        await refreshBalance();
        return { success: true, entry };
      }
      return { success: false, error: 'Failed to process refund' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Refund failed' };
    }
  }, [user?.id, refreshBalance]);

  const getHistory = useCallback(async (filters?: TransactionFilters) => {
    if (!user?.id) return [];
    return getTransactionHistory(user.id, filters);
  }, [user?.id]);

  const downloadTransactionReceipt = useCallback(async (ledgerEntryId: string) => {
    if (!user?.id) return;
    const receiptData = await getReceiptByLedgerEntryId(user.id, ledgerEntryId);
    if (receiptData) {
      const receipt: Receipt = {
        id: receiptData.id,
        receiptNumber: receiptData.receipt_number,
        transactionId: receiptData.transaction_id,
        ledgerEntryId: receiptData.ledger_entry_id,
        amount: parseFloat(receiptData.amount),
        gstAmount: parseFloat(receiptData.gst_amount),
        totalAmount: parseFloat(receiptData.total_amount),
        paymentMethod: receiptData.payment_method as PaymentMethod,
        date: receiptData.created_at,
        customerName: receiptData.customer_name,
        customerEmail: receiptData.customer_email,
        companyDetails: COMPANY_DETAILS,
      };
      generateWalletReceiptPDF(receipt);
    }
  }, [user?.id]);

  const hasMinimumBalance = useCallback((requiredAmount: number = MIN_BALANCE_REQUIRED) => {
    return state.availableBalance >= requiredAmount && state.availableBalance >= MIN_BALANCE_REQUIRED;
  }, [state.availableBalance]);

  const resetPaymentState = useCallback(() => {
    setPaymentState({ isProcessing: false, status: 'pending', message: '' });
  }, []);

  return {
    balance: state.balance,
    availableBalance: state.availableBalance,
    heldAmount: state.heldAmount,
    transactions: state.transactions,
    isLoading: state.isLoading,
    error: state.error,
    isPaymentProcessing: paymentState.isProcessing,
    paymentStatus: paymentState.status,
    paymentMessage: paymentState.message,
    addFunds,
    deductFunds,
    processRefund,
    refreshBalance,
    getHistory,
    downloadTransactionReceipt,
    hasMinimumBalance,
    resetPaymentState,
  };
}

export { MIN_RECHARGE_AMOUNT, MIN_BALANCE_REQUIRED };
