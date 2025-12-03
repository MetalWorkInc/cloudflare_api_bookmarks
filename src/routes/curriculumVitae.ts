import makeCurriculumService from '../app/services/curriculumService';
import makeCurriculumVitaeController from '../app/controllers/curriculumVitaeController';
import type { Env } from '../app/types/interface.js';

export default function makeCurriculumVitaeRouter(env: Env) {
  const service = makeCurriculumService(env);
  const controller = makeCurriculumVitaeController(service);

  return async function route(request: Request, path: string, method: string): Promise<Response | null> {
    // path may be '/curriculum' or '/curriculum/:id'
    const idMatch = path.match(/^\/curriculum(?:\/([^\/]+))?$/);
    const id = idMatch ? idMatch[1] : null;

    if (path === '/curriculum' && method === 'GET') return controller.list(request, env);
    if (path === '/curriculum' && method === 'POST') return controller.create(request, env);
    if (id && method === 'GET') return controller.get(request, env, id);
    if (id && method === 'PUT') return controller.update(request, env, id);
    if (id && method === 'DELETE') return controller.remove(request, env, id);

    return null; // not handled
  };
}
