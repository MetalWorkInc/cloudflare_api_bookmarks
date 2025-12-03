import makeBookmarksService from '../app/services/bookmarksService';
import makeBookmarksController from '../app/controllers/bookmarksController';
import type { Env } from '../app/types/interface';

export default function makeBookmarksRouter(env: Env) {
  const service = makeBookmarksService(env);
  const controller = makeBookmarksController(service);

  return async function route(request: Request, path: string, method: string): Promise<Response | null> {
    // path may be '/bookmarks' or '/bookmarks/:id'
    const idMatch = path.match(/^\/bookmarks(?:\/([^\/]+))?$/);
    const id = idMatch ? idMatch[1] : null;

    if (path === '/bookmarks' && method === 'GET') return controller.list(request, env);
    if (path === '/bookmarks' && method === 'POST') return controller.create(request, env);
    if (id && method === 'GET') return controller.get(request, env, id);
    if (id && method === 'PUT') return controller.update(request, env, id);
    if (id && method === 'DELETE') return controller.remove(request, env, id);

    return null; // not handled
  };
}
