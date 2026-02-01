import makeUserSesionTknService from '../app/services/userSesionTknService';
import makePartnersEnvService from '../app/services/partnersEnvService';
import makeUserSesionController from '../app/controllers/userSesionController';
import type { Env } from '../app/types/interface.js';

export default function makeUserSesionRouter(env: Env) {
  const userSesionService = makeUserSesionTknService(env);
  const partnersEnvService = makePartnersEnvService(env);
  const controller = makeUserSesionController(userSesionService, partnersEnvService);

  return async function route(request: Request, path: string, method: string): Promise<Response | null> {
    if (path === '/userSesion/registrar' && method === 'POST') return controller.registrar_user(request, env);
    if (path === '/userSesion/validar' && method === 'POST') return controller.validar_user(request, env);

    return null;
  };
}
