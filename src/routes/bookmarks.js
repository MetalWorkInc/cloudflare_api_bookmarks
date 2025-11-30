import makeBookmarksService from '../services/bookmarksService.js';
import makeBookmarksController from '../controllers/bookmarksController.js';

export default function makeBookmarksRouter(env) {
  const service = makeBookmarksService(env);
  const controller = makeBookmarksController(service);

  return async function route(request, path, method) {
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
