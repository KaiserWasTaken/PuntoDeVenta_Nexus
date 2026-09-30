-- Consolidación de inventario:
-- insumos/recipes es el modelo canónico de Nexus POS.
-- Las tablas ingredients/recipe_items se conservan temporalmente para
-- compatibilidad y no deben recibir nuevas escrituras.

INSERT INTO insumos (id, name, unit, current_quantity, minimum_quantity, is_active, created_at)
SELECT id, name, unit, current_quantity, minimum_quantity, is_active, created_at
FROM ingredients
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    unit = EXCLUDED.unit,
    current_quantity = EXCLUDED.current_quantity,
    minimum_quantity = EXCLUDED.minimum_quantity,
    is_active = EXCLUDED.is_active;

INSERT INTO recipes (product_id, insumo_id, quantity)
SELECT recipe_items.product_id, recipe_items.ingredient_id, recipe_items.quantity
FROM recipe_items
ON CONFLICT (product_id, insumo_id) DO UPDATE
SET quantity = EXCLUDED.quantity;

ALTER TABLE inventory_movements
    ADD COLUMN IF NOT EXISTS insumo_id UUID REFERENCES insumos(id);

UPDATE inventory_movements movements
SET insumo_id = movements.ingredient_id
WHERE movements.insumo_id IS NULL;

ALTER TABLE inventory_movements
    ALTER COLUMN insumo_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS inventory_movements_insumo_created_idx
    ON inventory_movements (insumo_id, created_at DESC);

COMMENT ON TABLE ingredients IS
    'Deprecated: use insumos. Retained temporarily for migration compatibility.';

COMMENT ON TABLE recipe_items IS
    'Deprecated: use recipes. Retained temporarily for migration compatibility.';

COMMENT ON COLUMN inventory_movements.ingredient_id IS
    'Deprecated: use insumo_id for new writes.';
