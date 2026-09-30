-- Sesiones de renta persistentes para el módulo de cronómetros.

CREATE TABLE sesiones_tiempo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consola_id UUID NOT NULL REFERENCES consoles(id),
    tipo_renta TEXT NOT NULL CHECK (tipo_renta IN ('LIBRE', 'FIJO')),
    estado TEXT NOT NULL DEFAULT 'ACTIVA'
        CHECK (estado IN ('ACTIVA', 'PAUSADA', 'FINALIZADA', 'CANCELADA')),
    timestamp_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    timestamp_fin TIMESTAMPTZ,
    timestamp_pausa TIMESTAMPTZ,
    timestamp_finalizacion TIMESTAMPTZ,
    segundos_acumulados INTEGER NOT NULL DEFAULT 0 CHECK (segundos_acumulados >= 0),
    duracion_segundos INTEGER CHECK (duracion_segundos IS NULL OR duracion_segundos > 0),
    precio_por_hora NUMERIC(12, 2) NOT NULL CHECK (precio_por_hora >= 0),
    monto_total NUMERIC(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (tipo_renta = 'LIBRE' AND duracion_segundos IS NULL AND timestamp_fin IS NULL)
        OR
        (tipo_renta = 'FIJO' AND duracion_segundos IS NOT NULL AND timestamp_fin IS NOT NULL)
    ),
    CHECK (timestamp_fin IS NULL OR timestamp_fin > timestamp_inicio),
    CHECK (timestamp_finalizacion IS NULL OR timestamp_finalizacion >= timestamp_inicio)
);

CREATE UNIQUE INDEX one_open_time_session_per_console
    ON sesiones_tiempo (consola_id)
    WHERE estado IN ('ACTIVA', 'PAUSADA');

CREATE INDEX time_sessions_status_idx
    ON sesiones_tiempo (estado);

CREATE INDEX fixed_active_sessions_end_idx
    ON sesiones_tiempo (timestamp_fin)
    WHERE estado = 'ACTIVA' AND tipo_renta = 'FIJO';

CREATE TRIGGER sesiones_tiempo_set_updated_at
    BEFORE UPDATE ON sesiones_tiempo
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
