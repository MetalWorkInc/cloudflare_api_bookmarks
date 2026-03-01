import { jsonResponse } from '../../lib/utils.js';
import { PartnersEnv, PartnersEnvInput } from '../models/PartnersEnv';
import type { Env } from '../types/interface.ts';

interface PartnersEnvService {
  list(): Promise<PartnersEnv[]>;
  getById(id: string): Promise<PartnersEnv | null>;
  getByFilter(filter: PartnersEnvInput): Promise<PartnersEnv[]>;
  create(data: PartnersEnvInput): Promise<PartnersEnv>;
  update(id: string, data: PartnersEnvInput): Promise<PartnersEnv | null>;
  validatePartnersEnv(data: unknown): Promise<string[]>;
}

export default function makePartnersEnvController(partnerSvc: PartnersEnvService) {
  function withoutId(item: PartnersEnv) {
    const { id: _id, ...rest } = item;
    return rest;
  }

  async function list(req: Request, env: Env): Promise<Response> {
    try {
      const items = await partnerSvc.list();
      const data = items.map(withoutId);
      return jsonResponse({ success: true, data, count: data.length });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to retrieve partners', message: error.message }, 500);
    }
  }

  async function get(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const item = await partnerSvc.getById(id);
      if (!item) return jsonResponse({ success: false, error: 'Partner not found' }, 404);
      return jsonResponse({ success: true, data: withoutId(item) });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to retrieve partner', message: error.message }, 500);
    }
  }


  async function create(req: Request, env: Env): Promise<Response> {
    try {
      const data = await req.json() as unknown;
      const errors = await partnerSvc.validatePartnersEnv(data);
      if (errors.length) return jsonResponse({ success: false, errors }, 400);
      const created = await partnerSvc.create(data as PartnersEnvInput);
      return jsonResponse({ success: true, data: withoutId(created), message: 'Partner created successfully' }, 201);
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to create partner', message: error.message }, 500);
    }
  }

  async function update(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const data = await req.json() as unknown;
      const errors = await partnerSvc.validatePartnersEnv(data);
      if (errors.length) return jsonResponse({ success: false, errors }, 400);
      const updated = await partnerSvc.update(id, data as PartnersEnvInput);
      if (!updated) return jsonResponse({ success: false, error: 'Partner not found' }, 404);
      return jsonResponse({ success: true, data: withoutId(updated), message: 'Partner updated successfully' });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to update partner', message: error.message }, 500);
    }
  }

  
  async function update_bookmarks(req: Request): Promise<Response> {
    try {
      const data = await req.json() as unknown;
      if (!data || typeof data !== 'object') {
        return jsonResponse({ success: false, error: 'Invalid request' }, 400);
      }

      const d = data as Record<string, unknown>;

      if (!d.email || typeof d.email !== 'string' || d.email.trim() === '') {
        return jsonResponse({ success: false, error: 'Invalid request' }, 400);
      }

      if (!Array.isArray(d.bookmarks_favorites) || !d.bookmarks_favorites.every((item) => typeof item === 'string')) {
        return jsonResponse({ success: false, error: 'Invalid request' }, 400);
      }

      const partners = await partnerSvc.getByFilter( { email:  d.email.trim(), full_name: '', key: '' } );
      if (!partners || partners.length === 0) return jsonResponse({ success: false, error: 'Partner not found' }, 404);
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
      if (!updated) return jsonResponse({ success: false, error: 'Partner not found' }, 404);
      return jsonResponse({ success: true, data: withoutId(updated), message: 'Partner updated successfully' });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to update partner', message: error.message }, 500);
    }
  }

  async function remove(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const existing = await partnerSvc.getById(id);
      if (!existing) return jsonResponse({ success: false, error: 'Partner not found' }, 404);

      const input: PartnersEnvInput = {
        key: existing.key,
        full_name: existing.full_name,
        email: existing.email,
        phone: existing.phone,
        summary: existing.summary,
        active: 0
      };

      const updated = await partnerSvc.update(id, input);
      if (!updated) return jsonResponse({ success: false, error: 'Partner not found' }, 404);
      return jsonResponse({ success: true, data: withoutId(updated), message: 'Partner deactivated successfully' });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to deactivate partner', message: error.message }, 500);
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
