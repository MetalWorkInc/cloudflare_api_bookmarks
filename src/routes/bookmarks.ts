import makeBookmarksService from '../app/services/bookmarksService';
import makeUserSesionTknService from '../app/services/userSesionTknService';
import makeBookmarksController from '../app/controllers/secure/bookmarksController';
import type { Env } from '../app/types/interface';

export default function makeBookmarksRouter(env: Env) {
  const service = makeBookmarksService(env);
  const userSesionService = makeUserSesionTknService(env);
  const controller = makeBookmarksController(service, userSesionService);

  return async function route(request: Request, path: string, method: string): Promise<Response | null> {
    // path may be '/bookmarks' or '/bookmarks/:id'
    const idMatch = path.match(/^\/bookmarks(?:\/([^\/]+))?$/);
    const id = idMatch ? idMatch[1] : null;

    if (path === '/bookmarks' && method === 'GET') return controller.list(request);
    if (path === '/bookmarks' && method === 'POST') return controller.create(request);
    if (id && method === 'GET') return controller.get(request, id);
    if (id && method === 'PUT') return controller.update(request);
    if (id && method === 'DELETE') return controller.remove(request, id);

    return null; // not handled
  };
}
