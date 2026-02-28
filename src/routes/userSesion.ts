import makeUserSesionTknService from '../app/services/userSesionTknService';
import makePartnersEnvService from '../app/services/partnersEnvService';
import makeGoogleAuthLogService from '../app/services/googleAuthLogService';
import makeUserSesionController from '../app/controllers/userSesionController';
import type { Env } from '../app/types/interface.js';

export default function makeUserSesionRouter(env: Env) {
  const userSesionService = makeUserSesionTknService(env);
  const partnersEnvService = makePartnersEnvService(env);
  const googleAuthLogService = makeGoogleAuthLogService(env);
  const controller = makeUserSesionController(userSesionService, partnersEnvService, googleAuthLogService);

  return async function route(request: Request, path: string, method: string): Promise<Response | null> {
    if (path === '/userSesion/registrar' && method === 'POST') return controller.registrar_user(request);
    if (path === '/userSesion/validar' && method === 'POST') return controller.validar_user(request);
    if (path === '/userSesion/getSesion' && method === 'POST') return controller.getSesion(request);
    //if (path === '/userSesion/readSesion' && method === 'POST') return controller.readSesion(request);
    if (path === '/userSesion/google-auth' && method === 'POST') return controller.validar_google_auth(request);

    return null;
  };
}
