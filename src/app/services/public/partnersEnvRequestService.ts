import { generateId , encryptKey } from '../../../lib/utils.js';
import { PartnersEnvRequest, PartnersEnvRequestInput } from '../../models/PartnersEnvRequest.js';
import type { Env } from '../../types/interface.js';

const DEFAULT_SECRET_KEY = 'default-secret-key';
const EMPTY_STRING = '';
const DEFAULT_ACTIVE = 1;

const ERR_EMAIL_ALREADY_EXISTS = 'Email already exists';
const ERR_FAILED_FETCH_CREATED_PARTNER = 'Failed to fetch created partner environment';


export default function makePartnersEnvRequestService(env: Env) {
  const db = env.datastoraged01;
  const SECRET = env.WORKER_VAR_X || DEFAULT_SECRET_KEY;

  async function getByKey(key: string): Promise<PartnersEnvRequest | null> {
    const result = await db.prepare(
      'SELECT * FROM partners_env_request WHERE key = ?'
    ).bind(key).first<PartnersEnvRequest>();
    
    if (!result) return null;

    return {
      key: result.key,
      full_name: result.full_name,
      email: result.email,
      phone: result.phone || EMPTY_STRING,
      summary: result.summary || EMPTY_STRING,
      created_at: result.created_at,
      updated_at: result.updated_at,
      active: typeof result.active === 'string' ? parseInt(result.active, 10) : result.active,
      observation: result.observation || EMPTY_STRING
    };
  }

  async function create(data: PartnersEnvRequestInput): Promise<PartnersEnvRequest> {    
    /**backoffice - simple rapid implement */    
    const emailLower = data.email.toLowerCase();
    
    const encryptedKey = await encryptKey(emailLower, SECRET);
    const encryptedOriginalKey = await encryptKey(data.key, SECRET);

    //validate unicidad email
    const existing = await db.prepare(
      'SELECT key FROM partners_env_request WHERE email = ?'
    ).bind(emailLower).first<{ key: string }>();

    if (existing) {
      throw new Error(ERR_EMAIL_ALREADY_EXISTS);
    }

    const id = generateId();
    const now = new Date().toISOString();
    //
    const active = data.active ?? DEFAULT_ACTIVE;
    await db.prepare(`
      INSERT INTO partners_env_request ( key, full_name, email, phone, summary, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      encryptedKey,
      data.full_name,
      emailLower,
      data.phone || null,
      encryptedOriginalKey,
      active,
      now,
      now
    ).run();

    const created = await getByKey(encryptedKey);
    if (!created) {
      throw new Error(ERR_FAILED_FETCH_CREATED_PARTNER);
    }

    return created;
  }

  async function validatePartnersEnvRequest(data: unknown): Promise<string[]> {
    const errors: string[] = [];
    console.log('Validating bookmark data:', data);

    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format');
      return errors;
    }

    const d = data as Record<string, unknown>;
    
    if (!d.full_name || typeof d.full_name !== 'string' || d.full_name.trim() === EMPTY_STRING) {
      errors.push('Full name is required and must be a non-empty string');
    }
    
    if (!d.email || typeof d.email !== 'string' || d.email.trim() === EMPTY_STRING) {
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
    getByKey,
    create,
    validatePartnersEnvRequest
  };
}