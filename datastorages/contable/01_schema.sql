PRAGMA foreign_keys = ON;

-- =========================
-- DROP EN ORDEN PARA RE-EJECUCION SEGURA
-- =========================

DROP TABLE IF EXISTS cont_asientos_detalle;
DROP TABLE IF EXISTS cont_asientos;
DROP TABLE IF EXISTS proc_ventas;
DROP TABLE IF EXISTS proc_ventas_flujo;
DROP TABLE IF EXISTS proc_compras_flujo;
DROP TABLE IF EXISTS proc_caja_chica_flujo;
DROP TABLE IF EXISTS param_clientes;
DROP TABLE IF EXISTS param_lineas_producto;
DROP TABLE IF EXISTS param_centros_costo;
DROP TABLE IF EXISTS param_cuentas;

-- =========================
-- PARAMETROS / MAESTROS
-- =========================

CREATE TABLE param_cuentas (
    IdCuenta         INTEGER PRIMARY KEY AUTOINCREMENT,
    CodigoCuenta     TEXT NOT NULL UNIQUE,
    NombreCuenta     TEXT NOT NULL,
    Tipo             TEXT NOT NULL,
    Subtipo          TEXT,
    Naturaleza       TEXT NOT NULL,
    AfectaRLI        INTEGER NOT NULL DEFAULT 1 CHECK (AfectaRLI IN (0, 1)),
    AfectaIVA        INTEGER NOT NULL DEFAULT 0 CHECK (AfectaIVA IN (0, 1))
);

CREATE TABLE param_centros_costo (
    IdCentroCosto    INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre           TEXT NOT NULL,
    Descripcion      TEXT
);

CREATE TABLE param_lineas_producto (
    IdLineaProducto  INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre           TEXT NOT NULL,
    TipoServicio     TEXT NOT NULL,
    Observaciones    TEXT
);

CREATE TABLE param_clientes (
    IdCliente        INTEGER PRIMARY KEY AUTOINCREMENT,
    RUT              TEXT NOT NULL,
    RazonSocial      TEXT NOT NULL,
    Giro             TEXT,
    Direccion        TEXT,
    Ciudad           TEXT,
    Email            TEXT
);

-- =========================
-- PROCESO
-- =========================

CREATE TABLE proc_ventas (
    IdVenta          INTEGER PRIMARY KEY AUTOINCREMENT,
    Fecha            TEXT NOT NULL,
    TipoDocumento    TEXT NOT NULL,
    Folio            TEXT NOT NULL,
    IdCliente        INTEGER NOT NULL,
    IdLineaProducto  INTEGER NOT NULL,
    IdCentroCosto    INTEGER,
    Descripcion      TEXT,
    Neto             NUMERIC NOT NULL,
    IVA              NUMERIC NOT NULL,
    Exento           NUMERIC NOT NULL DEFAULT 0,
    Total            NUMERIC GENERATED ALWAYS AS (Neto + IVA + Exento) STORED,
    FOREIGN KEY (IdCliente) REFERENCES param_clientes(IdCliente),
    FOREIGN KEY (IdLineaProducto) REFERENCES param_lineas_producto(IdLineaProducto),
    FOREIGN KEY (IdCentroCosto) REFERENCES param_centros_costo(IdCentroCosto)
);

CREATE TABLE proc_ventas_flujo (
    IdVenta            INTEGER PRIMARY KEY AUTOINCREMENT,
    Fecha              TEXT NOT NULL,
    TipoDocumento      TEXT NOT NULL,
    Folio              TEXT,
    IdCliente          INTEGER,
    IdLineaProducto    INTEGER,
    IdCentroCosto      INTEGER,
    Descripcion        TEXT,
    Neto               NUMERIC,
    IVA                NUMERIC,
    Exento             NUMERIC,
    Total              NUMERIC,
    CuentaIngreso      INTEGER,
    CuentaIVA          INTEGER,
    CuentaRecaudacion  INTEGER,
    FOREIGN KEY (IdCliente) REFERENCES param_clientes(IdCliente),
    FOREIGN KEY (IdLineaProducto) REFERENCES param_lineas_producto(IdLineaProducto),
    FOREIGN KEY (IdCentroCosto) REFERENCES param_centros_costo(IdCentroCosto),
    FOREIGN KEY (CuentaIngreso) REFERENCES param_cuentas(IdCuenta),
    FOREIGN KEY (CuentaIVA) REFERENCES param_cuentas(IdCuenta),
    FOREIGN KEY (CuentaRecaudacion) REFERENCES param_cuentas(IdCuenta)
);

CREATE TABLE proc_compras_flujo (
    IdCompra         INTEGER PRIMARY KEY AUTOINCREMENT,
    Fecha            TEXT NOT NULL,
    TipoDocumento    TEXT,
    Folio            TEXT,
    Proveedor        TEXT,
    Descripcion      TEXT,
    Neto             NUMERIC,
    IVA              NUMERIC,
    Exento           NUMERIC,
    Total            NUMERIC,
    CuentaContable   INTEGER,
    IdCentroCosto    INTEGER,
    FOREIGN KEY (CuentaContable) REFERENCES param_cuentas(IdCuenta),
    FOREIGN KEY (IdCentroCosto) REFERENCES param_centros_costo(IdCentroCosto)
);

CREATE TABLE proc_caja_chica_flujo (
    IdMovimiento     INTEGER PRIMARY KEY AUTOINCREMENT,
    Fecha            TEXT,
    TipoMovimiento   TEXT,
    Descripcion      TEXT,
    Monto            NUMERIC,
    CuentaGasto      INTEGER,
    FOREIGN KEY (CuentaGasto) REFERENCES param_cuentas(IdCuenta)
);

-- =========================
-- CONTABLE
-- =========================

CREATE TABLE cont_asientos (
    IdAsiento        INTEGER PRIMARY KEY AUTOINCREMENT,
    Fecha            TEXT NOT NULL,
    NumeroAsiento    INTEGER NOT NULL,
    Descripcion      TEXT
);

CREATE TABLE cont_asientos_detalle (
    IdAsientoDetalle INTEGER PRIMARY KEY AUTOINCREMENT,
    IdAsiento        INTEGER NOT NULL,
    IdCuenta         INTEGER NOT NULL,
    Debe             NUMERIC NOT NULL DEFAULT 0,
    Haber            NUMERIC NOT NULL DEFAULT 0,
    IdCentroCosto    INTEGER,
    IdLineaProducto  INTEGER,
    Referencia       TEXT,
    FOREIGN KEY (IdAsiento) REFERENCES cont_asientos(IdAsiento),
    FOREIGN KEY (IdCuenta) REFERENCES param_cuentas(IdCuenta),
    FOREIGN KEY (IdCentroCosto) REFERENCES param_centros_costo(IdCentroCosto),
    FOREIGN KEY (IdLineaProducto) REFERENCES param_lineas_producto(IdLineaProducto)
);

-- =========================
-- INDICES
-- =========================

CREATE INDEX idx_proc_ventas_fecha ON proc_ventas(Fecha DESC);
CREATE INDEX idx_proc_ventas_cliente ON proc_ventas(IdCliente);

CREATE INDEX idx_proc_ventas_flujo_fecha ON proc_ventas_flujo(Fecha DESC);
CREATE INDEX idx_proc_compras_flujo_fecha ON proc_compras_flujo(Fecha DESC);
CREATE INDEX idx_proc_caja_chica_flujo_fecha ON proc_caja_chica_flujo(Fecha DESC);

CREATE UNIQUE INDEX idx_cont_asientos_numero ON cont_asientos(NumeroAsiento);
CREATE INDEX idx_cont_asientos_fecha ON cont_asientos(Fecha DESC);
CREATE INDEX idx_cont_asientos_detalle_asiento ON cont_asientos_detalle(IdAsiento);
CREATE INDEX idx_cont_asientos_detalle_cuenta ON cont_asientos_detalle(IdCuenta);
