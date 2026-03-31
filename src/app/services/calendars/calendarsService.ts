import { generateId } from '../../../lib/utils.js';
import type { Env } from '../../types/interface.js';
import type { Calendar, CalendarInput } from '../../models/calendars/Calendar.js';

const EMPTY_STRING = '';

export default function makeCalendarsService(env: Env) {
  const db = env.datastoraged01;

  async function list(ownerUserId?: string): Promise<Calendar[]> {
    const hasOwner = !!ownerUserId && ownerUserId.trim() !== EMPTY_STRING;
    const sql = hasOwner
      ? 'SELECT * FROM calendars WHERE owner_user_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM calendars ORDER BY created_at DESC';
    const stmt = db.prepare(sql);
    const result = hasOwner
      ? await stmt.bind(ownerUserId!.trim()).all<Calendar>()
      : await stmt.all<Calendar>();
    return result.results.map((row) => ({
      id: row.id,
      owner_user_id: row.owner_user_id,
      name: row.name,
      timezone: row.timezone,
      color: row.color || EMPTY_STRING,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async function getById(id: string): Promise<Calendar | null> {
    const row = await db.prepare('SELECT * FROM calendars WHERE id = ?').bind(id).first<Calendar>();
    if (!row) return null;
    return {
      id: row.id,
      owner_user_id: row.owner_user_id,
      name: row.name,
      timezone: row.timezone,
      color: row.color || EMPTY_STRING,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async function create(data: CalendarInput): Promise<Calendar> {
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(
      'INSERT INTO calendars (id, owner_user_id, name, timezone, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      data.owner_user_id.trim(),
      data.name.trim(),
      data.timezone.trim(),
      data.color ? data.color.trim() : EMPTY_STRING,
      now,
      now
    ).run();

    return {
      id,
      owner_user_id: data.owner_user_id.trim(),
      name: data.name.trim(),
      timezone: data.timezone.trim(),
      color: data.color ? data.color.trim() : EMPTY_STRING,
      created_at: now,
      updated_at: now,
    };
  }

  async function update(id: string, data: Partial<CalendarInput>): Promise<Calendar | null> {
    const existing = await getById(id);
    if (!existing) return null;

    const nextOwner = data.owner_user_id ? data.owner_user_id.trim() : existing.owner_user_id;
    const nextName = data.name ? data.name.trim() : existing.name;
    const nextTimezone = data.timezone ? data.timezone.trim() : existing.timezone;
    const nextColor = data.color !== undefined ? data.color.trim() : existing.color;
    const now = new Date().toISOString();

    await db.prepare(
      'UPDATE calendars SET owner_user_id = ?, name = ?, timezone = ?, color = ?, updated_at = ? WHERE id = ?'
    ).bind(nextOwner, nextName, nextTimezone, nextColor, now, id).run();

    return {
      id,
      owner_user_id: nextOwner,
      name: nextName,
      timezone: nextTimezone,
      color: nextColor,
      created_at: existing.created_at,
      updated_at: now,
    };
  }

  async function validateCalendar(data: unknown): Promise<string[]> {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') {
      errors.push('Invalid payload');
      return errors;
    }

    const input = data as Partial<CalendarInput>;

    if (!input.owner_user_id || typeof input.owner_user_id !== 'string' || input.owner_user_id.trim() === EMPTY_STRING) {
      errors.push('owner_user_id is required and must be a non-empty string');
    }

    if (!input.name || typeof input.name !== 'string' || input.name.trim() === EMPTY_STRING) {
      errors.push('name is required and must be a non-empty string');
    }

    if (!input.timezone || typeof input.timezone !== 'string' || input.timezone.trim() === EMPTY_STRING) {
      errors.push('timezone is required and must be a non-empty string');
    }

    if (input.color !== undefined && typeof input.color !== 'string') {
      errors.push('color must be a string');
    }

    return errors;
  }

  return {
    list,
    getById,
    create,
    update,
    validateCalendar,
  };
}
