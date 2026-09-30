-- Las rentas y sus extensiones nunca deben aparecer en el KDS.
UPDATE order_items
SET is_kds_visible = FALSE,
    kds_status = 'NOT_REQUIRED'
WHERE item_type IN ('RENTAL', 'RENTAL_EXTENSION')
   OR rental_session_id IS NOT NULL;

ALTER TABLE order_items
    DROP CONSTRAINT IF EXISTS order_items_rental_kds_check;

ALTER TABLE order_items
    ADD CONSTRAINT order_items_rental_kds_check
    CHECK (
      (item_type NOT IN ('RENTAL', 'RENTAL_EXTENSION') AND rental_session_id IS NULL)
      OR
      (is_kds_visible = FALSE AND kds_status = 'NOT_REQUIRED')
    );
