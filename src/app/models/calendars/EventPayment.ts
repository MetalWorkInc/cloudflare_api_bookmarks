export interface EventPayment {
  id: string;
  event_id: string;
  payment_id: string;
  applied_amount: number;
  purpose: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface EventPaymentInput {
  event_id: string;
  payment_id: string;
  applied_amount: number;
  purpose?: string;
  note?: string;
}
