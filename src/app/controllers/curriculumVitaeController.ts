import { jsonResponse } from '../../lib/utils.js';
import { CurriculumVitae, CurriculumVitaeInput } from '../models/CurriculumVitae';
import type { Env } from '../types/interface.ts';

interface CurriculumVitaeService {
  list(): Promise<CurriculumVitae[]>;
  getById(id: string): Promise<CurriculumVitae | null>;
  create(data: CurriculumVitaeInput): Promise<CurriculumVitae>;
  update(id: string, data: CurriculumVitaeInput): Promise<CurriculumVitae | null>;
  remove(id: string): Promise<CurriculumVitae | null>;
  validateCurriculumVitae(data: unknown): Promise<string[]>;
  getPersonalCards(): Promise<Array<{id: string, fullName: string, email: string, phone: string}>>;
}

export default function makeCurriculumVitaeController(service: CurriculumVitaeService) {
  async function list(req: Request, env: Env): Promise<Response> {
    try {
      const items = await service.list();
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to retrieve curriculum vitae', message: error.message }, 500);
    }
  }

  async function get(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const item = await service.getById(id);
      if (!item) return jsonResponse({ success: false, error: 'Curriculum vitae not found' }, 404);
      return jsonResponse({ success: true, data: item });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to retrieve curriculum vitae', message: error.message }, 500);
    }
  }

  async function create(req: Request, env: Env): Promise<Response> {
    try {
      const data = await req.json() as unknown;
      const errors = await service.validateCurriculumVitae(data);
      if (errors.length) return jsonResponse({ success: false, errors }, 400);
      const created = await service.create(data as CurriculumVitaeInput);
      return jsonResponse({ success: true, data: created, message: 'Curriculum vitae created successfully' }, 201);
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to create curriculum vitae', message: error.message }, 500);
    }
  }

  async function update(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const exists = await service.getById(id);
      if (!exists) return jsonResponse({ success: false, error: 'Curriculum vitae not found' }, 404);
      const data = await req.json() as unknown;
      const errors = await service.validateCurriculumVitae(data);
      if (errors.length) return jsonResponse({ success: false, errors }, 400);
      const updated = await service.update(id, data as CurriculumVitaeInput);
      return jsonResponse({ success: true, data: updated, message: 'Curriculum vitae updated successfully' });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to update curriculum vitae', message: error.message }, 500);
    }
  }

  async function remove(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const deleted = await service.remove(id);
      if (!deleted) return jsonResponse({ success: false, error: 'Curriculum vitae not found' }, 404);
      return jsonResponse({ success: true, message: 'Curriculum vitae deleted successfully', data: deleted });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to delete curriculum vitae', message: error.message }, 500);
    }
  }

  async function getPersonalCards(req: Request, env: Env): Promise<Response> {
    try {
      const cards = await service.getPersonalCards();
      return jsonResponse({ success: true, data: cards, count: cards.length });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to retrieve personal cards', message: error.message }, 500);
    }
  }

  return { list, get, create, update, remove, getPersonalCards };
}
