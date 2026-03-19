import { jsonResponse } from '../../../lib/utils.js';
import type { GoogleAuthLogInput, GoogleAuthLogPaginatedResult } from '../../models/GoogleAuthLog.js';
import { PartnersEnvSession } from '../../models/PartnersEnv.js';
import makeSecureSessionGuard from './secureSessionGuard.js';

interface GoogleAuthLogService {
  getByFilterPaginated(filter: GoogleAuthLogInput, page?: number, pageSize?: number): Promise<GoogleAuthLogPaginatedResult>;
}

interface GoogleAuthLogFilterRequest {
  filter?: GoogleAuthLogInput;
  page?: number;
  pageSize?: number;
}

interface UserSesionService {
  getEmail(token: string): Promise<string | null>;
  getToken(email: string): Promise<string>;
  getSessionByToken(token: string): Promise<PartnersEnvSession | null>;
}


const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const ERR_FAILED_RETRIEVE_GOOGLE_AUTH_LOGS = 'Failed to retrieve Google auth logs';

export default function makeGoogleAuthLogController(service: GoogleAuthLogService, userSesionService: UserSesionService) {
  const validateSecureSession = makeSecureSessionGuard(userSesionService);

  /*** ***/
  async function filter(req: Request): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;
      
      const payload = await req.json() as GoogleAuthLogFilterRequest;
      const filterData = payload?.filter ?? {};
      const page = payload?.page ?? DEFAULT_PAGE;
      const pageSize = payload?.pageSize ?? DEFAULT_PAGE_SIZE;

      const result = await service.getByFilterPaginated(filterData, page, pageSize);

      return jsonResponse({
        success: true,
        data: result,
      });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({
        success: false,
        error: ERR_FAILED_RETRIEVE_GOOGLE_AUTH_LOGS,
        message: error.message,
      }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  return {
    filter,
  };
}
