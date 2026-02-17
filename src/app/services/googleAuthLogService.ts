import { generateId } from '../../lib/utils.js';
import type { GoogleAuthLog, GoogleAuthLogInput } from '../models/GoogleAuthLog';
import type { Env } from '../types/interface';

export default function makeGoogleAuthLogService(env: Env) {
  const db = env.datastoraged01;

  async function create(data: GoogleAuthLogInput): Promise<GoogleAuthLog> {
    const id = data.id && data.id.trim() ? data.id.trim() : generateId();
    const createdAt = data.created_at ?? new Date().toISOString();

    const record: GoogleAuthLog = {
      id,
      iss: data.iss?.trim(),
      azp: data.azp?.trim(),
      aud: data.aud?.trim(),
      sub: data.sub?.trim(),
      email: data.email?.trim(),
      email_verified: data.email_verified,
      nbf: data.nbf,
      name: data.name?.trim(),
      picture: data.picture?.trim(),
      given_name: data.given_name?.trim(),
      family_name: data.family_name?.trim(),
      iat: data.iat,
      exp: data.exp,
      jti: data.jti?.trim(),
      created_at: createdAt,
    };

    await db.prepare(`
      INSERT INTO google_auth_log (
        id, iss, azp, aud, sub, email, email_verified, nbf, name, picture,
        given_name, family_name, iat, exp, jti, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      record.id,
      record.iss ?? null,
      record.azp ?? null,
      record.aud ?? null,
      record.sub ?? null,
      record.email ?? null,
      record.email_verified ?? null,
      record.nbf ?? null,
      record.name ?? null,
      record.picture ?? null,
      record.given_name ?? null,
      record.family_name ?? null,
      record.iat ?? null,
      record.exp ?? null,
      record.jti ?? null,
      record.created_at
    ).run();

    return record;
  }

  return {
    create,
  };
}

function normalizeEmailVerified(value?: number | boolean): number | null {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value;
  return null;
}
