import makeGoogleAuthLogService from '../../app/services/googleAuthLogService';
import makeGoogleAuthLogController from '../../app/controllers/secure/googleAuthLogController';
import type { Env } from '../../app/types/interface.js';
import makeUserSesionTknService from '../../app/services/userSesionTknService';

export default function makeGoogleAuthLogRouter(env: Env) {
  const service = makeGoogleAuthLogService(env);
  const userSesionService = makeUserSesionTknService(env);
  const controller = makeGoogleAuthLogController(service,userSesionService);

  return async function route(request: Request, path: string, method: string): Promise<Response | null> {
    if (path === '/googleAuthLog/filter' && method === 'POST') return controller.filter(request);

    return null;
  };
}
