-- PuntoDeVenta Nexus - esquema provisional inicial
-- Aplicar después de crear la base de datos "puntoventa_nexus_dev".
-- Las futuras modificaciones deben agregarse en nuevas migraciones numeradas.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
CREATE TYPE console_status AS ENUM ('available', 'occupied', 'reserved', 'maintenance', 'inactive');
CREATE TYPE session_type AS ENUM ('open', 'fixed');
CREATE TYPE session_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled', 'completed');
CREATE TYPE product_type AS ENUM ('individual', 'combo');
CREATE TYPE sale_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE inventory_movement_type AS ENUM ('purchase', 'sale', 'adjustment', 'waste', 'return');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE consoles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    status console_status NOT NULL DEFAULT 'available',
    hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE console_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    console_id UUID NOT NULL REFERENCES consoles(id),
    started_by UUID REFERENCES users(id),
    ended_by UUID REFERENCES users(id),
    session_type session_type NOT NULL,
    status session_status NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_end_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (expected_end_at IS NULL OR expected_end_at > started_at),
    CHECK (ended_at IS NULL OR ended_at >= started_at),
    CHECK (session_type = 'open' OR expected_end_at IS NOT NULL)
);

CREATE UNIQUE INDEX one_active_session_per_console
    ON console_sessions (console_id)
    WHERE status IN ('active', 'paused');

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    console_id UUID REFERENCES consoles(id),
    requested_start_at TIMESTAMPTZ NOT NULL,
    requested_end_at TIMESTAMPTZ NOT NULL,
    status reservation_status NOT NULL DEFAULT 'pending',
    handled_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (requested_end_at > requested_start_at)
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    product_type product_type NOT NULL DEFAULT 'individual',
    sale_price NUMERIC(12, 2) NOT NULL CHECK (sale_price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL,
    current_quantity NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
    minimum_quantity NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (minimum_quantity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipe_items (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    quantity NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (product_id, ingredient_id)
);

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sold_by UUID REFERENCES users(id),
    status sale_status NOT NULL DEFAULT 'pending',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    sale_id UUID REFERENCES sales(id),
    created_by UUID REFERENCES users(id),
    movement_type inventory_movement_type NOT NULL,
    quantity NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    registered_by UUID REFERENCES users(id),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX console_sessions_console_started_idx
    ON console_sessions (console_id, started_at DESC);

CREATE INDEX reservations_status_start_idx
    ON reservations (status, requested_start_at);

CREATE INDEX inventory_movements_ingredient_created_idx
    ON inventory_movements (ingredient_id, created_at DESC);

CREATE INDEX expenses_date_idx
    ON expenses (expense_date);

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER consoles_set_updated_at
    BEFORE UPDATE ON consoles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER reservations_set_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER products_set_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER ingredients_set_updated_at
    BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
