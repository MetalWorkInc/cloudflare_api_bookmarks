import { jsonResponse } from '../../lib/utils.js';
import type { Env } from '../types/interface.js';
import type { PartnersEnv, PartnersEnvInput } from '../models/PartnersEnv.js';

interface UserSesionService {
  getToken(email: string): Promise<string>;
  createSession(email: string, partner: PartnersEnv): Promise<string>;
  getSession(email: string): Promise<PartnersEnv | null>;
}

interface PartnersEnvService {
  create(data: PartnersEnvInput): Promise<PartnersEnv>;
  validatePartnersEnv(data: unknown): Promise<string[]>;
  getByFilter(filter: PartnersEnvInput): Promise<PartnersEnv[]>
}

const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_ACCEPTED = 202;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_FORBIDDEN = 403;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

export default function makeUserSesionController(
  userSesionService: UserSesionService,
  partnersEnvService: PartnersEnvService
) {

  async function registrar_user(req: Request, env: Env): Promise<Response> {
    try {
      const data = await req.json() as unknown;
      const errors = await partnersEnvService.validatePartnersEnv(data);
      if (errors.length) {
        return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);
      }

      const created = await partnersEnvService.create(data as PartnersEnvInput);

      try {
        const token = await userSesionService.createSession(created.email, created);
        
        return jsonResponse({
            success: true,
            data: created,
            token,
            message: 'Usuario registrado y sesión creada',
        }, HTTP_STATUS_CREATED);
      } catch (error) {        
        return jsonResponse({
            success: true,
            data: created,
            message: 'Usuario registrado, pero la sesión no pudo crearse',
        }, HTTP_STATUS_ACCEPTED);
      }

    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to register user session', message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function validar_user(req: Request, env: Env): Promise<Response> {
    try {
      const data = await req.json() as Record<string, unknown>;
      const email = typeof data.email === 'string' ? data.email.trim() : '';

      if (!email) {
        return jsonResponse({ success: false, error: 'Bad request' }, HTTP_STATUS_BAD_REQUEST);
      }

      const existingSession = await userSesionService.getSession(email);
      if (existingSession) {
        const token = await userSesionService.getToken(email);
        return jsonResponse({ success: true, token, data: existingSession, message: 'Sesión activa' });
      }

      const partners = await partnersEnvService.getByFilter( { email: email, full_name: '', key: '' } );
      const partner = partners.length > 0 ? partners[0] : null;
      if (!partner) {
        return jsonResponse({ success: false, error: 'la sesion no es posible' }, HTTP_STATUS_FORBIDDEN);
      }

      const token = await userSesionService.createSession(email, partner);
      return jsonResponse({ success: true, token, data: partner, message: 'Sesión creada' });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: 'Failed to validate session', message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  return {
    registrar_user,
    validar_user,
  };
}
