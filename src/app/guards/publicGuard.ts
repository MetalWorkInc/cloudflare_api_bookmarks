//import { jsonResponse } from '../../lib/utils.js';
import type { Env } from '../types/interface.js';

//const HEADER_SESSION_TOKEN = 'X-Session-Token';
const HEADER_API_VAR = 'X-API-VAR';
const HEADER_API_VAR_VALUE = 'var-value';

/*
const ERR_UNAUTHORIZED = 'Unauthorized';
const ERR_FORBIDDEN = 'Forbidden';

const MSG_VAR_REQUIRED = 'Variable is required.';
const MSG_INVALID_VAR_TOKEN = 'Invalid variable token.';
const MSG_VAR_NOT_FOUND_OR_EXPIRED = 'Variable not found or expired.';
*/

export default function makePublicGuard(env: Env) {
        
    return async function validateApiVar(req: Request): Promise<boolean> {
        //const sessionToken = req.headers.get(HEADER_SESSION_TOKEN);        
        const valueApiVar = req.headers.get(HEADER_API_VAR);
        const validApiVar = env.WORKER_VAR_X || HEADER_API_VAR_VALUE;

        return valueApiVar === validApiVar;    
    };
}