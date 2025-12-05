import makePartnersEnvService from '../app/services/partnersEnvService';
import makePartnersEnvController from '../app/controllers/partnersEnvController';
import type { Env } from '../app/types/interface.js';

export default function makePartnersEnvRouter(env: Env) {
  const service = makePartnersEnvService(env);
  const controller = makePartnersEnvController(service);

  return async function route(request: Request, path: string, method: string): Promise<Response | null> {
    // path may be '/partners' or '/partners/:id' or '/partners/key/:key'
    const idMatch = path.match(/^\/partners(?:\/([^\/]+))?$/);
    const keyMatch = path.match(/^\/partners\/key\/([^\/]+)$/);
    const id = idMatch ? idMatch[1] : null;
    const key = keyMatch ? keyMatch[1] : null;

    if (path === '/partners' && method === 'GET') return controller.list(request, env);
    if (path === '/partners' && method === 'POST') return controller.create(request, env);
    if (key && method === 'GET') return controller.getByKey(request, env, key);
    if (id && method === 'GET') return controller.get(request, env, id);
    if (id && method === 'PUT') return controller.update(request, env, id);
    if (id && method === 'DELETE') return controller.remove(request, env, id);

    return null; // not handled
  };
}
