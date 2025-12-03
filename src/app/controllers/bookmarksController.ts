import { jsonResponse } from '../../lib/utils.js';
import type { Env } from '../types/interface.ts';
import { Bookmark, BookmarkInput } from '../models/Bookmark';

interface BookmarkService {
  list(): Promise<Bookmark[]>;
  getById(id: string): Promise<Bookmark | null>;
  create(data: BookmarkInput): Promise<Bookmark>;
  update(id: string, data: BookmarkInput): Promise<Bookmark | null>;
  remove(id: string): Promise<Bookmark | null>;
  validateBookmark(data: unknown): Promise<string[]>;
}

export default function makeBookmarksController(service: BookmarkService) {
  async function list(req: Request, env: Env): Promise<Response> {
    try {
      const items = await service.list();
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to retrieve bookmarks', message: error.message }, 500);
    }
  }

  async function get(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const item = await service.getById(id);
      if (!item) return jsonResponse({ success: false, error: 'Bookmark not found' }, 404);
      return jsonResponse({ success: true, data: item });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to retrieve bookmark', message: error.message }, 500);
    }
  }

  async function create(req: Request, env: Env): Promise<Response> {
    try {
      const data = await req.json() as unknown;
      const errors = await service.validateBookmark(data);
      if (errors.length) return jsonResponse({ success: false, errors }, 400);
      const created = await service.create(data as BookmarkInput);
      return jsonResponse({ success: true, data: created, message: 'Bookmark created successfully' }, 201);
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to create bookmark', message: error.message }, 500);
    }
  }

  async function update(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const exists = await service.getById(id);
      if (!exists) return jsonResponse({ success: false, error: 'Bookmark not found' }, 404);
      const data = await req.json() as unknown;
      const errors = await service.validateBookmark(data);
      if (errors.length) return jsonResponse({ success: false, errors }, 400);
      const updated = await service.update(id, data as BookmarkInput);
      return jsonResponse({ success: true, data: updated, message: 'Bookmark updated successfully' });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to update bookmark', message: error.message }, 500);
    }
  }

  async function remove(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const deleted = await service.remove(id);
      if (!deleted) return jsonResponse({ success: false, error: 'Bookmark not found' }, 404);
      return jsonResponse({ success: true, message: 'Bookmark deleted successfully', data: deleted });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to delete bookmark', message: error.message }, 500);
    }
  }

  return { list, get, create, update, remove };
}
