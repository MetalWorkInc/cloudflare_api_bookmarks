import { generateId } from '../../../lib/utils.js';
import type { Env } from '../../types/interface.js';
import type { EventParticipant, EventParticipantInput } from '../../models/calendars/EventParticipant.js';

const EMPTY_STRING = '';

export default function makeEventParticipantsService(env: Env) {
  const db = env.datastoraged01;

  async function listByEvent(eventId: string): Promise<EventParticipant[]> {
    const { results } = await db.prepare(
      'SELECT * FROM event_participants WHERE event_id = ? ORDER BY created_at DESC'
    ).bind(eventId).all<EventParticipant>();

    return results.map((row) => ({
      id: row.id,
      event_id: row.event_id,
      full_name: row.full_name,
      email: row.email || EMPTY_STRING,
      age: row.age === null || row.age === undefined ? null : Number(row.age),
      phone: row.phone || EMPTY_STRING,
      company: row.company || EMPTY_STRING,
      role_label: row.role_label || EMPTY_STRING,
      notes: row.notes || EMPTY_STRING,
      raw_payload: row.raw_payload || EMPTY_STRING,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async function getById(id: string): Promise<EventParticipant | null> {
    const row = await db.prepare('SELECT * FROM event_participants WHERE id = ?').bind(id).first<EventParticipant>();
    if (!row) return null;

    return {
      id: row.id,
      event_id: row.event_id,
      full_name: row.full_name,
      email: row.email || EMPTY_STRING,
      age: row.age === null || row.age === undefined ? null : Number(row.age),
      phone: row.phone || EMPTY_STRING,
      company: row.company || EMPTY_STRING,
      role_label: row.role_label || EMPTY_STRING,
      notes: row.notes || EMPTY_STRING,
      raw_payload: row.raw_payload || EMPTY_STRING,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async function create(data: EventParticipantInput): Promise<EventParticipant> {
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(
      'INSERT INTO event_participants (id, event_id, full_name, email, age, phone, company, role_label, notes, raw_payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      data.event_id.trim(),
      data.full_name.trim(),
      data.email ? data.email.trim() : EMPTY_STRING,
      data.age === undefined ? null : data.age,
      data.phone ? data.phone.trim() : EMPTY_STRING,
      data.company ? data.company.trim() : EMPTY_STRING,
      data.role_label ? data.role_label.trim() : EMPTY_STRING,
      data.notes ? data.notes.trim() : EMPTY_STRING,
      data.raw_payload ? data.raw_payload : EMPTY_STRING,
      now,
      now
    ).run();

    return {
      id,
      event_id: data.event_id.trim(),
      full_name: data.full_name.trim(),
      email: data.email ? data.email.trim() : EMPTY_STRING,
      age: data.age === undefined ? null : data.age,
      phone: data.phone ? data.phone.trim() : EMPTY_STRING,
      company: data.company ? data.company.trim() : EMPTY_STRING,
      role_label: data.role_label ? data.role_label.trim() : EMPTY_STRING,
      notes: data.notes ? data.notes.trim() : EMPTY_STRING,
      raw_payload: data.raw_payload ? data.raw_payload : EMPTY_STRING,
      created_at: now,
      updated_at: now,
    };
  }

  async function update(id: string, data: Partial<EventParticipantInput>): Promise<EventParticipant | null> {
    const existing = await getById(id);
    if (!existing) return null;

    const nextEventId = data.event_id ? data.event_id.trim() : existing.event_id;
    const nextName = data.full_name ? data.full_name.trim() : existing.full_name;
    const nextEmail = data.email !== undefined ? data.email.trim() : existing.email;
    const nextAge = data.age !== undefined ? data.age : existing.age;
    const nextPhone = data.phone !== undefined ? data.phone.trim() : existing.phone;
    const nextCompany = data.company !== undefined ? data.company.trim() : existing.company;
    const nextRole = data.role_label !== undefined ? data.role_label.trim() : existing.role_label;
    const nextNotes = data.notes !== undefined ? data.notes.trim() : existing.notes;
    const nextRaw = data.raw_payload !== undefined ? data.raw_payload : existing.raw_payload;
    const now = new Date().toISOString();

    await db.prepare(
      'UPDATE event_participants SET event_id = ?, full_name = ?, email = ?, age = ?, phone = ?, company = ?, role_label = ?, notes = ?, raw_payload = ?, updated_at = ? WHERE id = ?'
    ).bind(
      nextEventId,
      nextName,
      nextEmail,
      nextAge,
      nextPhone,
      nextCompany,
      nextRole,
      nextNotes,
      nextRaw,
      now,
      id
    ).run();

    return {
      id,
      event_id: nextEventId,
      full_name: nextName,
      email: nextEmail,
      age: nextAge ?? null,
      phone: nextPhone,
      company: nextCompany,
      role_label: nextRole,
      notes: nextNotes,
      raw_payload: nextRaw,
      created_at: existing.created_at,
      updated_at: now,
    };
  }

  async function remove(id: string): Promise<EventParticipant | null> {
    // Soft delete marker: retained record with explicit note in raw payload.
    const existing = await getById(id);
    if (!existing) return null;

    let payloadObject: Record<string, unknown> = {};
    if (existing.raw_payload) {
      try {
        payloadObject = JSON.parse(existing.raw_payload) as Record<string, unknown>;
      } catch {
        payloadObject = { raw: existing.raw_payload };
      }
    }

    payloadObject.deleted = true;
    payloadObject.deleted_at = new Date().toISOString();

    return await update(id, {
      raw_payload: JSON.stringify(payloadObject),
      notes: existing.notes ? `${existing.notes} | marked-as-deleted` : 'marked-as-deleted',
    });
  }

  async function validateParticipant(data: unknown): Promise<string[]> {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') {
      errors.push('Invalid payload');
      return errors;
    }

    const input = data as Partial<EventParticipantInput>;

    if (!input.event_id || typeof input.event_id !== 'string' || input.event_id.trim() === EMPTY_STRING) {
      errors.push('event_id is required and must be a non-empty string');
    }

    if (!input.full_name || typeof input.full_name !== 'string' || input.full_name.trim() === EMPTY_STRING) {
      errors.push('full_name is required and must be a non-empty string');
    }

    if (input.email !== undefined && typeof input.email !== 'string') {
      errors.push('email must be a string');
    }

    if (input.age !== undefined && input.age !== null) {
      if (typeof input.age !== 'number' || input.age < 0) {
        errors.push('age must be a number greater than or equal to 0');
      }
    }

    return errors;
  }

  return {
    listByEvent,
    getById,
    create,
    update,
    remove,
    validateParticipant,
  };
}
