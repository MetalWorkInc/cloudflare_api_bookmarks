import makeGoogleAuthLogService from '../app/services/googleAuthLogService';
import makeGoogleAuthLogController from '../app/controllers/googleAuthLogController';
import type { Env } from '../app/types/interface.js';

export default function makeGoogleAuthLogRouter(env: Env) {
  const service = makeGoogleAuthLogService(env);
  const controller = makeGoogleAuthLogController(service);

  return async function route(request: Request, path: string, method: string): Promise<Response | null> {
    if (path === '/googleAuthLog/filter' && method === 'POST') return controller.filter(request);

    return null;
  };
}
