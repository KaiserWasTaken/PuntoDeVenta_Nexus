-- Refuerza el flujo PENDING -> pago y normaliza unidades de inventario.

UPDATE insumos
SET unit = 'pieza'
WHERE LOWER(unit) IN ('piezas', 'pz', 'unidades', 'unidad');

ALTER TABLE insumos
    DROP CONSTRAINT IF EXISTS insumos_unit_check;

ALTER TABLE insumos
    ADD CONSTRAINT insumos_unit_check
    CHECK (unit IN ('g', 'ml', 'pieza'));

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Las órdenes pendientes deben poder existir sin método de pago.
ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_pending_payment_check;

ALTER TABLE orders
    ADD CONSTRAINT orders_pending_payment_check
    CHECK (
      (status = 'PENDING' AND payment_method IS NULL)
      OR
      (status <> 'PENDING' AND payment_method IN ('CASH', 'CARD'))
    );

-- Permite asociar insumos opcionales a una opción de modificador.
CREATE TABLE IF NOT EXISTS modifier_option_recipes (
    modifier_option_id UUID NOT NULL REFERENCES modifier_options(id) ON DELETE CASCADE,
    insumo_id UUID NOT NULL REFERENCES insumos(id),
    quantity NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (modifier_option_id, insumo_id)
);
