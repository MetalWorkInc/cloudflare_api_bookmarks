import { generateId } from '../../../lib/utils.js';
import type { Env } from '../../types/interface.js';
import type { CalendarEvent, CalendarEventInput } from '../../models/calendars/CalendarEvent.js';

const EMPTY_STRING = '';
const STATUS_CANCELLED: CalendarEvent['status'] = 'cancelled';

export default function makeCalendarEventsService(env: Env) {
  const db = env.datastoraged01;

  async function listByCalendar(calendarId: string, includeCancelled = false): Promise<CalendarEvent[]> {
    const sql = includeCancelled
      ? 'SELECT * FROM events WHERE calendar_id = ? ORDER BY start_at_utc ASC'
      : 'SELECT * FROM events WHERE calendar_id = ? AND status <> ? ORDER BY start_at_utc ASC';

    const stmt = db.prepare(sql);
    const result = includeCancelled
      ? await stmt.bind(calendarId).all<CalendarEvent>()
      : await stmt.bind(calendarId, STATUS_CANCELLED).all<CalendarEvent>();

    return result.results.map((row) => ({
      id: row.id,
      calendar_id: row.calendar_id,
      title: row.title,
      description: row.description || EMPTY_STRING,
      location: row.location || EMPTY_STRING,
      start_at_utc: row.start_at_utc,
      end_at_utc: row.end_at_utc,
      is_all_day: Number(row.is_all_day || 0),
      is_exclusive: Number(row.is_exclusive || 0),
      status: row.status,
      visibility: row.visibility,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async function getById(id: string): Promise<CalendarEvent | null> {
    const row = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first<CalendarEvent>();
    if (!row) return null;

    return {
      id: row.id,
      calendar_id: row.calendar_id,
      title: row.title,
      description: row.description || EMPTY_STRING,
      location: row.location || EMPTY_STRING,
      start_at_utc: row.start_at_utc,
      end_at_utc: row.end_at_utc,
      is_all_day: Number(row.is_all_day || 0),
      is_exclusive: Number(row.is_exclusive || 0),
      status: row.status,
      visibility: row.visibility,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async function create(data: CalendarEventInput): Promise<CalendarEvent> {
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(
      'INSERT INTO events (id, calendar_id, title, description, location, start_at_utc, end_at_utc, is_all_day, is_exclusive, status, visibility, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      data.calendar_id.trim(),
      data.title.trim(),
      data.description ? data.description.trim() : EMPTY_STRING,
      data.location ? data.location.trim() : EMPTY_STRING,
      data.start_at_utc,
      data.end_at_utc,
      Number(data.is_all_day || 0),
      Number(data.is_exclusive || 0),
      data.status || 'confirmed',
      data.visibility || 'private',
      data.created_by.trim(),
      now,
      now
    ).run();

    return {
      id,
      calendar_id: data.calendar_id.trim(),
      title: data.title.trim(),
      description: data.description ? data.description.trim() : EMPTY_STRING,
      location: data.location ? data.location.trim() : EMPTY_STRING,
      start_at_utc: data.start_at_utc,
      end_at_utc: data.end_at_utc,
      is_all_day: Number(data.is_all_day || 0),
      is_exclusive: Number(data.is_exclusive || 0),
      status: data.status || 'confirmed',
      visibility: data.visibility || 'private',
      created_by: data.created_by.trim(),
      created_at: now,
      updated_at: now,
    };
  }

  async function update(id: string, data: Partial<CalendarEventInput>): Promise<CalendarEvent | null> {
    const existing = await getById(id);
    if (!existing) return null;

    const nextCalendarId = data.calendar_id ? data.calendar_id.trim() : existing.calendar_id;
    const nextTitle = data.title ? data.title.trim() : existing.title;
    const nextDescription = data.description !== undefined ? data.description.trim() : existing.description;
    const nextLocation = data.location !== undefined ? data.location.trim() : existing.location;
    const nextStart = data.start_at_utc || existing.start_at_utc;
    const nextEnd = data.end_at_utc || existing.end_at_utc;
    const nextAllDay = data.is_all_day !== undefined ? Number(data.is_all_day) : existing.is_all_day;
    const nextExclusive = data.is_exclusive !== undefined ? Number(data.is_exclusive) : existing.is_exclusive;
    const nextStatus = data.status || existing.status;
    const nextVisibility = data.visibility || existing.visibility;
    const nextCreatedBy = data.created_by ? data.created_by.trim() : existing.created_by;
    const now = new Date().toISOString();

    await db.prepare(
      'UPDATE events SET calendar_id = ?, title = ?, description = ?, location = ?, start_at_utc = ?, end_at_utc = ?, is_all_day = ?, is_exclusive = ?, status = ?, visibility = ?, created_by = ?, updated_at = ? WHERE id = ?'
    ).bind(
      nextCalendarId,
      nextTitle,
      nextDescription,
      nextLocation,
      nextStart,
      nextEnd,
      nextAllDay,
      nextExclusive,
      nextStatus,
      nextVisibility,
      nextCreatedBy,
      now,
      id
    ).run();

    return {
      id,
      calendar_id: nextCalendarId,
      title: nextTitle,
      description: nextDescription,
      location: nextLocation,
      start_at_utc: nextStart,
      end_at_utc: nextEnd,
      is_all_day: nextAllDay,
      is_exclusive: nextExclusive,
      status: nextStatus,
      visibility: nextVisibility,
      created_by: nextCreatedBy,
      created_at: existing.created_at,
      updated_at: now,
    };
  }

  async function remove(id: string): Promise<CalendarEvent | null> {
    // Soft delete: event is cancelled but retained in storage.
    return await update(id, { status: STATUS_CANCELLED });
  }

  async function validateEvent(data: unknown): Promise<string[]> {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') {
      errors.push('Invalid payload');
      return errors;
    }

    const input = data as Partial<CalendarEventInput>;

    if (!input.calendar_id || typeof input.calendar_id !== 'string' || input.calendar_id.trim() === EMPTY_STRING) {
      errors.push('calendar_id is required and must be a non-empty string');
    }

    if (!input.title || typeof input.title !== 'string' || input.title.trim() === EMPTY_STRING) {
      errors.push('title is required and must be a non-empty string');
    }

    if (!input.start_at_utc || typeof input.start_at_utc !== 'string') {
      errors.push('start_at_utc is required and must be a string');
    }

    if (!input.end_at_utc || typeof input.end_at_utc !== 'string') {
      errors.push('end_at_utc is required and must be a string');
    }

    if (input.start_at_utc && input.end_at_utc) {
      const start = Date.parse(input.start_at_utc);
      const end = Date.parse(input.end_at_utc);
      if (Number.isNaN(start) || Number.isNaN(end)) {
        errors.push('start_at_utc and end_at_utc must be valid ISO dates');
      } else if (end <= start) {
        errors.push('end_at_utc must be greater than start_at_utc');
      }
    }

    if (!input.created_by || typeof input.created_by !== 'string' || input.created_by.trim() === EMPTY_STRING) {
      errors.push('created_by is required and must be a non-empty string');
    }

    return errors;
  }

  return {
    listByCalendar,
    getById,
    create,
    update,
    remove,
    validateEvent,
  };
}
