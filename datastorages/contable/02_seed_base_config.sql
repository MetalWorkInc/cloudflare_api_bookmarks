PRAGMA foreign_keys = ON;

-- =========================
-- DATOS BASE PARA CATALOGOS
-- =========================

INSERT OR IGNORE INTO param_centros_costo (IdCentroCosto, Nombre, Descripcion)
VALUES
(1, 'General', 'Centro de costo general');

INSERT OR IGNORE INTO param_lineas_producto (IdLineaProducto, Nombre, TipoServicio, Observaciones)
VALUES
(1, 'Clases Basicas', 'Boleta', NULL),
(2, 'Informatica Avanzada', 'Factura', NULL),
(3, 'Ingenieria Avanzada', 'Factura', NULL);

INSERT OR IGNORE INTO param_clientes (IdCliente, RUT, RazonSocial, Giro, Direccion, Ciudad, Email)
VALUES
(1, '76.000.000-0', 'Cliente General', 'Servicios', NULL, NULL, NULL);

-- =========================
-- PLAN DE CUENTAS BASICO
-- =========================

INSERT OR IGNORE INTO param_cuentas (IdCuenta, CodigoCuenta, NombreCuenta, Tipo, Subtipo, Naturaleza, AfectaRLI, AfectaIVA)
VALUES
(1,  '1.1.01', 'Caja',                          'Activo',     'Circulante', 'Deudora',   1, 0),
(2,  '1.1.02', 'Banco Cuenta Corriente',        'Activo',     'Circulante', 'Deudora',   1, 0),
(3,  '1.1.03', 'Clientes',                      'Activo',     'Circulante', 'Deudora',   1, 0),
(4,  '1.1.04', 'IVA Credito Fiscal',            'Activo',     'Circulante', 'Deudora',   0, 1),
(5,  '1.1.06', 'Caja Chica',                    'Activo',     'Circulante', 'Deudora',   1, 0),
(6,  '1.2.01', 'Mobiliario',                    'Activo',     'Fijo',       'Deudora',   1, 0),
(7,  '1.2.02', 'Equipos Computacionales',       'Activo',     'Fijo',       'Deudora',   1, 0),
(8,  '2.1.01', 'Proveedores',                   'Pasivo',     'Circulante', 'Acreedora', 0, 0),
(9,  '2.1.02', 'IVA Debito Fiscal',             'Pasivo',     'Circulante', 'Acreedora', 0, 1),
(10, '3.1',    'Capital Inicial',               'Patrimonio', NULL,         'Acreedora', 0, 0),
(11, '4.1',    'Ingresos Clases Basicas',       'Ingreso',    NULL,         'Acreedora', 1, 0),
(12, '4.2',    'Ingresos Informatica Avanzada', 'Ingreso',    NULL,         'Acreedora', 1, 0),
(13, '4.3',    'Ingresos Ingenieria Avanzada',  'Ingreso',    NULL,         'Acreedora', 1, 0),
(14, '5.1.07', 'Gastos Caja Chica',             'Gasto',      NULL,         'Deudora',   1, 0);

-- =========================
-- ASIENTOS (CABECERA)
-- =========================

INSERT OR IGNORE INTO cont_asientos (IdAsiento, Fecha, NumeroAsiento, Descripcion)
VALUES
(1, '2026-01-01', 1, 'Capital inicial aportado en efectivo'),
(2, '2026-01-10', 2, 'Venta clases basicas computacion (boleta)'),
(3, '2026-01-12', 3, 'Venta asesoria informatica avanzada (factura)'),
(4, '2026-01-15', 4, 'Compra silla ergonomica'),
(5, '2026-01-16', 5, 'Compra escritorio'),
(6, '2026-01-20', 6, 'Compra notebook profesional'),
(7, '2026-01-22', 7, 'Compra PC escritorio'),
(8, '2026-01-25', 8, 'Reposicion caja chica'),
(9, '2026-01-26', 9, 'Gasto caja chica - utiles');

-- =========================
-- DETALLE DE ASIENTOS
-- =========================

INSERT OR IGNORE INTO cont_asientos_detalle (IdAsientoDetalle, IdAsiento, IdCuenta, Debe, Haber, IdCentroCosto, IdLineaProducto, Referencia)
VALUES
(1,  1,  1, 1000000,      0, NULL, NULL, 'Capital inicial'),
(2,  1, 10,       0, 1000000, NULL, NULL, 'Capital inicial'),
(3,  2,  1,   50000,      0, NULL, 1,    'Venta boleta clases basicas'),
(4,  2, 11,       0,   50000, NULL, 1,    'Venta boleta clases basicas'),
(5,  3,  2,  238000,      0, NULL, 2,    'Venta factura informatica avanzada'),
(6,  3, 12,       0,  200000, NULL, 2,    'Venta factura informatica avanzada'),
(7,  3,  9,       0,   38000, NULL, 2,    'IVA debito venta informatica'),
(8,  4,  6,   80000,      0, NULL, NULL, 'Compra silla'),
(9,  4,  4,   15200,      0, NULL, NULL, 'IVA credito compra silla'),
(10, 4,  2,       0,   95200, NULL, NULL, 'Pago compra silla'),
(11, 5,  6,  120000,      0, NULL, NULL, 'Compra escritorio'),
(12, 5,  4,   22800,      0, NULL, NULL, 'IVA credito compra escritorio'),
(13, 5,  2,       0,  142800, NULL, NULL, 'Pago compra escritorio'),
(14, 6,  7,  700000,      0, NULL, NULL, 'Compra notebook'),
(15, 6,  4,  133000,      0, NULL, NULL, 'IVA credito compra notebook'),
(16, 6,  8,       0,  833000, NULL, NULL, 'Proveedor notebook'),
(17, 7,  7,  500000,      0, NULL, NULL, 'Compra PC escritorio'),
(18, 7,  4,   95000,      0, NULL, NULL, 'IVA credito compra PC'),
(19, 7,  8,       0,  595000, NULL, NULL, 'Proveedor PC escritorio'),
(20, 8,  5,   50000,      0, NULL, NULL, 'Reposicion caja chica'),
(21, 8,  1,       0,   50000, NULL, NULL, 'Reposicion caja chica'),
(22, 9, 14,   12000,      0, NULL, NULL, 'Utiles pagados con caja chica'),
(23, 9,  5,       0,   12000, NULL, NULL, 'Utiles pagados con caja chica');
