-- Table for D1 Payments Database
-- Generic payments backup + relationship to calendar events

DROP TABLE IF EXISTS event_payments;
DROP TABLE IF EXISTS payments;

CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    external_reference TEXT,
    provider TEXT NOT NULL,
    provider_payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    currency TEXT NOT NULL,
    amount_total INTEGER NOT NULL,
    amount_net INTEGER,
    amount_fee INTEGER,
    amount_tax INTEGER,
    paid_at TEXT,
    payer_name TEXT,
    payer_email TEXT,
    payer_phone TEXT,
    description TEXT,
    metadata TEXT,
    raw_payload TEXT,
    idempotency_key TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK (status IN ('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded', 'cancelled')),
    CHECK (amount_total >= 0),
    CHECK (amount_net IS NULL OR amount_net >= 0),
    CHECK (amount_fee IS NULL OR amount_fee >= 0),
    CHECK (amount_tax IS NULL OR amount_tax >= 0)
);

CREATE TABLE event_payments (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    applied_amount INTEGER NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'ticket',
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CHECK (applied_amount >= 0)
);

-- Indexes for faster queries
CREATE UNIQUE INDEX idx_payments_provider_payment_id
ON payments(provider, provider_payment_id)
WHERE provider_payment_id IS NOT NULL;

CREATE UNIQUE INDEX idx_payments_idempotency_key
ON payments(idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at DESC);
CREATE INDEX idx_payments_payer_email ON payments(payer_email);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

CREATE INDEX idx_event_payments_event_id ON event_payments(event_id);
CREATE INDEX idx_event_payments_payment_id ON event_payments(payment_id);
CREATE INDEX idx_event_payments_purpose ON event_payments(purpose);

CREATE UNIQUE INDEX idx_event_payments_event_payment_purpose
ON event_payments(event_id, payment_id, purpose);
