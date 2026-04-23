CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('top_up', 'transfer')),
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL,
  sender_wallet_id UUID REFERENCES wallets(id),
  receiver_wallet_id UUID REFERENCES wallets(id),
  reference VARCHAR(255) NOT NULL UNIQUE,
  idempotency_key VARCHAR(255),
  description VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_sender_wallet_id ON ledger_entries(sender_wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_receiver_wallet_id ON ledger_entries(receiver_wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON ledger_entries(reference);
