import { jsonResponse } from '../../lib/utils.js';
import type { Env } from '../types/interface.js';
import type { PartnersEnv, PartnersEnvInput } from '../models/PartnersEnv.js';
import type { SesionEnv } from '../models/Sesion.js';

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

function encryptSesionData(serializedData: string, token: string): string {
  if (!token) return serializedData;
  const dataBytes = new TextEncoder().encode(serializedData);
  const tokenBytes = new TextEncoder().encode(token);
  const output = new Uint8Array(dataBytes.length);
  for (let i = 0; i < dataBytes.length; i += 1) {
    output[i] = dataBytes[i] ^ tokenBytes[i % tokenBytes.length];
  }
  let binary = '';
  for (const byte of output) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decryptSesionData(encryptedData: string, token: string): string {
  if (!token) return encryptedData;
  const binary = atob(encryptedData);
  const dataBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    dataBytes[i] = binary.charCodeAt(i);
  }
  const tokenBytes = new TextEncoder().encode(token);
  const output = new Uint8Array(dataBytes.length);
  for (let i = 0; i < dataBytes.length; i += 1) {
    output[i] = dataBytes[i] ^ tokenBytes[i % tokenBytes.length];
  }
  return new TextDecoder().decode(output);
}

export default function makeUserSesionController(
  userSesionService: UserSesionService,
  partnersEnvService: PartnersEnvService
) {

  async function registrar_user(req: Request, env: Env): Promise<Response> {
    try {
      const data = await req.json() as unknown;
      const errors = await partnersEnvService.validatePartnersEnv(data);
      if (errors.length) {
        const response: SesionEnv = {
          success: false,
          token: '',
          data: '',
          message: 'Bad request',
        };
        return jsonResponse(response, HTTP_STATUS_BAD_REQUEST);
      }

      const created = await partnersEnvService.create(data as PartnersEnvInput);

      try {
        const token = await userSesionService.createSession(created.email, created);
        const response: SesionEnv = {
          success: true,
          token,
          data: encryptSesionData(JSON.stringify(created), token),
          message: 'Usuario registrado y sesión creada',
        };
        return jsonResponse(response, HTTP_STATUS_CREATED);
      } catch (error) {        
        const response: SesionEnv = {
          success: true,
          token: '',
          data: JSON.stringify(created),
          message: 'Usuario registrado, pero la sesión no pudo crearse',
        };
        return jsonResponse(response, HTTP_STATUS_ACCEPTED);
      }

    } catch (err) {
      const error = err as Error;
      const response: SesionEnv = {
        success: false,
        token: '',
        data: '',
        message: `Failed to register user session: ${error.message}`,
      };
      return jsonResponse(response, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function validar_user(req: Request, env: Env): Promise<Response> {
    try {
      const data = await req.json() as Record<string, unknown>;
      const email = typeof data.email === 'string' ? data.email.trim() : '';

      if (!email) {
        const response: SesionEnv = {
          success: false,
          token: '',
          data: '',
          message: 'Bad request',
        };
        return jsonResponse(response, HTTP_STATUS_BAD_REQUEST);
      }

      const existingSession = await userSesionService.getSession(email);
      if (existingSession) {
        const token = await userSesionService.getToken(email);
        const response: SesionEnv = {
          success: true,
          token,
          data: encryptSesionData(JSON.stringify(existingSession), token),
          message: 'Sesión activa',
        };
        return jsonResponse(response,HTTP_STATUS_ACCEPTED);
      }

      const partners = await partnersEnvService.getByFilter( { email: email, full_name: '', key: '' } );
      const partner = partners.length > 0 ? partners[0] : null;
      if (!partner) {
        const response: SesionEnv = {
          success: false,
          token: '',
          data: '',
          message: 'la sesion no es posible',
        };
        return jsonResponse(response, HTTP_STATUS_FORBIDDEN);
      }

      const token = await userSesionService.createSession(email, partner);
      const response: SesionEnv = {
        success: true,
        token,
        data: encryptSesionData(JSON.stringify(partner), token),
        message: 'Sesión creada',
      };
      return jsonResponse(response);
    } catch (err) {
      const error = err as Error;
      const response: SesionEnv = {
        success: false,
        token: '',
        data: '',
        message: `Failed to validate session: ${error.message}`,
      };
      return jsonResponse(response, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  return {
    registrar_user,
    validar_user,
  };
}
