import { generateId } from '../../lib/utils.js';
import { PartnersEnv, PartnersEnvInput } from '../models/PartnersEnv.js';
import type { Env } from '../types/interface.js';

async function encryptKey(key: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


export default function makePartnersEnvService(env: Env) {
  const db = env.datastoraged01;
  const SECRET = env.DROGUIER_VAR_NAME || 'default-secret-key';

  async function list(): Promise<PartnersEnv[]> {
    const { results } = await db.prepare(
      'SELECT * FROM partners_environment ORDER BY created_at DESC'
    ).all<PartnersEnv>();
      return results.map<PartnersEnv>(row => ({
        id: row.id,
        key: row.key,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone || '',
        summary: row.summary || '',
        created_at: row.created_at,
        updated_at: row.updated_at,
        active: row.active,
        bookmarks_favorites: row.bookmarks_favorites
    })) ;
  }

  async function getById(id: string): Promise<PartnersEnv | null> {
    const result = await db.prepare(
      'SELECT * FROM partners_environment WHERE id = ?'
    ).bind(id).first<PartnersEnv>();
    
    if (!result) return null;

    return {
      id: result.id,
      key: result.key,
      full_name: result.full_name,
      email: result.email,
      phone: result.phone || '',
      summary: result.summary || '',
      created_at: result.created_at,
      updated_at: result.updated_at,
      active: typeof result.active === 'string' ? parseInt(result.active, 10) : result.active,
      bookmarks_favorites: result.bookmarks_favorites
    };
  }

  async function getByKey(key: string): Promise<PartnersEnv | null> {
    const result = await db.prepare(
      'SELECT * FROM partners_environment WHERE key = ?'
    ).bind(key).first<PartnersEnv>();
    
    if (!result) return null;

    return {
      id: result.id,
      key: result.key,
      full_name: result.full_name,
      email: result.email,
      phone: result.phone || '',
      summary: result.summary || '',
      created_at: result.created_at,
      updated_at: result.updated_at,
      active: typeof result.active === 'string' ? parseInt(result.active, 10) : result.active,
      bookmarks_favorites: result.bookmarks_favorites
    };
  }

  async function getByFilter(filter: PartnersEnvInput): Promise<PartnersEnv[]> {
    let sql = 'SELECT * FROM partners_environment WHERE 1=1';
    const params: string[] = [];

    if (filter.key && filter.key.trim() !== '') {
      const encryptedKey = await encryptKey(filter.key.trim(), SECRET);
      sql += ' AND key = ?';
      params.push(encryptedKey);
    }

    if (filter.full_name && filter.full_name.trim() !== '') {
      sql += ' AND full_name = ?';
      params.push(filter.full_name.trim());
    }

    if (filter.email && filter.email.trim() !== '') {
      sql += ' AND email = ?';
      params.push(filter.email.trim());
    }

    if (filter.phone && filter.phone.trim() !== '') {
      sql += ' AND phone = ?';
      params.push(filter.phone.trim());
    }

    if (filter.summary && filter.summary.trim() !== '') {
      sql += ' AND summary = ?';
      params.push(filter.summary.trim());
    }

    const { results } = await db.prepare(sql).bind(...params).all<PartnersEnv>();

    return results.map(row => ({
      id: row.id,
      key: row.key,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone || '',
      summary: row.summary || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
      active: row.active,
      bookmarks_favorites: row.bookmarks_favorites
    }));
  }

  async function create(data: PartnersEnvInput): Promise<PartnersEnv> {    
    /**backoffice - simple rapid implement */    
    const emailLower = data.email.toLowerCase();
    //const encryptedKey = await encryptKey(data.key, SECRET); // PROD CONSERVAR
    const encryptedKey = await encryptKey(emailLower, SECRET); // PROD ELIMINAR
    const encryptedOriginalKey = await encryptKey(data.key, SECRET);

    //validate unicidad email
    const existing = await db.prepare(
      'SELECT id FROM partners_environment WHERE email = ?'
    ).bind(emailLower).first<{ id: string }>();

    if (existing) {
      throw new Error('Email already exists');
    }

    const id = generateId();
    const now = new Date().toISOString();
    //
    const active = data.active ?? 1;
    await db.prepare(`
      INSERT INTO partners_environment (id, key, full_name, email, phone, summary, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      encryptedKey,
      data.full_name,
      emailLower,
      data.phone || null,
      encryptedOriginalKey,
      active,
      now,
      now
    ).run();

    const created = await getById(id);
    if (!created) {
      throw new Error('Failed to fetch created partner environment');
    }

    return created;
  }

  async function update(id: string, data: PartnersEnvInput): Promise<PartnersEnv | null> {
    const existing = await getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const active = data.active ?? existing.active;
    const bookmarksFavorites = data.bookmarks_favorites ?? "";

    await db.prepare(`
      UPDATE partners_environment
      SET full_name = ?, email = ?, phone = ?, summary = ?, active = ? , bookmarks_favorites = ? , updated_at = ?
      WHERE id = ?
    `).bind(
      data.full_name,
      data.email,
      data.phone || null,
      data.summary || null,
      active,
      bookmarksFavorites,
      now,
      id
    ).run();

    return {
      id,
      key: existing.key,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      summary: data.summary,
      created_at: existing.created_at,
      updated_at: now,
      active,
      bookmarks_favorites: data.bookmarks_favorites ?? ""
    };
  }

  ///async function remove(id: string): Promise<PartnersEnv | null> {
  ///  const existing = await getById(id);
  ///  if (!existing) return null;
  ///
  ///  await db.prepare('DELETE FROM partners_environment WHERE id = ?').bind(id).run();
  ///  return existing;
  ///}

  async function validatePartnersEnv(data: unknown): Promise<string[]> {
    const errors: string[] = [];
    console.log('Validating bookmark data:', data);

    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format');
      return errors;
    }

    const d = data as Record<string, unknown>;
    
    /*
    if (!d.key || typeof d.key !== 'string' || d.key.trim() === '') {
      errors.push('Key is required and must be a non-empty string');
    }
    */
    
    if (!d.full_name || typeof d.full_name !== 'string' || d.full_name.trim() === '') {
      errors.push('Full name is required and must be a non-empty string');
    }
    
    if (!d.email || typeof d.email !== 'string' || d.email.trim() === '') {
      errors.push('Email is required and must be a non-empty string');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(d.email)) {
        errors.push('Email must be a valid email address');
      }
    }
    
    if (d.phone !== undefined && d.phone !== null && typeof d.phone !== 'string') {
      errors.push('Phone must be a string');
    }
    
    if (d.summary !== undefined && d.summary !== null && typeof d.summary !== 'string') {
      errors.push('Summary must be a string');
    }

    return errors;
  }

  return {
    list,
    getById,
    getByKey,
    getByFilter,
    create,
    update,
    //remove,
    validatePartnersEnv,
  };
}
