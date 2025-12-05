import { jsonResponse } from '../../lib/utils.js';
import { PartnersEnv, PartnersEnvInput } from '../models/PartnersEnv';
import type { Env } from '../types/interface.ts';

interface PartnersEnvService {
  list(): Promise<PartnersEnv[]>;
  getById(id: string): Promise<PartnersEnv | null>;
  getByKey(key: string): Promise<PartnersEnv | null>;
  create(data: PartnersEnvInput): Promise<PartnersEnv>;
  update(id: string, data: PartnersEnvInput): Promise<PartnersEnv | null>;
  remove(id: string): Promise<PartnersEnv | null>;
  validatePartnersEnv(data: unknown): Promise<string[]>;
}

export default function makePartnersEnvController(service: PartnersEnvService) {
  async function list(req: Request, env: Env): Promise<Response> {
    try {
      const items = await service.list();
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to retrieve partners', message: error.message }, 500);
    }
  }

  async function get(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const item = await service.getById(id);
      if (!item) return jsonResponse({ success: false, error: 'Partner not found' }, 404);
      return jsonResponse({ success: true, data: item });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to retrieve partner', message: error.message }, 500);
    }
  }

  async function getByKey(req: Request, env: Env, key: string): Promise<Response> {
    try {
      const item = await service.getByKey(key);
      if (!item) return jsonResponse({ success: false, error: 'Partner not found' }, 404);
      return jsonResponse({ success: true, data: item });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to retrieve partner', message: error.message }, 500);
    }
  }

  async function create(req: Request, env: Env): Promise<Response> {
    try {
      const data = await req.json() as unknown;
      const errors = await service.validatePartnersEnv(data);
      if (errors.length) return jsonResponse({ success: false, errors }, 400);
      const created = await service.create(data as PartnersEnvInput);
      return jsonResponse({ success: true, data: created, message: 'Partner created successfully' }, 201);
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to create partner', message: error.message }, 500);
    }
  }

  async function update(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const data = await req.json() as unknown;
      const errors = await service.validatePartnersEnv(data);
      if (errors.length) return jsonResponse({ success: false, errors }, 400);
      const updated = await service.update(id, data as PartnersEnvInput);
      if (!updated) return jsonResponse({ success: false, error: 'Partner not found' }, 404);
      return jsonResponse({ success: true, data: updated, message: 'Partner updated successfully' });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to update partner', message: error.message }, 500);
    }
  }

  async function remove(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const deleted = await service.remove(id);
      if (!deleted) return jsonResponse({ success: false, error: 'Partner not found' }, 404);
      return jsonResponse({ success: true, data: deleted, message: 'Partner deleted successfully' });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to delete partner', message: error.message }, 500);
    }
  }

  return {
    list,
    get,
    getByKey,
    create,
    update,
    remove,
  };
}
