
import makePartnerRequestController from '../../app/controllers/public/partnerRequestController';
import makePartnersEnvRequestService from '../../app/services/public/partnersEnvRequestService';
import type { Env } from '../../app/types/interface.js';


export default function makePartnerRequestRouter(env: Env) {

    const partnerSvc = makePartnersEnvRequestService(env);
    const partnerRequestController = makePartnerRequestController(partnerSvc, env);
    
    return async function route(request: Request, path: string, method: string): Promise<Response | null> {

        if (path === '/partner-request' && method === 'POST') return partnerRequestController.create(request);

        return null; // not handled
    }
}