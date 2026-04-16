import { jsonResponse } from '../../../../lib/utils.js';
import type { PartnersEnvSession } from '../../../models/PartnersEnv.js';
import type {
	ContaReportResource,
	ContaReportRow,
	ContaTableResource,
	ContaTableRow,
} from '../../../models/contable/ContaReport.js';
import type { Env } from '../../../types/interface.js';
import makeSecureSessionGuard from '../secureSessionGuard';

const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const ERR_RESOURCE_NOT_FOUND = 'Resource not found';
const ERR_REPORT_NOT_FOUND = 'Report not found';
const ERR_INTERNAL_ERROR = 'Internal server error';

interface ContaReportService {
	listTable(resource: ContaTableResource, limit?: number): Promise<ContaTableRow[]>;
	getTableById(resource: ContaTableResource, id: string): Promise<ContaTableRow | null>;
	listReport(report: ContaReportResource, limit?: number): Promise<ContaReportRow[]>;
}

interface UserSesionService {
	getEmail(token: string): Promise<string | null>;
	getToken(email: string): Promise<string>;
	getSessionByToken(token: string): Promise<PartnersEnvSession | null>;
}

export default function makeContaReportController(contaSvc: ContaReportService, userSesionService: UserSesionService) {
	const validateSecureSession = makeSecureSessionGuard(userSesionService);

	function resolveLimit(req: Request): number | undefined {
		const raw = new URL(req.url).searchParams.get('limit');
		if (!raw) return undefined;

		const value = Number.parseInt(raw, 10);
		if (Number.isNaN(value)) return undefined;
		return value;
	}

	async function listTable(req: Request, env: Env, resource: ContaTableResource): Promise<Response> {
		try {
			const sessionError = await validateSecureSession(req);
			if (sessionError) return sessionError;

			const data = await contaSvc.listTable(resource, resolveLimit(req));
			return jsonResponse({ success: true, data, count: data.length });
		} catch (error) {
			const err = error as Error;
			return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
		}
	}

	async function getTableById(req: Request, env: Env, resource: ContaTableResource, id: string): Promise<Response> {
		try {
			const sessionError = await validateSecureSession(req);
			if (sessionError) return sessionError;

			const data = await contaSvc.getTableById(resource, id);
			if (!data) return jsonResponse({ success: false, error: ERR_RESOURCE_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
			return jsonResponse({ success: true, data });
		} catch (error) {
			const err = error as Error;
			return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
		}
	}

	async function listReport(req: Request, env: Env, report: ContaReportResource): Promise<Response> {
		try {
			const sessionError = await validateSecureSession(req);
			if (sessionError) return sessionError;

			const data = await contaSvc.listReport(report, resolveLimit(req));
			if (!Array.isArray(data)) {
				return jsonResponse({ success: false, error: ERR_REPORT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
			}

			return jsonResponse({ success: true, data, count: data.length });
		} catch (error) {
			const err = error as Error;
			return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
		}
	}

	return {
		listTable,
		getTableById,
		listReport,
	};
}
