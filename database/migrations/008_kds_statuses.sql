-- Estados operativos del KDS: PENDING -> PREPARING -> READY.

ALTER TABLE order_items
    DROP CONSTRAINT IF EXISTS order_items_kds_status_check;

UPDATE order_items
SET kds_status = 'PREPARING'
WHERE kds_status = 'IN_PREPARATION';

ALTER TABLE order_items
    ADD CONSTRAINT order_items_kds_status_check
    CHECK (kds_status IN ('NOT_REQUIRED', 'PENDING', 'PREPARING', 'READY', 'DELIVERED'));
