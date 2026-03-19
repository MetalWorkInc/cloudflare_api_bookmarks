import { jsonResponse } from '../../../lib/utils.js';
import { PartnersEnv, PartnersEnvInput } from '../../models/PartnersEnv';
import type { PartnersEnvSession } from '../../models/PartnersEnv.js';
import type { Env } from '../../types/interface.ts';
import makeSecureSessionGuard from './secureSessionGuard';

const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const EMPTY_STRING = '';

const ERR_FAILED_RETRIEVE_PARTNERS = 'Failed to retrieve partners';
const ERR_PARTNER_NOT_FOUND = 'Partner not found';
const ERR_FAILED_RETRIEVE_PARTNER = 'Failed to retrieve partner';
const ERR_FAILED_CREATE_PARTNER = 'Failed to create partner';
const ERR_FAILED_UPDATE_PARTNER = 'Failed to update partner';
const ERR_FAILED_DEACTIVATE_PARTNER = 'Failed to deactivate partner';
const ERR_INVALID_REQUEST = 'Invalid request';

const MSG_PARTNER_CREATED = 'Partner created successfully';
const MSG_PARTNER_UPDATED = 'Partner updated successfully';
const MSG_PARTNER_DEACTIVATED = 'Partner deactivated successfully';

interface PartnersEnvService {
  list(): Promise<PartnersEnv[]>;
  getById(id: string): Promise<PartnersEnv | null>;
  getByFilter(filter: PartnersEnvInput): Promise<PartnersEnv[]>;
  create(data: PartnersEnvInput): Promise<PartnersEnv>;
  update(id: string, data: PartnersEnvInput): Promise<PartnersEnv | null>;
  validatePartnersEnv(data: unknown): Promise<string[]>;
}

interface UserSesionService {
  getEmail(token: string): Promise<string | null>;
  getToken(email: string): Promise<string>;
  getSessionByToken(token: string): Promise<PartnersEnvSession | null>;
}

export default function makePartnersEnvController(partnerSvc: PartnersEnvService, userSesionService: UserSesionService) {
  const validateSecureSession = makeSecureSessionGuard(userSesionService);

  function withoutId(item: PartnersEnv) {
    const { id: _id, ...rest } = item;
    return rest;
  }

  async function list(req: Request, env: Env): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const items = await partnerSvc.list();
      const data = items.map(withoutId);
      return jsonResponse({ success: true, data, count: data.length });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_RETRIEVE_PARTNERS, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function get(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const item = await partnerSvc.getById(id);
      if (!item) return jsonResponse({ success: false, error: ERR_PARTNER_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      return jsonResponse({ success: true, data: withoutId(item) });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_RETRIEVE_PARTNER, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }


  async function create(req: Request, env: Env): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const data = await req.json() as unknown;
      const errors = await partnerSvc.validatePartnersEnv(data);
      if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);
      const created = await partnerSvc.create(data as PartnersEnvInput);
      return jsonResponse({ success: true, data: withoutId(created), message: MSG_PARTNER_CREATED }, HTTP_STATUS_CREATED);
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_CREATE_PARTNER, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function update(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const data = await req.json() as unknown;
      const errors = await partnerSvc.validatePartnersEnv(data);
      if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);
      const updated = await partnerSvc.update(id, data as PartnersEnvInput);
      if (!updated) return jsonResponse({ success: false, error: ERR_PARTNER_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      return jsonResponse({ success: true, data: withoutId(updated), message: MSG_PARTNER_UPDATED });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_UPDATE_PARTNER, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  
  async function update_bookmarks(req: Request): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const data = await req.json() as unknown;
      if (!data || typeof data !== 'object') {
        return jsonResponse({ success: false, error: ERR_INVALID_REQUEST }, HTTP_STATUS_BAD_REQUEST);
      }

      const d = data as Record<string, unknown>;

      if (!d.email || typeof d.email !== 'string' || d.email.trim() === '') {
        return jsonResponse({ success: false, error: ERR_INVALID_REQUEST }, HTTP_STATUS_BAD_REQUEST);
      }

      if (!Array.isArray(d.bookmarks_favorites) || !d.bookmarks_favorites.every((item) => typeof item === 'string')) {
        return jsonResponse({ success: false, error: ERR_INVALID_REQUEST }, HTTP_STATUS_BAD_REQUEST);
      }

      const partners = await partnerSvc.getByFilter( { email:  d.email.trim(), full_name: EMPTY_STRING, key: EMPTY_STRING } );
      if (!partners || partners.length === 0) return jsonResponse({ success: false, error: ERR_PARTNER_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      const partner = partners[0];

      const input = {
        key: partner.key,
        full_name: partner.full_name,
        email: partner.email,
        phone: partner.phone,
        summary: partner.summary,
        active: partner.active,
        bookmarks_favorites: d.bookmarks_favorites
      } as PartnersEnvInput & { bookmarks_favorites: string[] };

      const updated = await partnerSvc.update(partner.id, input);
      if (!updated) return jsonResponse({ success: false, error: ERR_PARTNER_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      return jsonResponse({ success: true, data: withoutId(updated), message: MSG_PARTNER_UPDATED });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_UPDATE_PARTNER, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function remove(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const existing = await partnerSvc.getById(id);
      if (!existing) return jsonResponse({ success: false, error: ERR_PARTNER_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);

      const input: PartnersEnvInput = {
        key: existing.key,
        full_name: existing.full_name,
        email: existing.email,
        phone: existing.phone,
        summary: existing.summary,
        active: 0
      };

      const updated = await partnerSvc.update(id, input);
      if (!updated) return jsonResponse({ success: false, error: ERR_PARTNER_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      return jsonResponse({ success: true, data: withoutId(updated), message: MSG_PARTNER_DEACTIVATED });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_DEACTIVATE_PARTNER, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  return {
    list,
    get,
    create,
    update,
    update_bookmarks,
    remove,
  };
}
