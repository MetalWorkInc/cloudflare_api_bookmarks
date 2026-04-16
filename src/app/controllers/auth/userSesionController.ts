import { jsonResponse } from '../../../lib/utils.js';
import type { PartnersEnv, PartnersEnvInput, PartnersEnvSession } from '../../models/PartnersEnv.js';
import type { SesionEnv } from '../../models/Sesion.js';
import { validateSesionEnv } from '../../models/Sesion.js';
import { GoogleAuthLogInput } from '../../models/GoogleAuthLog.js';
import type { Env } from '../../types/interface.js';

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

interface GoogleAuthLogService {
  create(data: GoogleAuthLogInput): Promise<unknown>;
}

const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_ACCEPTED = 202;
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_FORBIDDEN = 403;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const HEADER_API_TOKEN = 'X-API-Token';
const HEADER_SESSION_TOKEN = 'X-Session-Token';
const DEFAULT_API_TOKEN = 'default-api-token';

const EMPTY_STRING = '';

const MSG_INVALID_SESSION_TOKEN = 'Invalid session token';
const MSG_SESSION_ACTIVE = 'Sesión activa';
const MSG_SESSION_NOT_POSSIBLE = 'la sesion no es posible';
const MSG_SESSION_CREATED = 'Sesión creada';
const MSG_SESSION_EXPIRED = 'Sesión ha expirado';
const MSG_FAILED_VALIDATE_SESSION = 'Failed to validate session';
const MSG_SESSION_HAS_EXPIRED = 'Session has expired';
const MSG_SESSION_IS_VALID = 'Session is valid';
const MSG_FAILED_REGISTER_USER_SESSION = 'Failed to register user session';
const MSG_USER_REGISTERED_AND_SESSION_CREATED = 'Usuario registrado y sesión creada';
const MSG_INVALID_ENCRYPTED_DATA = 'Invalid encrypted data';

const HOURS_PER_SESSION = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLIS_PER_SECOND = 1000;
const REFRESH_EXPIRATION_DAYS = 7;
const EXPIRE_SESSION_SECONDS = HOURS_PER_SESSION * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;  
const EXPIRE_SESSION_REFRESH_SECONDS = REFRESH_EXPIRATION_DAYS * HOURS_PER_SESSION * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;


/****************************************************************************************
 * UserSesionController
 ****************************************************************************************/ 

export default function makeUserSesionController( userSesionService: UserSesionService,
                                                  partnersEnvService: PartnersEnvService,
                                                  googleAuthLogService: GoogleAuthLogService,
                                                  env: Env ) 
{

    const API_TOKEN = env.API_TOKEN || DEFAULT_API_TOKEN;

    /****************************************************************************************
     *  registrar_user(req: Request): Promise<Response> 
    ****************************************************************************************/
    async function registrar_user(req: Request): Promise<Response> {
      try {
        const inputData = await req.json() as { email?: string; pass?: string };
        let sessionEmail = await validar_request(req, inputData) || null;
        return await fn_registrar_user(sessionEmail || '');
      } catch (err) {        
        const error = err as Error;
        const response: SesionEnv = {
          success: false,
          token: EMPTY_STRING,
          data: EMPTY_STRING,
          message: `Failed to register user session [${error.name}]: ${error.message}`,
        };
        return buildSesionResponse(response, HTTP_STATUS_INTERNAL_SERVER_ERROR);
      }
    }

    /****************************************************************************************
     *  validar_user(req: Request): Promise<Response> 
    ****************************************************************************************/
    async function validar_user(req: Request): Promise<Response> {
      try {
        let sessionEmail = await validar_request(req) || null;

        if (!sessionEmail) {
          const response: SesionEnv = {
            success: false,
            token: EMPTY_STRING,
            data: EMPTY_STRING,
            message: MSG_INVALID_SESSION_TOKEN,
          };
          return buildSesionResponse(response, HTTP_STATUS_FORBIDDEN);
        }

        const existingSession = await userSesionService.getSessionByEmail(sessionEmail);
        const hasValidRefreshExpiration = existingSession
          && typeof existingSession.refresh_expiration_date === 'number'
          && existingSession.refresh_expiration_date >= Date.now();

        if (hasValidRefreshExpiration) {
          const token = await userSesionService.getToken(sessionEmail);
          existingSession.expiration_date = Date.now() + EXPIRE_SESSION_SECONDS * MILLIS_PER_SECOND;
          const response: SesionEnv = {
            success: true,
            token,
            data: encryptSesionData(JSON.stringify(existingSession), token),
            message: MSG_SESSION_ACTIVE,
          };
          return buildSesionResponse(response, HTTP_STATUS_ACCEPTED);
        } else {
          const response: SesionEnv = {
            success: false,
            token: EMPTY_STRING,
            data: EMPTY_STRING,
            message: MSG_SESSION_EXPIRED,
          };
          return buildSesionResponse(response, HTTP_STATUS_FORBIDDEN);
        }
      } catch (err) {
        const error = err as Error;
        const response: SesionEnv = {
          success: false,
          token: EMPTY_STRING,
          data: EMPTY_STRING,
          message: `Failed to validate session [${error.name}]: ${error.message}`,
        };
        return buildSesionResponse(response, HTTP_STATUS_INTERNAL_SERVER_ERROR);
      }
    }

    /****************************************************************************************
     *  validar_google_auth(req: Request): Promise<Response>
    ****************************************************************************************/
    async function validar_google_auth(req: Request): Promise<Response> {
      try {
        const apiToken = req.headers.get(HEADER_API_TOKEN);
        const encryptedBody = await req.text();
        if (!encryptedBody || !apiToken) {
          const response: SesionEnv = {
            success: false,
            token: EMPTY_STRING,
            data: EMPTY_STRING,
            message: MSG_FAILED_REGISTER_USER_SESSION,
          };
          return buildSesionResponse(response, HTTP_STATUS_BAD_REQUEST);
        }
        var credentialObj = await JSON.parse(encryptedBody) as { credential?: string };
        const decrypted = decryptSesionData(credentialObj.credential || '', apiToken);
        let data: GoogleAuthLogInput;
        try {
          data = JSON.parse(decrypted) as GoogleAuthLogInput;
        } catch {
          const response: SesionEnv = {
            success: false,
            token: EMPTY_STRING,
            data: EMPTY_STRING,
            message: MSG_FAILED_REGISTER_USER_SESSION,
          };
          return buildSesionResponse(response, HTTP_STATUS_BAD_REQUEST);
        }

        await googleAuthLogService.create(data);
        return await fn_registrar_user(data.email || '');
      } catch (err) {
        const error = err as Error;
        const response: SesionEnv = {
          success: false,
          token: EMPTY_STRING,
          data: EMPTY_STRING,
          message: `Failed to register user session [${error.name}]: ${error.message}`,
        };
        console.error('Error in validar_google_auth:', error);
        return buildSesionResponse(response, HTTP_STATUS_INTERNAL_SERVER_ERROR);
      }
    }

    /****************************************************************************************
     *  getSesion(req: Request): Promise<Response> 
    ****************************************************************************************/
    async function getSesion(req: Request): Promise<Response> {
      try {
        const sessionToken = req.headers.get(HEADER_SESSION_TOKEN) || EMPTY_STRING;
        const body = await req.json() as { data?: string };

        if (!sessionToken || !body?.data) {
          const response: SesionEnv = {
            success: false,
            token: sessionToken,
            data: EMPTY_STRING,
            message: MSG_FAILED_VALIDATE_SESSION,
          };
          return buildSesionResponse(response, HTTP_STATUS_FORBIDDEN);
        }

        const partnerSesion = decryptSesionData(body.data || '', sessionToken);
        if (!partnerSesion) {
          const response: SesionEnv = {
            success: false,
            token: sessionToken,
            data: EMPTY_STRING,
            message: MSG_FAILED_VALIDATE_SESSION,
          };
          return buildSesionResponse(response, HTTP_STATUS_FORBIDDEN);
        } else {
          const sesionData = JSON.parse(partnerSesion) as PartnersEnvSession;
          if (sesionData.expiration_date < Date.now()) {
            const response: SesionEnv = {
              success: false,
              token: sessionToken,
              data: EMPTY_STRING,
              message: MSG_SESSION_HAS_EXPIRED,
            };
            return buildSesionResponse(response, HTTP_STATUS_FORBIDDEN);
          } else {
            const response: SesionEnv = {
              success: true,
              token: sessionToken,
              data: partnerSesion,
              message: MSG_SESSION_IS_VALID,
            };
            return buildSesionResponse(response);
          }
        }

      } catch (err) {
        const error = err as Error;
        const response: SesionEnv = {
          success: false,
          token: EMPTY_STRING,
          data: EMPTY_STRING,
          message: `Failed to validate session [${error.name}]: ${error.message}`,
        };
        return buildSesionResponse(response, HTTP_STATUS_INTERNAL_SERVER_ERROR);
      }
    }

    /****************************************************************************************
     *  validar_request(req: Request): Promise<Response>
    ****************************************************************************************/
    async function validar_request(req: Request, body?: { email?: string; pass?: string }): Promise<string | null> {
      var sessionEmail = null;
      try {
        var sessionToken = req.headers.get(HEADER_SESSION_TOKEN) || EMPTY_STRING;    
        sessionEmail = await userSesionService.getEmail(sessionToken);
        let email = EMPTY_STRING;
        let pass = EMPTY_STRING;
        if (body) {
          email = body.email || EMPTY_STRING;
          pass = body.pass || EMPTY_STRING;
        }

        email = email.trim();
        pass = pass.trim();
        
        if((!sessionEmail && !email) || (sessionEmail && email && sessionEmail !== email)) {          
          return null;
        }

        if (!sessionEmail) {
          if (!email || !pass) {
            return null;
          }

          const normalizedEmail = String(email ?? '').trim().toLowerCase();
          const decryptedPass = decryptSesionData(pass, `${API_TOKEN}:${normalizedEmail}`)
          const partners = await partnersEnvService.getByFilter({
            email,
            full_name: EMPTY_STRING,
            key: decryptedPass
          });

          const partner = partners && partners.length === 1 ? partners[0] : null;
          if (!partner || partner.active !== 1) {
            return null;
          }

          sessionEmail = email;
        }
        
        if (!sessionEmail) {
          return null;
        }      
      } catch (err) {
        const error = err as Error;
        console.error(`Error in validar_request [${error.name}]:`, error.message);
        sessionEmail = null;
      }
      return sessionEmail;
    }

    /****************************************************************************************
     *  fn_registrar_user(email: string): Promise<Response> 
    ****************************************************************************************/
    async function fn_registrar_user(email: string): Promise<Response> {
      try {
        if (!email) {
          const response: SesionEnv = {
            success: false,
            token: EMPTY_STRING,
            data: EMPTY_STRING,
            
            message: MSG_FAILED_REGISTER_USER_SESSION,
          };
          return buildSesionResponse(response, HTTP_STATUS_BAD_REQUEST);
        }
        //
        const partners = await partnersEnvService.getByFilter( { email: email, full_name: '', key: '' } );
        const partner = partners.length == 1 ? partners[0] : null;
        if (!partner) {
          const response: SesionEnv = {
            success: false,
            token: EMPTY_STRING,
            data: EMPTY_STRING,
            message: MSG_FAILED_REGISTER_USER_SESSION,
          };
          return buildSesionResponse(response, HTTP_STATUS_BAD_REQUEST);
        }

        var partnerSession = createPartnerEnvSesion(partner);
        const token = await userSesionService.createSession(partner.email, partnerSession);
        const response: SesionEnv = {
          success: true,
          token,
          data: encryptSesionData(JSON.stringify(partnerSession), token),
          message: MSG_USER_REGISTERED_AND_SESSION_CREATED,
        };
        return buildSesionResponse(response, HTTP_STATUS_CREATED);

      } catch (err) {
        const error = err as Error;
        const response: SesionEnv = {
          success: false,
          token: EMPTY_STRING,
          data: EMPTY_STRING,
          message: `Failed to register user session [${error.name}]: ${error.message}`,
        };
        return buildSesionResponse(response, HTTP_STATUS_INTERNAL_SERVER_ERROR);
      }
    }

    return {
      registrar_user,
      validar_user,
      validar_google_auth,
      getSesion
    };
}

/****************************************************************************************
 * Helper functions
 ****************************************************************************************/ 

function buildSesionResponse(response: SesionEnv, status = HTTP_STATUS_OK): Response {
  const errors = validateSesionEnv(response);
  if (errors.length) {
    const fallback: SesionEnv = {
      success: false,
      token: EMPTY_STRING,
      data: EMPTY_STRING,
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

function isValidBase64(value: string): boolean {
  const normalized = value.trim();
  if (!normalized || normalized.length % 4 !== 0) {
    return false;
  }

  return /^[A-Za-z0-9+/]+={0,2}$/.test(normalized);
}

function decryptSesionData(encryptedData: string, token: string): string {
  if (!token) return encryptedData;
  const normalized = encryptedData.trim();

  if (!isValidBase64(normalized)) {
    const error = new TypeError(MSG_INVALID_ENCRYPTED_DATA);
    error.name = 'InvalidEncryptedDataError';
    throw error;
  }

  try {
    const binary = atob(normalized);
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
  } catch (err) {
    const error = err as Error;
    const decryptError = new TypeError(`${MSG_INVALID_ENCRYPTED_DATA}: ${error.message}`);
    decryptError.name = error.name || 'InvalidEncryptedDataError';
    throw decryptError;
  }
}

export function createPartnerEnvSesion(partner: PartnersEnv): PartnersEnvSession {
    return {
    email: partner.email,
    full_name: partner.full_name,
    phone: partner.phone,
    updated_at: partner.updated_at,
    active: partner.active,
    bookmarks_favorites: partner.bookmarks_favorites,
    refresh_expiration_date: Date.now() + EXPIRE_SESSION_REFRESH_SECONDS * MILLIS_PER_SECOND,
    expiration_date: Date.now() + EXPIRE_SESSION_SECONDS * MILLIS_PER_SECOND,
    last_login: new Date().toISOString(),
  };
}

