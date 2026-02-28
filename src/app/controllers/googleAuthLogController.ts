import { jsonResponse } from '../../lib/utils.js';
import type { GoogleAuthLogInput, GoogleAuthLogPaginatedResult } from '../models/GoogleAuthLog';

interface GoogleAuthLogService {
  getByFilterPaginated(filter: GoogleAuthLogInput, page?: number, pageSize?: number): Promise<GoogleAuthLogPaginatedResult>;
}

interface GoogleAuthLogFilterRequest {
  filter?: GoogleAuthLogInput;
  page?: number;
  pageSize?: number;
}

export default function makeGoogleAuthLogController(service: GoogleAuthLogService) {

  /*** ***/
  async function filter(req: Request): Promise<Response> {
    try {
      const payload = await req.json() as GoogleAuthLogFilterRequest;
      const filterData = payload?.filter ?? {};
      const page = payload?.page ?? 1;
      const pageSize = payload?.pageSize ?? 20;

      const result = await service.getByFilterPaginated(filterData, page, pageSize);

      return jsonResponse({
        success: true,
        data: result,
      });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({
        success: false,
        error: 'Failed to retrieve Google auth logs',
        message: error.message,
      }, 500);
    }
  }

  return {
    filter,
  };
}
