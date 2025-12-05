import { generateId } from '../../lib/utils.js';
import { PartnersEnv, PartnersEnvInput } from '../models/PartnersEnv.js';
import type { Env } from '../types/interface.js';

interface PartnersEnvRow {
  id: string;
  key: string;
  full_name: string;
  email: string;
  phone: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

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
    ).all<PartnersEnvRow>();
    
    return results.map(row => ({
      id: row.id,
      key: row.key,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone || '',
      summary: row.summary || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async function getById(id: string): Promise<PartnersEnv | null> {
    const result = await db.prepare(
      'SELECT * FROM partners_environment WHERE id = ?'
    ).bind(id).first<PartnersEnvRow>();
    
    if (!result) return null;

    return {
      id: result.id,
      key: result.key,
      fullName: result.full_name,
      email: result.email,
      phone: result.phone || '',
      summary: result.summary || '',
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  async function getByKey(key: string): Promise<PartnersEnv | null> {
    const result = await db.prepare(
      'SELECT * FROM partners_environment WHERE key = ?'
    ).bind(key).first<PartnersEnvRow>();
    
    if (!result) return null;

    return {
      id: result.id,
      key: result.key,
      fullName: result.full_name,
      email: result.email,
      phone: result.phone || '',
      summary: result.summary || '',
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  async function create(data: PartnersEnvInput): Promise<PartnersEnv> {
    const id = generateId();
    const now = new Date().toISOString();
    const encryptedKey = await encryptKey(data.key, SECRET);

    await db.prepare(`
      INSERT INTO partners_environment (id, key, full_name, email, phone, summary, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      encryptedKey,
      data.fullName,
      data.email,
      data.phone || null,
      data.summary || null,
      now,
      now
    ).run();

    return {
      id,
      key: encryptedKey,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      summary: data.summary,
      createdAt: now,
      updatedAt: now,
    };
  }

  async function update(id: string, data: PartnersEnvInput): Promise<PartnersEnv | null> {
    const existing = await getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const encryptedKey = await encryptKey(data.key, SECRET);

    await db.prepare(`
      UPDATE partners_environment
      SET key = ?, full_name = ?, email = ?, phone = ?, summary = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      encryptedKey,
      data.fullName,
      data.email,
      data.phone || null,
      data.summary || null,
      now,
      id
    ).run();

    return {
      id,
      key: encryptedKey,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      summary: data.summary,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  }

  async function remove(id: string): Promise<PartnersEnv | null> {
    const existing = await getById(id);
    if (!existing) return null;

    await db.prepare('DELETE FROM partners_environment WHERE id = ?').bind(id).run();
    return existing;
  }

  async function validatePartnersEnv(data: unknown): Promise<string[]> {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format');
      return errors;
    }

    const d = data as Record<string, unknown>;
    
    if (!d.key || typeof d.key !== 'string' || d.key.trim() === '') {
      errors.push('Key is required and must be a non-empty string');
    }
    
    if (!d.fullName || typeof d.fullName !== 'string' || d.fullName.trim() === '') {
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
    create,
    update,
    remove,
    validatePartnersEnv,
  };
}
