-- Wallet Ledger Migration
-- Creates the wallet_ledger table for immutable transaction records
-- Balance is ALWAYS computed from SUM of ledger entries, never stored directly

-- Create transaction type enum
CREATE TYPE wallet_transaction_type AS ENUM (
  'credit',
  'debit', 
  'refund',
  'hold',
  'release',
  'adjustment'
);

-- Create reference type enum
CREATE TYPE wallet_reference_type AS ENUM (
  'payment',
  'shipment',
  'refund'
);

-- Create payment method enum
CREATE TYPE wallet_payment_method AS ENUM (
  'upi',
  'card',
  'netbanking',
  'bank_transfer'
);

-- Main wallet ledger table (append-only, immutable)
CREATE TABLE wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type wallet_transaction_type NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  reference_id TEXT,
  reference_type wallet_reference_type,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast user lookups
CREATE INDEX idx_wallet_ledger_user_id ON wallet_ledger(user_id);
CREATE INDEX idx_wallet_ledger_created_at ON wallet_ledger(created_at DESC);
CREATE INDEX idx_wallet_ledger_reference_id ON wallet_ledger(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_wallet_ledger_idempotency ON wallet_ledger(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Wallet receipts table
CREATE TABLE wallet_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ledger_entry_id UUID NOT NULL REFERENCES wallet_ledger(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  transaction_id TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  gst_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_method wallet_payment_method NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_receipts_user_id ON wallet_receipts(user_id);
CREATE INDEX idx_wallet_receipts_ledger_entry ON wallet_receipts(ledger_entry_id);

-- Enable RLS
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallet_ledger
-- Users can only view their own ledger entries
CREATE POLICY "Users can view own ledger entries"
  ON wallet_ledger FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own ledger entries
CREATE POLICY "Users can insert own ledger entries"
  ON wallet_ledger FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- NO UPDATE OR DELETE policies - ledger is immutable!

-- RLS Policies for wallet_receipts
CREATE POLICY "Users can view own receipts"
  ON wallet_receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts"
  ON wallet_receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to compute wallet balance from ledger
CREATE OR REPLACE FUNCTION get_wallet_balance(p_user_id UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  v_balance DECIMAL(12, 2);
BEGIN
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN transaction_type IN ('credit', 'refund', 'release') THEN amount
        WHEN transaction_type IN ('debit', 'hold') THEN -amount
        ELSE 0
      END
    ), 0
  ) INTO v_balance
  FROM wallet_ledger
  WHERE user_id = p_user_id;
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available balance (excludes active holds)
CREATE OR REPLACE FUNCTION get_available_balance(p_user_id UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  v_total_balance DECIMAL(12, 2);
  v_active_holds DECIMAL(12, 2);
BEGIN
  -- Get total balance
  v_total_balance := get_wallet_balance(p_user_id);
  
  -- Calculate active holds (holds without matching releases)
  SELECT COALESCE(SUM(h.amount), 0) INTO v_active_holds
  FROM wallet_ledger h
  WHERE h.user_id = p_user_id
    AND h.transaction_type = 'hold'
    AND NOT EXISTS (
      SELECT 1 FROM wallet_ledger r
      WHERE r.user_id = p_user_id
        AND r.transaction_type = 'release'
        AND r.reference_id = h.id::text
    );
  
  RETURN v_total_balance - v_active_holds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add funds (with idempotency)
CREATE OR REPLACE FUNCTION add_wallet_funds(
  p_user_id UUID,
  p_amount DECIMAL(12, 2),
  p_description TEXT,
  p_reference_id TEXT,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_entry_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check for existing entry with same idempotency key
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM wallet_ledger
    WHERE idempotency_key = p_idempotency_key;
    
    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id;
    END IF;
  END IF;
  
  -- Insert new entry
  INSERT INTO wallet_ledger (
    user_id,
    transaction_type,
    amount,
    description,
    reference_id,
    reference_type,
    idempotency_key
  ) VALUES (
    p_user_id,
    'credit',
    p_amount,
    p_description,
    p_reference_id,
    'payment',
    p_idempotency_key
  ) RETURNING id INTO v_entry_id;
  
  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct funds (with balance check)
CREATE OR REPLACE FUNCTION deduct_wallet_funds(
  p_user_id UUID,
  p_amount DECIMAL(12, 2),
  p_description TEXT,
  p_shipment_id TEXT,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_available DECIMAL(12, 2);
  v_entry_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check for existing entry with same idempotency key
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM wallet_ledger
    WHERE idempotency_key = p_idempotency_key;
    
    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id;
    END IF;
  END IF;
  
  -- Check available balance
  v_available := get_available_balance(p_user_id);
  
  IF v_available < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: %', v_available;
  END IF;
  
  -- Insert debit entry
  INSERT INTO wallet_ledger (
    user_id,
    transaction_type,
    amount,
    description,
    reference_id,
    reference_type,
    idempotency_key
  ) VALUES (
    p_user_id,
    'debit',
    p_amount,
    p_description,
    p_shipment_id,
    'shipment',
    p_idempotency_key
  ) RETURNING id INTO v_entry_id;
  
  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial demo data for testing (optional - remove in production)
-- This will be triggered when a user first accesses their wallet
