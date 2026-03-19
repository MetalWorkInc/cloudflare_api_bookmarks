import { jsonResponse } from '../../../lib/utils.js';
import type { PartnersEnvSession } from '../../models/PartnersEnv.js';
import makeSecureSessionGuard from './secureSessionGuard';

const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const ERR_FAILED_RETRIEVE_BOOKMARKS = 'Failed to retrieve bookmarks';
const ERR_BOOKMARK_NOT_FOUND = 'Bookmark not found';
const ERR_FAILED_RETRIEVE_BOOKMARK = 'Failed to retrieve bookmark';
const ERR_FAILED_CREATE_BOOKMARK = 'Failed to create bookmark';
const ERR_INVALID_REQUEST = 'Invalid request';
const ERR_FAILED_UPDATE_BOOKMARK = 'Failed to update bookmark';
const ERR_FAILED_DELETE_BOOKMARK = 'Failed to delete bookmark';

const MSG_BOOKMARK_CREATED = 'Bookmark created successfully';
const MSG_BOOKMARK_UPDATED = 'Bookmark updated successfully';
const MSG_BOOKMARK_DELETED = 'Bookmark deleted successfully';
import { Bookmark, BookmarkInput } from '../../models/Bookmark';

interface BookmarkService {
  list(): Promise<Bookmark[]>;
  getById(id: string): Promise<Bookmark | null>;
  create(data: BookmarkInput): Promise<Bookmark>;
  update(data: BookmarkInput): Promise<Bookmark | null>;
  remove(id: string): Promise<Bookmark | null>;
  validateBookmark(data: unknown, excludeId?: string): Promise<string[]>;
}

interface UserSesionService {
  getEmail(token: string): Promise<string | null>;
  getToken(email: string): Promise<string>;
  getSessionByToken(token: string): Promise<PartnersEnvSession | null>;
}

export default function makeBookmarksController(service: BookmarkService, userSesionService: UserSesionService) {
  const validateSecureSession = makeSecureSessionGuard(userSesionService);

  async function list(req: Request): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const items = await service.list();
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_RETRIEVE_BOOKMARKS, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function get(req: Request, id: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const item = await service.getById(id);
      if (!item) return jsonResponse({ success: false, error: ERR_BOOKMARK_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      return jsonResponse({ success: true, data: item });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_RETRIEVE_BOOKMARK, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function create(req: Request): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const data = await req.json() as unknown;
      const errors = await service.validateBookmark(data);
      if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);
      const created = await service.create(data as BookmarkInput);
      return jsonResponse({ success: true, data: created, message: MSG_BOOKMARK_CREATED }, HTTP_STATUS_CREATED);
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_CREATE_BOOKMARK, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function update(req: Request): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const data = await req.json() as unknown;
      if (!data || typeof data !== 'object') {
        return jsonResponse({ success: false, error: ERR_INVALID_REQUEST }, HTTP_STATUS_BAD_REQUEST);
      }

      const d = data as Record<string, unknown>;

      if (!d.id || typeof d.id !== 'string' || d.id.trim() === '') {
        return jsonResponse({ success: false, error: ERR_INVALID_REQUEST }, HTTP_STATUS_BAD_REQUEST);
      }


      const exists = await service.getById(d.id);
      if (!exists) return jsonResponse({ success: false, error: ERR_BOOKMARK_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      
      const errors = await service.validateBookmark(data, d.id);
      if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);
      const updated = await service.update(data as BookmarkInput);
      return jsonResponse({ success: true, data: updated, message: MSG_BOOKMARK_UPDATED });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_UPDATE_BOOKMARK, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function remove(req: Request, id: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const deleted = await service.remove(id);
      if (!deleted) return jsonResponse({ success: false, error: ERR_BOOKMARK_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      return jsonResponse({ success: true, message: MSG_BOOKMARK_DELETED, data: deleted });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_DELETE_BOOKMARK, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  return { list, get, create, update, remove };
}
