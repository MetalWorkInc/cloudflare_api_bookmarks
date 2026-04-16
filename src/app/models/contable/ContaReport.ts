export type ContaTableResource =
  | 'param-cuentas'
  | 'param-centros-costo'
  | 'param-lineas-producto'
  | 'param-clientes'
  | 'proc-ventas'
  | 'proc-ventas-flujo'
  | 'proc-compras-flujo'
  | 'proc-caja-chica-flujo'
  | 'cont-asientos'
  | 'cont-asientos-detalle';

export type ContaReportResource =
  | 'libro-diario'
  | 'libro-mayor'
  | 'resultado-por-linea-producto';

export interface ParamCuenta {
  IdCuenta: number;
  CodigoCuenta: string;
  NombreCuenta: string;
  Tipo: string;
  Subtipo?: string | null;
  Naturaleza: string;
  AfectaRLI: number;
  AfectaIVA: number;
}

export interface ParamCentroCosto {
  IdCentroCosto: number;
  Nombre: string;
  Descripcion?: string | null;
}

export interface ParamLineaProducto {
  IdLineaProducto: number;
  Nombre: string;
  TipoServicio: string;
  Observaciones?: string | null;
}

export interface ParamCliente {
  IdCliente: number;
  RUT: string;
  RazonSocial: string;
  Giro?: string | null;
  Direccion?: string | null;
  Ciudad?: string | null;
  Email?: string | null;
}

export interface ProcVenta {
  IdVenta: number;
  Fecha: string;
  TipoDocumento: string;
  Folio: string;
  IdCliente: number;
  IdLineaProducto: number;
  IdCentroCosto?: number | null;
  Descripcion?: string | null;
  Neto: number;
  IVA: number;
  Exento: number;
  Total: number;
}

export interface ProcVentaFlujo {
  IdVenta: number;
  Fecha: string;
  TipoDocumento: string;
  Folio?: string | null;
  IdCliente?: number | null;
  IdLineaProducto?: number | null;
  IdCentroCosto?: number | null;
  Descripcion?: string | null;
  Neto?: number | null;
  IVA?: number | null;
  Exento?: number | null;
  Total?: number | null;
  CuentaIngreso?: number | null;
  CuentaIVA?: number | null;
  CuentaRecaudacion?: number | null;
}

export interface ProcCompraFlujo {
  IdCompra: number;
  Fecha: string;
  TipoDocumento?: string | null;
  Folio?: string | null;
  Proveedor?: string | null;
  Descripcion?: string | null;
  Neto?: number | null;
  IVA?: number | null;
  Exento?: number | null;
  Total?: number | null;
  CuentaContable?: number | null;
  IdCentroCosto?: number | null;
}

export interface ProcCajaChicaFlujo {
  IdMovimiento: number;
  Fecha?: string | null;
  TipoMovimiento?: string | null;
  Descripcion?: string | null;
  Monto?: number | null;
  CuentaGasto?: number | null;
}

export interface ContAsiento {
  IdAsiento: number;
  Fecha: string;
  NumeroAsiento: number;
  Descripcion?: string | null;
}

export interface ContAsientoDetalle {
  IdAsientoDetalle: number;
  IdAsiento: number;
  IdCuenta: number;
  Debe: number;
  Haber: number;
  IdCentroCosto?: number | null;
  IdLineaProducto?: number | null;
  Referencia?: string | null;
}

export interface ReporteLibroDiario {
  Fecha: string;
  NumeroAsiento: number;
  DescripcionAsiento?: string | null;
  CodigoCuenta: string;
  NombreCuenta: string;
  Debe: number;
  Haber: number;
  CentroCosto?: string | null;
  LineaProducto?: string | null;
}

export interface ReporteLibroMayor {
  CodigoCuenta: string;
  NombreCuenta: string;
  Anio: number;
  Mes: number;
  TotalDebe: number;
  TotalHaber: number;
  Saldo: number;
}

export interface ReporteResultadoPorLineaProducto {
  LineaProducto?: string | null;
  Anio: number;
  Mes: number;
  Ingresos: number;
  Gastos: number;
  Resultado: number;
}

export type ContaTableRow =
  | ParamCuenta
  | ParamCentroCosto
  | ParamLineaProducto
  | ParamCliente
  | ProcVenta
  | ProcVentaFlujo
  | ProcCompraFlujo
  | ProcCajaChicaFlujo
  | ContAsiento
  | ContAsientoDetalle;

export type ContaReportRow =
  | ReporteLibroDiario
  | ReporteLibroMayor
  | ReporteResultadoPorLineaProducto;
