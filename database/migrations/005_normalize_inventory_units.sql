-- Normaliza unidades de inventario y agrega los datos necesarios para pago diferido.

UPDATE insumos
SET unit = CASE
    WHEN LOWER(unit) IN ('pieza', 'piezas', 'pz', 'unidad', 'unidades') THEN 'pieza'
    WHEN LOWER(unit) IN ('gramo', 'gramos', 'g') THEN 'g'
    WHEN LOWER(unit) IN ('mililitro', 'mililitros', 'ml') THEN 'ml'
    ELSE unit
END;

ALTER TABLE insumos
    DROP CONSTRAINT IF EXISTS insumos_unit_check;

ALTER TABLE insumos
    ADD CONSTRAINT insumos_unit_check
    CHECK (unit IN ('g', 'ml', 'pieza'));

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE inventory_movements
    ALTER COLUMN ingredient_id DROP NOT NULL;

COMMENT ON COLUMN orders.paid_at IS
    'Momento en que la orden PENDING fue pagada.';

COMMENT ON COLUMN inventory_movements.ingredient_id IS
    'Legado: las nuevas operaciones usan insumo_id.';
