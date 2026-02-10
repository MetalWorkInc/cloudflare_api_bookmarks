import { jsonResponse } from '../../lib/utils.js';
import type { Env } from '../types/interface.js';
import type { PartnersEnv, PartnersEnvInput, PartnersEnvSession } from '../models/PartnersEnv.js';
import type { SesionEnv } from '../models/Sesion.js';
import { validateSesionEnv } from '../models/Sesion.js';

interface UserSesionService {
  getEmail(token: string): Promise<string | null>;
  getToken(email: string): Promise<string>;
  createSession (email: string, partner: PartnersEnvSession): Promise<string>;
  getSessionByToken(token: string): Promise<PartnersEnvSession | null>;
  getSessionByEmail(email: string): Promise<PartnersEnvSession | null>;
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

function buildSesionResponse(response: SesionEnv, status = 200): Response {
  const errors = validateSesionEnv(response);
  if (errors.length) {
    const fallback: SesionEnv = {
      success: false,
      token: '',
      data: '',
      message: `Invalid SesionEnv: ${errors.join(', ')}`,
    };
    return jsonResponse(fallback, HTTP_STATUS_INTERNAL_SERVER_ERROR);
  }
  return jsonResponse(response, status);
}

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

  async function registrar_user(req: Request): Promise<Response> {
    try {
      let sessionEmail = await validar_request(req) || null;

      if (!sessionEmail) {
        const response: SesionEnv = {
          success: false,
          token: '',
          data: '',
          message: 'Failed to register user session',
        };
        return buildSesionResponse(response, HTTP_STATUS_INTERNAL_SERVER_ERROR);
      }
      //
      const partners = await partnersEnvService.getByFilter( { email: sessionEmail, full_name: '', key: '' } );
      const partner = partners.length == 1 ? partners[0] : null;
      if (!partner) {
        const response: SesionEnv = {
          success: false,
          token: '',
          data: '',
          message: 'Failed to register user session',
        };
        return buildSesionResponse(response, HTTP_STATUS_INTERNAL_SERVER_ERROR);
      }

      const token = await userSesionService.createSession(partner.email, partnerSesionFromPartner(partner));
      const response: SesionEnv = {
        success: true,
        token,
        data: encryptSesionData(JSON.stringify(partnerSesionFromPartner(partner)), token),
        message: 'Usuario registrado y sesión creada',
      };
      return buildSesionResponse(response, HTTP_STATUS_CREATED);

    } catch (err) {
      const error = err as Error;
      const response: SesionEnv = {
        success: false,
        token: '',
        data: '',
        message: `Failed to register user session: ${error.message}`,
      };
      return buildSesionResponse(response, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function validar_user(req: Request): Promise<Response> {
    try {
      let sessionEmail = await validar_request(req) || null;

      if (!sessionEmail) {
        const response: SesionEnv = {
          success: false,
          token: '',
          data: '',
          message: 'Invalid session token',
        };
        return buildSesionResponse(response, HTTP_STATUS_FORBIDDEN);
      }

      const existingSession = await userSesionService.getSessionByEmail(sessionEmail);
      if (existingSession) {
        const token = await userSesionService.getToken(sessionEmail);
        const response: SesionEnv = {
          success: true,
          token,
          data: encryptSesionData(JSON.stringify(existingSession), token),
          message: 'Sesión activa',
        };
        return buildSesionResponse(response, HTTP_STATUS_ACCEPTED);
      }

      const partners = await partnersEnvService.getByFilter( { email: sessionEmail, full_name: '', key: '' } );
      const partner = partners.length > 0 ? partners[0] : null;
      if (!partner) {
        const response: SesionEnv = {
          success: false,
          token: '',
          data: '',
          message: 'la sesion no es posible',
        };
        return buildSesionResponse(response, HTTP_STATUS_FORBIDDEN);
      }

      const token = await userSesionService.createSession(sessionEmail, partnerSesionFromPartner(partner));
      const response: SesionEnv = {
        success: true,
        token,
        data: encryptSesionData(JSON.stringify(partner), token),
        message: 'Sesión creada',
      };
      return buildSesionResponse(response);

    } catch (err) {
      const error = err as Error;
      const response: SesionEnv = {
        success: false,
        token: '',
        data: '',
        message: `Failed to validate session: ${error.message}`,
      };
      return buildSesionResponse(response, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function getSesion(req: Request): Promise<Response> {
    try {
      const sessionToken = req.headers.get('X-Session-Token') || '';
      const body = await req.json() as { data?: string };

      if (!sessionToken || !body?.data) {
        const response: SesionEnv = {
          success: false,
          token: sessionToken,
          data: '',
          message: 'Failed to validate session',
        };
        return buildSesionResponse(response, HTTP_STATUS_FORBIDDEN);
      }

      const partnerSesion = decryptSesionData(body.data || '', sessionToken);
      if (!partnerSesion) {
        const response: SesionEnv = {
          success: false,
          token: sessionToken,
          data: '',
          message: 'Failed to validate session',
        };
        return buildSesionResponse(response, HTTP_STATUS_FORBIDDEN);
      } else {
        const sesionData = JSON.parse(partnerSesion) as PartnersEnvSession;
        if (sesionData.expiration_date < Date.now()) {
          const response: SesionEnv = {
            success: false,
            token: sessionToken,
            data: '',
            message: 'Session has expired',
          };
          return buildSesionResponse(response, HTTP_STATUS_FORBIDDEN);
        } else {
          const response: SesionEnv = {
            success: true,
            token: sessionToken,
            data: partnerSesion,
            message: 'Session is valid',
          };
          return buildSesionResponse(response);
        }
      }

    } catch (err) {
      const error = err as Error;
      const response: SesionEnv = {
        success: false,
        token: '',
        data: '',
        message: `Failed to validate session: ${error.message}`,
      };
      return buildSesionResponse(response, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function validar_request(req: Request, body?: { email?: string }): Promise<string | null> {
    var sessionEmail = null;
    try {
      var sessionToken = req.headers.get('X-Session-Token') || '';    
      sessionEmail = await userSesionService.getEmail(sessionToken);

      let email = '';
      if (body) {
        email = body.email || '';
      } else {
        var emailRq = await req.json() as { email?: string };
        email = emailRq.email || '';
      }

      if((!sessionEmail && !email) || (sessionEmail && email && sessionEmail !== email)) {
        return null;
      }

      if (!sessionEmail)  sessionEmail = email;
      
      if (!sessionEmail) {
        return null;
      }      
    } catch (err) {
      sessionEmail = null;
    }
    return sessionEmail;
  }

  return {
    registrar_user,
    validar_user,
    getSesion
  };
}

export function partnerSesionFromPartner(partner: PartnersEnv): PartnersEnvSession {
    return {
    email: partner.email,
    full_name: partner.full_name,
    phone: partner.phone,
    updated_at: partner.updated_at,
    active: partner.active,
    bookmarks_favorites: partner.bookmarks_favorites,
    expiration_date: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
    last_login: new Date().toISOString(),
  };
}

