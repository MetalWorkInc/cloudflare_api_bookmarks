import { PartnersEnvRequest , PartnersEnvRequestInput } from '../../models/PartnersEnvRequest.js';
import makePublicGuard from '../../guards/publicGuard.js';
import { jsonResponse, HTTP_STATUS_CREATED, HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_INTERNAL_SERVER_ERROR } from '../../../lib/utils.js';
import type { Env } from '../../types/interface.js';

interface PartnersEnvRequestSvc {
  create(data: PartnersEnvRequestInput): Promise<PartnersEnvRequest>;  
  validatePartnersEnvRequest(data: unknown): Promise<string[]>;
}

/****************************************************************************************
 * PartnerRequestController
 ****************************************************************************************/ 

export default function makePartnerRequestController( partnerRequestSvc: PartnersEnvRequestSvc , env: Env) 
{ 
    const validatePublicInstance = makePublicGuard(env);

    async function create(req: Request): Promise<Response> {
        try {
            const validateVar = await validatePublicInstance(req);
            if (!validateVar){
                return jsonResponse({ success: false });
            } 

            const data = await req.json() as unknown;
            const errors = await partnerRequestSvc.validatePartnersEnvRequest(data);
            if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);
            const created = await partnerRequestSvc.create(data as PartnersEnvRequest);
            return jsonResponse({ success: true }, HTTP_STATUS_CREATED);
        } catch (err) {
            const error = err as Error;
            return jsonResponse({ success: false, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
        }
    }

    return {
        create,
    };
}
