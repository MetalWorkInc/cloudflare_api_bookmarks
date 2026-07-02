import makeBookmarksService from '../../app/services/secure/bookmarksService';
import makeUserSesionTknService from '../../app/services/auth/userSesionTknService';
import makeBookmarksController from '../../app/controllers/secure/bookmarksController';
import type { Env } from '../../app/types/interface';

export default function makeBookmarksRouter(env: Env) {
  const bookmarkSvc = makeBookmarksService(env);
  const userSesionSvc = makeUserSesionTknService(env);
  const bookmarkController = makeBookmarksController(bookmarkSvc, userSesionSvc);

  return async function route(request: Request, path: string, method: string): Promise<Response | null> {
    // path may be '/bookmarks' or '/bookmarks/:id'
    const idMatch = path.match(/^\/bookmarks(?:\/([^\/]+))?$/);
    const id = idMatch ? idMatch[1] : null;

    if (path === '/bookmarks' && method === 'GET') return bookmarkController.list(request);
    if (path === '/bookmarks' && method === 'POST') return bookmarkController.create(request);
    if (id && method === 'GET') return bookmarkController.get(request, id);
    if (id && method === 'PUT') return bookmarkController.update(request);
    if (id && method === 'DELETE') return bookmarkController.remove(request, id);

    return null; // not handled
  };
}
