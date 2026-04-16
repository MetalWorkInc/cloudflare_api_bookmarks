import type { Env } from '../../types/interface.js';
import type {
  ContaReportResource,
  ContaReportRow,
  ContaTableResource,
  ContaTableRow,
} from '../../models/contable/ContaReport.js';

type TableConfig = {
  table: string;
  idColumn: string;
  orderBy: string;
};

type ReportConfig = {
  view: string;
  orderBy: string;
};

const TABLE_CONFIGS: Record<ContaTableResource, TableConfig> = {
  'param-cuentas': {
    table: 'param_cuentas',
    idColumn: 'IdCuenta',
    orderBy: 'CodigoCuenta ASC',
  },
  'param-centros-costo': {
    table: 'param_centros_costo',
    idColumn: 'IdCentroCosto',
    orderBy: 'Nombre ASC',
  },
  'param-lineas-producto': {
    table: 'param_lineas_producto',
    idColumn: 'IdLineaProducto',
    orderBy: 'Nombre ASC',
  },
  'param-clientes': {
    table: 'param_clientes',
    idColumn: 'IdCliente',
    orderBy: 'RazonSocial ASC',
  },
  'proc-ventas': {
    table: 'proc_ventas',
    idColumn: 'IdVenta',
    orderBy: 'Fecha DESC, IdVenta DESC',
  },
  'proc-ventas-flujo': {
    table: 'proc_ventas_flujo',
    idColumn: 'IdVenta',
    orderBy: 'Fecha DESC, IdVenta DESC',
  },
  'proc-compras-flujo': {
    table: 'proc_compras_flujo',
    idColumn: 'IdCompra',
    orderBy: 'Fecha DESC, IdCompra DESC',
  },
  'proc-caja-chica-flujo': {
    table: 'proc_caja_chica_flujo',
    idColumn: 'IdMovimiento',
    orderBy: 'Fecha DESC, IdMovimiento DESC',
  },
  'cont-asientos': {
    table: 'cont_asientos',
    idColumn: 'IdAsiento',
    orderBy: 'Fecha DESC, NumeroAsiento DESC',
  },
  'cont-asientos-detalle': {
    table: 'cont_asientos_detalle',
    idColumn: 'IdAsientoDetalle',
    orderBy: 'IdAsiento DESC, IdAsientoDetalle DESC',
  },
};

const REPORT_CONFIGS: Record<ContaReportResource, ReportConfig> = {
  'libro-diario': {
    view: 'v_conta_LibroDiario',
    orderBy: 'Fecha DESC, NumeroAsiento DESC',
  },
  'libro-mayor': {
    view: 'v_conta_LibroMayor',
    orderBy: 'Anio DESC, Mes DESC, CodigoCuenta ASC',
  },
  'resultado-por-linea-producto': {
    view: 'v_conta_ResultadoPorLineaProducto',
    orderBy: 'Anio DESC, Mes DESC, LineaProducto ASC',
  },
};

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

function normalizeLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }

  if (limit < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(limit, MAX_LIMIT);
}

export default function makeContaReportService(env: Env) {
  const db = env.datastoraged01;

  async function listTable(resource: ContaTableResource, limit?: number): Promise<ContaTableRow[]> {
    const cfg = TABLE_CONFIGS[resource];
    const maxRows = normalizeLimit(limit);

    const { results } = await db
      .prepare(`SELECT * FROM ${cfg.table} ORDER BY ${cfg.orderBy} LIMIT ?`)
      .bind(maxRows)
      .all<ContaTableRow>();

    return results;
  }

  async function getTableById(resource: ContaTableResource, id: string): Promise<ContaTableRow | null> {
    const cfg = TABLE_CONFIGS[resource];
    return db
      .prepare(`SELECT * FROM ${cfg.table} WHERE ${cfg.idColumn} = ?`)
      .bind(id)
      .first<ContaTableRow>();
  }

  async function listReport(report: ContaReportResource, limit?: number): Promise<ContaReportRow[]> {
    const cfg = REPORT_CONFIGS[report];
    const maxRows = normalizeLimit(limit);

    const { results } = await db
      .prepare(`SELECT * FROM ${cfg.view} ORDER BY ${cfg.orderBy} LIMIT ?`)
      .bind(maxRows)
      .all<ContaReportRow>();

    return results;
  }

  return {
    listTable,
    getTableById,
    listReport,
  };
}
