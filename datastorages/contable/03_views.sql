DROP VIEW IF EXISTS v_conta_LibroDiario;
DROP VIEW IF EXISTS v_conta_LibroMayor;
DROP VIEW IF EXISTS v_conta_ResultadoPorLineaProducto;

CREATE VIEW v_conta_LibroDiario AS
SELECT
    a.Fecha,
    a.NumeroAsiento,
    a.Descripcion AS DescripcionAsiento,
    c.CodigoCuenta,
    c.NombreCuenta,
    d.Debe,
    d.Haber,
    cc.Nombre AS CentroCosto,
    lp.Nombre AS LineaProducto
FROM cont_asientos a
JOIN cont_asientos_detalle d ON a.IdAsiento = d.IdAsiento
JOIN param_cuentas c ON d.IdCuenta = c.IdCuenta
LEFT JOIN param_centros_costo cc ON d.IdCentroCosto = cc.IdCentroCosto
LEFT JOIN param_lineas_producto lp ON d.IdLineaProducto = lp.IdLineaProducto;

CREATE VIEW v_conta_LibroMayor AS
SELECT
    c.CodigoCuenta,
    c.NombreCuenta,
    CAST(strftime('%Y', a.Fecha) AS INTEGER) AS Anio,
    CAST(strftime('%m', a.Fecha) AS INTEGER) AS Mes,
    SUM(d.Debe) AS TotalDebe,
    SUM(d.Haber) AS TotalHaber,
    SUM(d.Debe - d.Haber) AS Saldo
FROM cont_asientos a
JOIN cont_asientos_detalle d ON a.IdAsiento = d.IdAsiento
JOIN param_cuentas c ON d.IdCuenta = c.IdCuenta
GROUP BY
    c.CodigoCuenta,
    c.NombreCuenta,
    CAST(strftime('%Y', a.Fecha) AS INTEGER),
    CAST(strftime('%m', a.Fecha) AS INTEGER);

CREATE VIEW v_conta_ResultadoPorLineaProducto AS
SELECT
    lp.Nombre AS LineaProducto,
    CAST(strftime('%Y', a.Fecha) AS INTEGER) AS Anio,
    CAST(strftime('%m', a.Fecha) AS INTEGER) AS Mes,
    SUM(CASE WHEN c.Tipo = 'Ingreso' THEN d.Haber - d.Debe ELSE 0 END) AS Ingresos,
    SUM(CASE WHEN c.Tipo = 'Gasto' THEN d.Debe - d.Haber ELSE 0 END) AS Gastos,
    SUM(
        CASE
            WHEN c.Tipo = 'Ingreso' THEN d.Haber - d.Debe
            WHEN c.Tipo = 'Gasto' THEN d.Debe - d.Haber
            ELSE 0
        END
    ) AS Resultado
FROM cont_asientos a
JOIN cont_asientos_detalle d ON a.IdAsiento = d.IdAsiento
JOIN param_cuentas c ON d.IdCuenta = c.IdCuenta
LEFT JOIN param_lineas_producto lp ON d.IdLineaProducto = lp.IdLineaProducto
GROUP BY
    lp.Nombre,
    CAST(strftime('%Y', a.Fecha) AS INTEGER),
    CAST(strftime('%m', a.Fecha) AS INTEGER);
