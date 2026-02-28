import { generateId } from '../../lib/utils.js';
import { GoogleAuthLogPaginatedResult, type GoogleAuthLog, type GoogleAuthLogInput } from '../models/GoogleAuthLog';
import type { Env } from '../types/interface';

export default function makeGoogleAuthLogService(env: Env) {
  const db = env.datastoraged01;

  async function create(data: GoogleAuthLogInput): Promise<GoogleAuthLog> {
    const id = generateId();
    const createdAt = new Date().toISOString();

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

  async function getByFilterPaginated(
    filter: GoogleAuthLogInput,
    page = 1,
    pageSize = 20,
  ): Promise<GoogleAuthLogPaginatedResult> {
    const normalizedFilter = filter ?? {};
    const { whereSql, params } = buildFilterSql(normalizedFilter);
    const pagination = normalizePagination(page, pageSize);

    const totalResult = await db.prepare(
      `SELECT COUNT(*) as total FROM google_auth_log ${whereSql}`
    ).bind(...params).first<{ total: number | string }>();

    const total = Number(totalResult?.total ?? 0);

    const { results } = await db.prepare(`
      SELECT *
      FROM google_auth_log
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, pagination.pageSize, pagination.offset).all<GoogleAuthLog>();

    const data: GoogleAuthLogInput[] = results.map((row) => ({
      iss: row.iss,
      azp: row.azp,
      aud: row.aud,
      sub: row.sub,
      email: row.email,
      email_verified: row.email_verified,
      nbf: row.nbf,
      name: row.name,
      picture: row.picture,
      given_name: row.given_name,
      family_name: row.family_name,
      iat: row.iat,
      exp: row.exp,
      jti: row.jti,
    }));

    const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

    return new GoogleAuthLogPaginatedResult(
      data,
      pagination.page,
      pagination.pageSize,
      total,
      totalPages,
      pagination.page < totalPages,
      pagination.page > 1,
    );
  }

  function normalizePagination(page = 1, pageSize = 20): { page: number; pageSize: number; offset: number } {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
    const safePageSize = Number.isFinite(pageSize) ? Math.min(100, Math.max(1, Math.trunc(pageSize))) : 20;
    return {
      page: safePage,
      pageSize: safePageSize,
      offset: (safePage - 1) * safePageSize,
    };
  }

  function buildFilterSql(filter: GoogleAuthLogInput): { whereSql: string; params: Array<string | number> } {
    const clauses: string[] = [];
    const params: Array<string | number> = [];

    if (filter.iss?.trim()) {
      clauses.push('iss = ?');
      params.push(filter.iss.trim());
    }
    if (filter.azp?.trim()) {
      clauses.push('azp = ?');
      params.push(filter.azp.trim());
    }
    if (filter.aud?.trim()) {
      clauses.push('aud = ?');
      params.push(filter.aud.trim());
    }
    if (filter.sub?.trim()) {
      clauses.push('sub = ?');
      params.push(filter.sub.trim());
    }
    if (filter.email?.trim()) {
      clauses.push('email = ?');
      params.push(filter.email.trim());
    }
    if (filter.email_verified !== undefined) {
      clauses.push('email_verified = ?');
      params.push(filter.email_verified);
    }
    if (filter.nbf !== undefined) {
      clauses.push('nbf = ?');
      params.push(filter.nbf);
    }
    if (filter.name?.trim()) {
      clauses.push('name = ?');
      params.push(filter.name.trim());
    }
    if (filter.picture?.trim()) {
      clauses.push('picture = ?');
      params.push(filter.picture.trim());
    }
    if (filter.given_name?.trim()) {
      clauses.push('given_name = ?');
      params.push(filter.given_name.trim());
    }
    if (filter.family_name?.trim()) {
      clauses.push('family_name = ?');
      params.push(filter.family_name.trim());
    }
    if (filter.iat !== undefined) {
      clauses.push('iat = ?');
      params.push(filter.iat);
    }
    if (filter.exp !== undefined) {
      clauses.push('exp = ?');
      params.push(filter.exp);
    }
    if (filter.jti?.trim()) {
      clauses.push('jti = ?');
      params.push(filter.jti.trim());
    }

    return {
      whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
      params,
    };
  }

  return {
    create,
    getByFilterPaginated,
  };
}
