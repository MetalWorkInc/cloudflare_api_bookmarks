import { jsonResponse, HTTP_STATUS_UNAUTHORIZED, HTTP_STATUS_FORBIDDEN } from '../../lib/utils.js';
import type { PartnersEnvSession } from '../models/PartnersEnv.js';

const HEADER_SESSION_TOKEN = 'X-Session-Token';

const ERR_UNAUTHORIZED = 'Unauthorized';
const ERR_FORBIDDEN = 'Forbidden';

const MSG_SESSION_REQUIRED = 'Session is required.';
const MSG_INVALID_SESSION_TOKEN = 'Invalid session token.';
const MSG_SESSION_NOT_FOUND_OR_EXPIRED = 'Session not found or expired.';

interface UserSesionService {
  getEmail(token: string): Promise<string | null>;
  getToken(email: string): Promise<string>;
  getSessionByToken(token: string): Promise<PartnersEnvSession | null>;
}

export default function makeSecureSessionGuard(userSesionSvc: UserSesionService) {
  return async function validateSecureSession(req: Request): Promise<Response | null> {
    const sessionToken = req.headers.get(HEADER_SESSION_TOKEN);
    if (!sessionToken) {
      return jsonResponse(
        {
          success: false,
          error: ERR_UNAUTHORIZED,
          message: MSG_SESSION_REQUIRED,
        },
        HTTP_STATUS_UNAUTHORIZED
      );
    }

    const sessionEmail = await userSesionSvc.getEmail(sessionToken);
    if (!sessionEmail) {
      return jsonResponse(
        {
          success: false,
          error: ERR_FORBIDDEN,
          message: MSG_INVALID_SESSION_TOKEN,
        },
        HTTP_STATUS_FORBIDDEN
      );
    }

    const expectedToken = await userSesionSvc.getToken(sessionEmail);
    if (sessionToken !== expectedToken || !expectedToken) {
      return jsonResponse(
        {
          success: false,
          error: ERR_FORBIDDEN,
          message: MSG_INVALID_SESSION_TOKEN,
        },
        HTTP_STATUS_FORBIDDEN
      );
    }

    const session = await userSesionSvc.getSessionByToken(sessionToken);
    if (!session || typeof session.expiration_date !== 'number' || session.expiration_date < Date.now()) {
      return jsonResponse(
        {
          success: false,
          error: ERR_FORBIDDEN,
          message: MSG_SESSION_NOT_FOUND_OR_EXPIRED,
        },
        HTTP_STATUS_FORBIDDEN
      );
    }

    return null;
  };
}
