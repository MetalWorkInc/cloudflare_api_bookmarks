import { jsonResponse } from '../lib/utils.js';
import { validateBookmark } from '../models/bookmark.js';

export default function makeBookmarksController(service) {
  async function list(req, env) {
    try {
      const items = await service.list();
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (err) {
      return jsonResponse({ success: false, error: 'Failed to retrieve bookmarks', message: err.message }, 500);
    }
  }

  async function get(req, env, id) {
    try {
      const item = await service.getById(id);
      if (!item) return jsonResponse({ success: false, error: 'Bookmark not found' }, 404);
      return jsonResponse({ success: true, data: item });
    } catch (err) {
      return jsonResponse({ success: false, error: 'Failed to retrieve bookmark', message: err.message }, 500);
    }
  }

  async function create(req, env) {
    try {
      const data = await req.json();
      const errors = validateBookmark(data);
      if (errors.length) return jsonResponse({ success: false, errors }, 400);
      const created = await service.create(data);
      return jsonResponse({ success: true, data: created, message: 'Bookmark created successfully' }, 201);
    } catch (err) {
      return jsonResponse({ success: false, error: 'Failed to create bookmark', message: err.message }, 500);
    }
  }

  async function update(req, env, id) {
    try {
      const exists = await service.getById(id);
      if (!exists) return jsonResponse({ success: false, error: 'Bookmark not found' }, 404);
      const data = await req.json();
      const errors = validateBookmark(data);
      if (errors.length) return jsonResponse({ success: false, errors }, 400);
      const updated = await service.update(id, data);
      return jsonResponse({ success: true, data: updated, message: 'Bookmark updated successfully' });
    } catch (err) {
      return jsonResponse({ success: false, error: 'Failed to update bookmark', message: err.message }, 500);
    }
  }

  async function remove(req, env, id) {
    try {
      const deleted = await service.remove(id);
      if (!deleted) return jsonResponse({ success: false, error: 'Bookmark not found' }, 404);
      return jsonResponse({ success: true, message: 'Bookmark deleted successfully', data: deleted });
    } catch (err) {
      return jsonResponse({ success: false, error: 'Failed to delete bookmark', message: err.message }, 500);
    }
  }

  return { list, get, create, update, remove };
}
