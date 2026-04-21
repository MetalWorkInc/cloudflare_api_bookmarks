import makeContaReportController from '../../../app/controllers/secure/contable/ContaReportController';
import type {
  ContaReportResource,
  ContaTableResource,
} from '../../../app/models/contable/ContaReport.js';
import makeContaReportService from '../../../app/services/contable/contaReportService';
import makeUserSesionTknService from '../../../app/services/userSesionTknService';
import type { Env } from '../../../app/types/interface.js';

const TABLE_RESOURCES = new Set<ContaTableResource>([
  'param-cuentas',
  'param-centros-costo',
  'param-lineas-producto',
  'param-clientes',
  'proc-ventas',
  'proc-ventas-flujo',
  'proc-compras-flujo',
  'proc-caja-chica-flujo',
  'cont-asientos',
  'cont-asientos-detalle',
]);

const REPORT_RESOURCES = new Set<ContaReportResource>([
  'libro-diario',
  'libro-mayor',
  'resultado-por-linea-producto',
]);

export default function makeContableRouter(env: Env) {
  const service = makeContaReportService(env);
  const userSesionService = makeUserSesionTknService(env);
  const controller = makeContaReportController(service, userSesionService);

  return async function route(request: Request, path: string, method: string): Promise<Response | null> {
    const parts = path.split('/').filter(Boolean);

    if (parts[0] !== 'contable') {
      return null;
    }

    if (parts.length >= 2 && parts[1] === 'reportes') {
      if (method !== 'GET' || parts.length !== 3) {
        return null;
      }

      const report = parts[2] as ContaReportResource;
      if (!REPORT_RESOURCES.has(report)) {
        return null;
      }

      return controller.listReport(request, env, report);
    }

    if (parts.length < 2) {
      return null;
    }

    const resource = parts[1] as ContaTableResource;
    if (!TABLE_RESOURCES.has(resource)) {
      return null;
    }

    if (method === 'GET' && parts.length === 2) {
      return controller.listTable(request, env, resource);
    }

    if (method === 'GET' && parts.length === 3) {
      return controller.getTableById(request, env, resource, parts[2]);
    }

    return null;
  };
}
