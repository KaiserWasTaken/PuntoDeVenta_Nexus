-- Nexus POS: catálogo, órdenes/KDS, tarifas de renta y cierres diarios.
-- Compatible con las tablas provisionales 001 y 002.

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (category_id, name)
);

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id),
    ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id),
    ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;

CREATE TABLE product_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    max_selections INTEGER NOT NULL DEFAULT 1 CHECK (max_selections > 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE modifier_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modifier_id UUID NOT NULL REFERENCES product_modifiers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_delta NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (modifier_id, name)
);

CREATE TABLE combo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    component_product_id UUID REFERENCES products(id),
    component_type TEXT NOT NULL CHECK (component_type IN ('PRODUCT', 'RENTAL')),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    CHECK (
        (component_type = 'PRODUCT' AND component_product_id IS NOT NULL)
        OR component_type = 'RENTAL'
    )
);

CREATE TABLE rental_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    min_minutes INTEGER NOT NULL CHECK (min_minutes >= 0),
    max_minutes INTEGER,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    block_minutes INTEGER CHECK (block_minutes IS NULL OR block_minutes > 0),
    block_price NUMERIC(12, 2) CHECK (block_price IS NULL OR block_price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED')),
    payment_method TEXT CHECK (payment_method IN ('CASH', 'CARD')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    daily_report_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMPTZ
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    rental_session_id UUID REFERENCES sesiones_tiempo(id),
    parent_item_id UUID REFERENCES order_items(id),
    item_type TEXT NOT NULL CHECK (item_type IN ('PRODUCT', 'COMBO', 'COMBO_COMPONENT', 'RENTAL', 'RENTAL_EXTENSION')),
    name_snapshot TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
    kds_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED'
        CHECK (kds_status IN ('NOT_REQUIRED', 'PENDING', 'IN_PREPARATION', 'READY', 'DELIVERED')),
    modifiers JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (product_id IS NOT NULL OR rental_session_id IS NOT NULL)
);

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS expense_type TEXT NOT NULL DEFAULT 'BUSINESS'
        CHECK (expense_type IN ('BUSINESS', 'PERSONAL')),
    ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'CASH'
        CHECK (payment_method IN ('CASH', 'CREDIT', 'DEBIT')),
    ADD COLUMN IF NOT EXISTS daily_report_id UUID;

CREATE TABLE daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL UNIQUE,
    total_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_profit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cash_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
    card_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    closed_by UUID REFERENCES users(id),
    closed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders
    ADD CONSTRAINT orders_daily_report_fk
    FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id);

ALTER TABLE expenses
    ADD CONSTRAINT expenses_daily_report_fk
    FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id);

CREATE TABLE insumos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL,
    current_quantity NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
    minimum_quantity NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (minimum_quantity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    insumo_id UUID NOT NULL REFERENCES insumos(id),
    quantity NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
    UNIQUE (product_id, insumo_id)
);

CREATE INDEX orders_status_created_idx ON orders (status, created_at);
CREATE INDEX order_items_kds_idx ON order_items (kds_status, order_id);
CREATE INDEX expenses_open_idx ON expenses (daily_report_id) WHERE daily_report_id IS NULL;
CREATE INDEX combo_items_combo_idx ON combo_items (combo_product_id, sort_order);

INSERT INTO categories (name, sort_order) VALUES
    ('Bebidas', 1),
    ('Comidas', 2),
    ('Combos', 3)
ON CONFLICT (name) DO NOTHING;

INSERT INTO rental_tariffs (label, min_minutes, max_minutes, price)
VALUES
    ('Hasta 30 minutos', 0, 30, 25),
    ('De 31 a 60 minutos', 31, 60, 35)
ON CONFLICT DO NOTHING;

INSERT INTO consoles (name, status, hourly_rate)
VALUES
    ('Switch 1', 'available', 35),
    ('Switch 2', 'available', 35),
    ('Xbox A', 'available', 35),
    ('Xbox B', 'available', 35),
    ('Xbox C', 'available', 35),
    ('Xbox D', 'available', 35),
    ('PS5', 'available', 35)
ON CONFLICT (name) DO NOTHING;
