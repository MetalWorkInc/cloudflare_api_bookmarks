import { generateId } from '../../../lib/utils.js';
import type { Env } from '../../types/interface.js';
import type { EventPayment, EventPaymentInput } from '../../models/calendars/EventPayment.js';

const EMPTY_STRING = '';
const PURPOSE_CANCELLED = 'cancelled';

export default function makeEventPaymentsService(env: Env) {
  const db = env.datastoraged01;

  async function listByEvent(eventId: string): Promise<EventPayment[]> {
    const { results } = await db.prepare(
      'SELECT * FROM event_payments WHERE event_id = ? ORDER BY created_at DESC'
    ).bind(eventId).all<EventPayment>();

    return results.map(mapRow);
  }

  async function listByPayment(paymentId: string): Promise<EventPayment[]> {
    const { results } = await db.prepare(
      'SELECT * FROM event_payments WHERE payment_id = ? ORDER BY created_at DESC'
    ).bind(paymentId).all<EventPayment>();

    return results.map(mapRow);
  }

  async function getById(id: string): Promise<EventPayment | null> {
    const row = await db.prepare('SELECT * FROM event_payments WHERE id = ?').bind(id).first<EventPayment>();
    return row ? mapRow(row) : null;
  }

  async function create(data: EventPaymentInput): Promise<EventPayment> {
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(
      'INSERT INTO event_payments (id, event_id, payment_id, applied_amount, purpose, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      data.event_id.trim(),
      data.payment_id.trim(),
      Number(data.applied_amount),
      data.purpose ? data.purpose.trim() : 'ticket',
      data.note ? data.note.trim() : EMPTY_STRING,
      now,
      now
    ).run();

    const created = await getById(id);
    if (!created) {
      throw new Error('Failed to fetch created event payment');
    }

    return created;
  }

  async function update(id: string, data: Partial<EventPaymentInput>): Promise<EventPayment | null> {
    const existing = await getById(id);
    if (!existing) return null;

    const next = {
      event_id: data.event_id !== undefined ? data.event_id.trim() : existing.event_id,
      payment_id: data.payment_id !== undefined ? data.payment_id.trim() : existing.payment_id,
      applied_amount: data.applied_amount !== undefined ? Number(data.applied_amount) : existing.applied_amount,
      purpose: data.purpose !== undefined ? data.purpose.trim() : existing.purpose,
      note: data.note !== undefined ? data.note.trim() : existing.note,
    };

    const now = new Date().toISOString();

    await db.prepare(
      'UPDATE event_payments SET event_id = ?, payment_id = ?, applied_amount = ?, purpose = ?, note = ?, updated_at = ? WHERE id = ?'
    ).bind(
      next.event_id,
      next.payment_id,
      next.applied_amount,
      next.purpose,
      next.note,
      now,
      id
    ).run();

    return {
      ...existing,
      ...next,
      updated_at: now,
    };
  }

  async function remove(id: string): Promise<EventPayment | null> {
    const existing = await getById(id);
    if (!existing) return null;

    const note = existing.note
      ? `${existing.note} | marked-as-cancelled-link`
      : 'marked-as-cancelled-link';

    return await update(id, {
      applied_amount: 0,
      purpose: PURPOSE_CANCELLED,
      note,
    });
  }

  async function validateEventPayment(data: unknown): Promise<string[]> {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') {
      errors.push('Invalid payload');
      return errors;
    }

    const input = data as Partial<EventPaymentInput>;

    if (!input.event_id || typeof input.event_id !== 'string' || input.event_id.trim() === EMPTY_STRING) {
      errors.push('event_id is required and must be a non-empty string');
    }

    if (!input.payment_id || typeof input.payment_id !== 'string' || input.payment_id.trim() === EMPTY_STRING) {
      errors.push('payment_id is required and must be a non-empty string');
    }

    if (input.applied_amount === undefined || typeof input.applied_amount !== 'number' || input.applied_amount < 0) {
      errors.push('applied_amount is required and must be a number greater than or equal to 0');
    }

    return errors;
  }

  function mapRow(row: EventPayment): EventPayment {
    return {
      id: row.id,
      event_id: row.event_id,
      payment_id: row.payment_id,
      applied_amount: Number(row.applied_amount),
      purpose: row.purpose || 'ticket',
      note: row.note || EMPTY_STRING,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  return {
    listByEvent,
    listByPayment,
    getById,
    create,
    update,
    remove,
    validateEventPayment,
  };
}
