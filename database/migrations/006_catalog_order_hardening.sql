ALTER TABLE product_modifiers
    ADD COLUMN IF NOT EXISTS min_selections INTEGER NOT NULL DEFAULT 0;

ALTER TABLE product_modifiers
    DROP CONSTRAINT IF EXISTS product_modifiers_min_selections_check;

ALTER TABLE product_modifiers
    ADD CONSTRAINT product_modifiers_min_selections_check
    CHECK (min_selections >= 0 AND min_selections <= max_selections);

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS is_kds_visible BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE order_items
SET is_kds_visible = (kds_status <> 'NOT_REQUIRED')
WHERE is_kds_visible = FALSE;

CREATE INDEX IF NOT EXISTS combo_items_component_idx
    ON combo_items (combo_product_id, component_product_id);
