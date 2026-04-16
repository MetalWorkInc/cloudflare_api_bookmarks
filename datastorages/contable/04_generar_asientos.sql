PRAGMA foreign_keys = ON;

-- Reemplazo de CREATE PROCEDURE para SQLite.
-- Este script toma datos de proc_ventas_flujo, proc_compras_flujo y proc_caja_chica_flujo
-- y genera asientos en cont_asientos y cont_asientos_detalle.
-- Importante para D1 remoto: no usar BEGIN/COMMIT en scripts ejecutados con wrangler d1 execute.

-- Limpieza de asientos generados automaticamente (permite re-ejecucion segura).
DELETE FROM cont_asientos_detalle
WHERE IdAsiento IN (
    SELECT IdAsiento
    FROM cont_asientos
    WHERE NumeroAsiento BETWEEN 100000 AND 399999
);

DELETE FROM cont_asientos
WHERE NumeroAsiento BETWEEN 100000 AND 399999;

-- =========================
-- VENTAS
-- NumeroAsiento: 100000 + IdVenta
-- =========================
INSERT INTO cont_asientos (Fecha, NumeroAsiento, Descripcion)
SELECT
    v.Fecha,
    100000 + v.IdVenta,
    'Asiento venta ' || COALESCE(v.Folio, CAST(v.IdVenta AS TEXT))
FROM proc_ventas_flujo v
;

INSERT INTO cont_asientos_detalle (IdAsiento, IdCuenta, Debe, Haber, IdCentroCosto, IdLineaProducto, Referencia)
SELECT
    a.IdAsiento,
    v.CuentaRecaudacion,
    COALESCE(v.Total, 0),
    0,
    v.IdCentroCosto,
    v.IdLineaProducto,
    v.Folio
FROM proc_ventas_flujo v
JOIN cont_asientos a ON a.NumeroAsiento = 100000 + v.IdVenta;

INSERT INTO cont_asientos_detalle (IdAsiento, IdCuenta, Debe, Haber, IdCentroCosto, IdLineaProducto, Referencia)
SELECT
    a.IdAsiento,
    v.CuentaIngreso,
    0,
    COALESCE(v.Neto, 0),
    v.IdCentroCosto,
    v.IdLineaProducto,
    v.Folio
FROM proc_ventas_flujo v
JOIN cont_asientos a ON a.NumeroAsiento = 100000 + v.IdVenta;

INSERT INTO cont_asientos_detalle (IdAsiento, IdCuenta, Debe, Haber)
SELECT
    a.IdAsiento,
    v.CuentaIVA,
    0,
    COALESCE(v.IVA, 0)
FROM proc_ventas_flujo v
JOIN cont_asientos a ON a.NumeroAsiento = 100000 + v.IdVenta
WHERE COALESCE(v.IVA, 0) > 0;

-- =========================
-- COMPRAS
-- NumeroAsiento: 200000 + IdCompra
-- =========================
INSERT INTO cont_asientos (Fecha, NumeroAsiento, Descripcion)
SELECT
    c.Fecha,
    200000 + c.IdCompra,
    'Asiento compra ' || COALESCE(c.Folio, CAST(c.IdCompra AS TEXT))
FROM proc_compras_flujo c
;

INSERT INTO cont_asientos_detalle (IdAsiento, IdCuenta, Debe, Haber, IdCentroCosto, Referencia)
SELECT
    a.IdAsiento,
    c.CuentaContable,
    COALESCE(c.Neto, 0),
    0,
    c.IdCentroCosto,
    c.Folio
FROM proc_compras_flujo c
JOIN cont_asientos a ON a.NumeroAsiento = 200000 + c.IdCompra;

INSERT INTO cont_asientos_detalle (IdAsiento, IdCuenta, Debe, Haber)
SELECT
    a.IdAsiento,
    4,
    COALESCE(c.IVA, 0),
    0
FROM proc_compras_flujo c
JOIN cont_asientos a ON a.NumeroAsiento = 200000 + c.IdCompra
WHERE COALESCE(c.IVA, 0) > 0;

INSERT INTO cont_asientos_detalle (IdAsiento, IdCuenta, Debe, Haber)
SELECT
    a.IdAsiento,
    CASE WHEN c.TipoDocumento = 'Factura' THEN 8 ELSE 2 END,
    0,
    COALESCE(c.Total, 0)
FROM proc_compras_flujo c
JOIN cont_asientos a ON a.NumeroAsiento = 200000 + c.IdCompra;

-- =========================
-- CAJA CHICA
-- NumeroAsiento: 300000 + IdMovimiento
-- =========================
INSERT INTO cont_asientos (Fecha, NumeroAsiento, Descripcion)
SELECT
    cc.Fecha,
    300000 + cc.IdMovimiento,
    'Caja chica ' || COALESCE(cc.TipoMovimiento, '')
FROM proc_caja_chica_flujo cc
;

-- Reposicion
INSERT INTO cont_asientos_detalle (IdAsiento, IdCuenta, Debe, Haber)
SELECT
    a.IdAsiento,
    5,
    COALESCE(cc.Monto, 0),
    0
FROM proc_caja_chica_flujo cc
JOIN cont_asientos a ON a.NumeroAsiento = 300000 + cc.IdMovimiento
WHERE UPPER(COALESCE(cc.TipoMovimiento, '')) = 'REPOSICION';

INSERT INTO cont_asientos_detalle (IdAsiento, IdCuenta, Debe, Haber)
SELECT
    a.IdAsiento,
    1,
    0,
    COALESCE(cc.Monto, 0)
FROM proc_caja_chica_flujo cc
JOIN cont_asientos a ON a.NumeroAsiento = 300000 + cc.IdMovimiento
WHERE UPPER(COALESCE(cc.TipoMovimiento, '')) = 'REPOSICION';

-- Gasto
INSERT INTO cont_asientos_detalle (IdAsiento, IdCuenta, Debe, Haber)
SELECT
    a.IdAsiento,
    cc.CuentaGasto,
    COALESCE(cc.Monto, 0),
    0
FROM proc_caja_chica_flujo cc
JOIN cont_asientos a ON a.NumeroAsiento = 300000 + cc.IdMovimiento
WHERE UPPER(COALESCE(cc.TipoMovimiento, '')) = 'GASTO';

INSERT INTO cont_asientos_detalle (IdAsiento, IdCuenta, Debe, Haber)
SELECT
    a.IdAsiento,
    5,
    0,
    COALESCE(cc.Monto, 0)
FROM proc_caja_chica_flujo cc
JOIN cont_asientos a ON a.NumeroAsiento = 300000 + cc.IdMovimiento
WHERE UPPER(COALESCE(cc.TipoMovimiento, '')) = 'GASTO';
