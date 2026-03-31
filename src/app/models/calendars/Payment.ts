export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'cancelled';

export interface Payment {
  id: string;
  external_reference: string;
  provider: string;
  provider_payment_id: string;
  status: PaymentStatus;
  currency: string;
  amount_total: number;
  amount_net: number | null;
  amount_fee: number | null;
  amount_tax: number | null;
  paid_at: string;
  payer_name: string;
  payer_email: string;
  payer_phone: string;
  description: string;
  metadata: string;
  raw_payload: string;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentInput {
  external_reference?: string;
  provider: string;
  provider_payment_id?: string;
  status?: PaymentStatus;
  currency: string;
  amount_total: number;
  amount_net?: number | null;
  amount_fee?: number | null;
  amount_tax?: number | null;
  paid_at?: string;
  payer_name?: string;
  payer_email?: string;
  payer_phone?: string;
  description?: string;
  metadata?: string;
  raw_payload?: string;
  idempotency_key?: string;
}
