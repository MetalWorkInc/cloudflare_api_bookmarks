import { generateId } from '../../../lib/utils.js';
import type { Env } from '../../types/interface.js';
import type { EventChangeRequest, EventChangeRequestInput } from '../../models/calendars/EventChangeRequest.js';

const EMPTY_STRING = '';

export default function makeEventChangeRequestsService(env: Env) {
  const db = env.datastoraged01;

  async function listByEvent(eventId: string): Promise<EventChangeRequest[]> {
    const { results } = await db.prepare(
      'SELECT * FROM event_change_requests WHERE event_id = ? ORDER BY requested_at DESC'
    ).bind(eventId).all<EventChangeRequest>();

    return results.map(mapRow);
  }

  async function getById(id: string): Promise<EventChangeRequest | null> {
    const row = await db.prepare('SELECT * FROM event_change_requests WHERE id = ?').bind(id).first<EventChangeRequest>();
    return row ? mapRow(row) : null;
  }

  async function create(data: EventChangeRequestInput): Promise<EventChangeRequest> {
    const id = generateId();
    const now = new Date().toISOString();
    const requestedAt = data.requested_at || now;

    await db.prepare(
      'INSERT INTO event_change_requests (id, event_id, requested_by, requested_at, status, reviewed_by, reviewed_at, review_note, original_title, original_description, original_location, original_start_at_utc, original_end_at_utc, original_is_all_day, original_is_exclusive, desired_title, desired_description, desired_location, desired_start_at_utc, desired_end_at_utc, desired_is_all_day, desired_is_exclusive, reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      data.event_id.trim(),
      data.requested_by.trim(),
      requestedAt,
      data.status || 'pending',
      data.reviewed_by ? data.reviewed_by.trim() : EMPTY_STRING,
      data.reviewed_at || EMPTY_STRING,
      data.review_note ? data.review_note.trim() : EMPTY_STRING,
      data.original_title ? data.original_title.trim() : EMPTY_STRING,
      data.original_description ? data.original_description.trim() : EMPTY_STRING,
      data.original_location ? data.original_location.trim() : EMPTY_STRING,
      data.original_start_at_utc,
      data.original_end_at_utc,
      Number(data.original_is_all_day || 0),
      Number(data.original_is_exclusive || 0),
      data.desired_title ? data.desired_title.trim() : EMPTY_STRING,
      data.desired_description ? data.desired_description.trim() : EMPTY_STRING,
      data.desired_location ? data.desired_location.trim() : EMPTY_STRING,
      data.desired_start_at_utc,
      data.desired_end_at_utc,
      Number(data.desired_is_all_day || 0),
      Number(data.desired_is_exclusive || 0),
      data.reason ? data.reason.trim() : EMPTY_STRING,
      now,
      now
    ).run();

    return {
      id,
      event_id: data.event_id.trim(),
      requested_by: data.requested_by.trim(),
      requested_at: requestedAt,
      status: data.status || 'pending',
      reviewed_by: data.reviewed_by ? data.reviewed_by.trim() : EMPTY_STRING,
      reviewed_at: data.reviewed_at || EMPTY_STRING,
      review_note: data.review_note ? data.review_note.trim() : EMPTY_STRING,
      original_title: data.original_title ? data.original_title.trim() : EMPTY_STRING,
      original_description: data.original_description ? data.original_description.trim() : EMPTY_STRING,
      original_location: data.original_location ? data.original_location.trim() : EMPTY_STRING,
      original_start_at_utc: data.original_start_at_utc,
      original_end_at_utc: data.original_end_at_utc,
      original_is_all_day: Number(data.original_is_all_day || 0),
      original_is_exclusive: Number(data.original_is_exclusive || 0),
      desired_title: data.desired_title ? data.desired_title.trim() : EMPTY_STRING,
      desired_description: data.desired_description ? data.desired_description.trim() : EMPTY_STRING,
      desired_location: data.desired_location ? data.desired_location.trim() : EMPTY_STRING,
      desired_start_at_utc: data.desired_start_at_utc,
      desired_end_at_utc: data.desired_end_at_utc,
      desired_is_all_day: Number(data.desired_is_all_day || 0),
      desired_is_exclusive: Number(data.desired_is_exclusive || 0),
      reason: data.reason ? data.reason.trim() : EMPTY_STRING,
      created_at: now,
      updated_at: now,
    };
  }

  async function update(id: string, data: Partial<EventChangeRequestInput>): Promise<EventChangeRequest | null> {
    const existing = await getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();

    const next = {
      event_id: data.event_id ? data.event_id.trim() : existing.event_id,
      requested_by: data.requested_by ? data.requested_by.trim() : existing.requested_by,
      requested_at: data.requested_at || existing.requested_at,
      status: data.status || existing.status,
      reviewed_by: data.reviewed_by !== undefined ? data.reviewed_by.trim() : existing.reviewed_by,
      reviewed_at: data.reviewed_at !== undefined ? data.reviewed_at : existing.reviewed_at,
      review_note: data.review_note !== undefined ? data.review_note.trim() : existing.review_note,
      original_title: data.original_title !== undefined ? data.original_title.trim() : existing.original_title,
      original_description: data.original_description !== undefined ? data.original_description.trim() : existing.original_description,
      original_location: data.original_location !== undefined ? data.original_location.trim() : existing.original_location,
      original_start_at_utc: data.original_start_at_utc || existing.original_start_at_utc,
      original_end_at_utc: data.original_end_at_utc || existing.original_end_at_utc,
      original_is_all_day: data.original_is_all_day !== undefined ? Number(data.original_is_all_day) : existing.original_is_all_day,
      original_is_exclusive: data.original_is_exclusive !== undefined ? Number(data.original_is_exclusive) : existing.original_is_exclusive,
      desired_title: data.desired_title !== undefined ? data.desired_title.trim() : existing.desired_title,
      desired_description: data.desired_description !== undefined ? data.desired_description.trim() : existing.desired_description,
      desired_location: data.desired_location !== undefined ? data.desired_location.trim() : existing.desired_location,
      desired_start_at_utc: data.desired_start_at_utc || existing.desired_start_at_utc,
      desired_end_at_utc: data.desired_end_at_utc || existing.desired_end_at_utc,
      desired_is_all_day: data.desired_is_all_day !== undefined ? Number(data.desired_is_all_day) : existing.desired_is_all_day,
      desired_is_exclusive: data.desired_is_exclusive !== undefined ? Number(data.desired_is_exclusive) : existing.desired_is_exclusive,
      reason: data.reason !== undefined ? data.reason.trim() : existing.reason,
    };

    await db.prepare(
      'UPDATE event_change_requests SET event_id = ?, requested_by = ?, requested_at = ?, status = ?, reviewed_by = ?, reviewed_at = ?, review_note = ?, original_title = ?, original_description = ?, original_location = ?, original_start_at_utc = ?, original_end_at_utc = ?, original_is_all_day = ?, original_is_exclusive = ?, desired_title = ?, desired_description = ?, desired_location = ?, desired_start_at_utc = ?, desired_end_at_utc = ?, desired_is_all_day = ?, desired_is_exclusive = ?, reason = ?, updated_at = ? WHERE id = ?'
    ).bind(
      next.event_id,
      next.requested_by,
      next.requested_at,
      next.status,
      next.reviewed_by,
      next.reviewed_at,
      next.review_note,
      next.original_title,
      next.original_description,
      next.original_location,
      next.original_start_at_utc,
      next.original_end_at_utc,
      next.original_is_all_day,
      next.original_is_exclusive,
      next.desired_title,
      next.desired_description,
      next.desired_location,
      next.desired_start_at_utc,
      next.desired_end_at_utc,
      next.desired_is_all_day,
      next.desired_is_exclusive,
      next.reason,
      now,
      id
    ).run();

    return {
      ...existing,
      ...next,
      updated_at: now,
    };
  }

  async function remove(id: string): Promise<EventChangeRequest | null> {
    // Soft delete: set request status to cancelled.
    return await update(id, { status: 'cancelled' });
  }

  async function validateChangeRequest(data: unknown): Promise<string[]> {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') {
      errors.push('Invalid payload');
      return errors;
    }

    const input = data as Partial<EventChangeRequestInput>;

    if (!input.event_id || typeof input.event_id !== 'string' || input.event_id.trim() === EMPTY_STRING) {
      errors.push('event_id is required and must be a non-empty string');
    }

    if (!input.requested_by || typeof input.requested_by !== 'string' || input.requested_by.trim() === EMPTY_STRING) {
      errors.push('requested_by is required and must be a non-empty string');
    }

    if (!input.original_start_at_utc || !input.original_end_at_utc) {
      errors.push('original_start_at_utc and original_end_at_utc are required');
    }

    if (!input.desired_start_at_utc || !input.desired_end_at_utc) {
      errors.push('desired_start_at_utc and desired_end_at_utc are required');
    }

    return errors;
  }

  function mapRow(row: EventChangeRequest): EventChangeRequest {
    return {
      id: row.id,
      event_id: row.event_id,
      requested_by: row.requested_by,
      requested_at: row.requested_at,
      status: row.status,
      reviewed_by: row.reviewed_by || EMPTY_STRING,
      reviewed_at: row.reviewed_at || EMPTY_STRING,
      review_note: row.review_note || EMPTY_STRING,
      original_title: row.original_title || EMPTY_STRING,
      original_description: row.original_description || EMPTY_STRING,
      original_location: row.original_location || EMPTY_STRING,
      original_start_at_utc: row.original_start_at_utc,
      original_end_at_utc: row.original_end_at_utc,
      original_is_all_day: Number(row.original_is_all_day || 0),
      original_is_exclusive: Number(row.original_is_exclusive || 0),
      desired_title: row.desired_title || EMPTY_STRING,
      desired_description: row.desired_description || EMPTY_STRING,
      desired_location: row.desired_location || EMPTY_STRING,
      desired_start_at_utc: row.desired_start_at_utc,
      desired_end_at_utc: row.desired_end_at_utc,
      desired_is_all_day: Number(row.desired_is_all_day || 0),
      desired_is_exclusive: Number(row.desired_is_exclusive || 0),
      reason: row.reason || EMPTY_STRING,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  return {
    listByEvent,
    getById,
    create,
    update,
    remove,
    validateChangeRequest,
  };
}
