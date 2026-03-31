import { generateId } from '../../../lib/utils.js';
import type { Env } from '../../types/interface.js';
import type { Payment, PaymentInput, PaymentStatus } from '../../models/calendars/Payment.js';

const EMPTY_STRING = '';
const DEFAULT_STATUS: PaymentStatus = 'pending';
const STATUS_CANCELLED: PaymentStatus = 'cancelled';

export default function makePaymentsService(env: Env) {
  const db = env.datastoraged01;

  async function list(status?: PaymentStatus): Promise<Payment[]> {
    const hasStatus = !!status;
    const sql = hasStatus
      ? 'SELECT * FROM payments WHERE status = ? ORDER BY created_at DESC'
      : 'SELECT * FROM payments ORDER BY created_at DESC';

    const stmt = db.prepare(sql);
    const result = hasStatus
      ? await stmt.bind(status).all<Payment>()
      : await stmt.all<Payment>();

    return result.results.map(mapRow);
  }

  async function getById(id: string): Promise<Payment | null> {
    const row = await db.prepare('SELECT * FROM payments WHERE id = ?').bind(id).first<Payment>();
    return row ? mapRow(row) : null;
  }

  async function create(data: PaymentInput): Promise<Payment> {
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(
      'INSERT INTO payments (id, external_reference, provider, provider_payment_id, status, currency, amount_total, amount_net, amount_fee, amount_tax, paid_at, payer_name, payer_email, payer_phone, description, metadata, raw_payload, idempotency_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      data.external_reference ? data.external_reference.trim() : EMPTY_STRING,
      data.provider.trim(),
      data.provider_payment_id ? data.provider_payment_id.trim() : EMPTY_STRING,
      data.status || DEFAULT_STATUS,
      data.currency.trim().toUpperCase(),
      Number(data.amount_total),
      data.amount_net === undefined ? null : data.amount_net,
      data.amount_fee === undefined ? null : data.amount_fee,
      data.amount_tax === undefined ? null : data.amount_tax,
      data.paid_at || EMPTY_STRING,
      data.payer_name ? data.payer_name.trim() : EMPTY_STRING,
      data.payer_email ? data.payer_email.trim().toLowerCase() : EMPTY_STRING,
      data.payer_phone ? data.payer_phone.trim() : EMPTY_STRING,
      data.description ? data.description.trim() : EMPTY_STRING,
      data.metadata ? data.metadata : EMPTY_STRING,
      data.raw_payload ? data.raw_payload : EMPTY_STRING,
      data.idempotency_key ? data.idempotency_key.trim() : EMPTY_STRING,
      now,
      now
    ).run();

    const created = await getById(id);
    if (!created) {
      throw new Error('Failed to fetch created payment');
    }

    return created;
  }

  async function update(id: string, data: Partial<PaymentInput>): Promise<Payment | null> {
    const existing = await getById(id);
    if (!existing) return null;

    const next = {
      external_reference: data.external_reference !== undefined ? data.external_reference.trim() : existing.external_reference,
      provider: data.provider !== undefined ? data.provider.trim() : existing.provider,
      provider_payment_id: data.provider_payment_id !== undefined ? data.provider_payment_id.trim() : existing.provider_payment_id,
      status: data.status || existing.status,
      currency: data.currency !== undefined ? data.currency.trim().toUpperCase() : existing.currency,
      amount_total: data.amount_total !== undefined ? Number(data.amount_total) : existing.amount_total,
      amount_net: data.amount_net !== undefined ? data.amount_net : existing.amount_net,
      amount_fee: data.amount_fee !== undefined ? data.amount_fee : existing.amount_fee,
      amount_tax: data.amount_tax !== undefined ? data.amount_tax : existing.amount_tax,
      paid_at: data.paid_at !== undefined ? data.paid_at : existing.paid_at,
      payer_name: data.payer_name !== undefined ? data.payer_name.trim() : existing.payer_name,
      payer_email: data.payer_email !== undefined ? data.payer_email.trim().toLowerCase() : existing.payer_email,
      payer_phone: data.payer_phone !== undefined ? data.payer_phone.trim() : existing.payer_phone,
      description: data.description !== undefined ? data.description.trim() : existing.description,
      metadata: data.metadata !== undefined ? data.metadata : existing.metadata,
      raw_payload: data.raw_payload !== undefined ? data.raw_payload : existing.raw_payload,
      idempotency_key: data.idempotency_key !== undefined ? data.idempotency_key.trim() : existing.idempotency_key,
    };

    const now = new Date().toISOString();

    await db.prepare(
      'UPDATE payments SET external_reference = ?, provider = ?, provider_payment_id = ?, status = ?, currency = ?, amount_total = ?, amount_net = ?, amount_fee = ?, amount_tax = ?, paid_at = ?, payer_name = ?, payer_email = ?, payer_phone = ?, description = ?, metadata = ?, raw_payload = ?, idempotency_key = ?, updated_at = ? WHERE id = ?'
    ).bind(
      next.external_reference,
      next.provider,
      next.provider_payment_id,
      next.status,
      next.currency,
      next.amount_total,
      next.amount_net,
      next.amount_fee,
      next.amount_tax,
      next.paid_at,
      next.payer_name,
      next.payer_email,
      next.payer_phone,
      next.description,
      next.metadata,
      next.raw_payload,
      next.idempotency_key,
      now,
      id
    ).run();

    return {
      ...existing,
      ...next,
      updated_at: now,
    };
  }

  async function remove(id: string): Promise<Payment | null> {
    return await update(id, { status: STATUS_CANCELLED });
  }

  async function validatePayment(data: unknown): Promise<string[]> {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') {
      errors.push('Invalid payload');
      return errors;
    }

    const input = data as Partial<PaymentInput>;

    if (!input.provider || typeof input.provider !== 'string' || input.provider.trim() === EMPTY_STRING) {
      errors.push('provider is required and must be a non-empty string');
    }

    if (!input.currency || typeof input.currency !== 'string' || input.currency.trim() === EMPTY_STRING) {
      errors.push('currency is required and must be a non-empty string');
    }

    if (input.amount_total === undefined || typeof input.amount_total !== 'number' || input.amount_total < 0) {
      errors.push('amount_total is required and must be a number greater than or equal to 0');
    }

    if (input.payer_email !== undefined && input.payer_email !== EMPTY_STRING) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.payer_email)) {
        errors.push('payer_email must be a valid email address');
      }
    }

    return errors;
  }

  function mapRow(row: Payment): Payment {
    return {
      id: row.id,
      external_reference: row.external_reference || EMPTY_STRING,
      provider: row.provider,
      provider_payment_id: row.provider_payment_id || EMPTY_STRING,
      status: row.status,
      currency: row.currency,
      amount_total: Number(row.amount_total),
      amount_net: row.amount_net === null || row.amount_net === undefined ? null : Number(row.amount_net),
      amount_fee: row.amount_fee === null || row.amount_fee === undefined ? null : Number(row.amount_fee),
      amount_tax: row.amount_tax === null || row.amount_tax === undefined ? null : Number(row.amount_tax),
      paid_at: row.paid_at || EMPTY_STRING,
      payer_name: row.payer_name || EMPTY_STRING,
      payer_email: row.payer_email || EMPTY_STRING,
      payer_phone: row.payer_phone || EMPTY_STRING,
      description: row.description || EMPTY_STRING,
      metadata: row.metadata || EMPTY_STRING,
      raw_payload: row.raw_payload || EMPTY_STRING,
      idempotency_key: row.idempotency_key || EMPTY_STRING,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  return {
    list,
    getById,
    create,
    update,
    remove,
    validatePayment,
  };
}
