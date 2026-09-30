-- Catálogo inicial Nexus POS, modificadores y combos.
-- Idempotente: puede ejecutarse más de una vez sin duplicar registros.

ALTER TABLE product_modifiers
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS product_modifiers_product_name_idx
    ON product_modifiers (product_id, name);

-- Limpia datos de pruebas y duplicados generados por una carga con codificación incorrecta.
UPDATE products
SET is_active = FALSE
WHERE lower(name) = 'sdasdas' OR name LIKE '%Ã%' OR name LIKE '%Â%';

DELETE FROM product_modifiers
WHERE name LIKE '%Ã%' OR name LIKE '%Â%' OR name LIKE '%·%'
   OR (name LIKE 'Banderilla %' AND name NOT LIKE '% · %')
   OR encode(convert_to(name, 'UTF8'), 'hex') LIKE '%efbfbd%';

DELETE FROM product_modifiers duplicate
USING product_modifiers keeper
WHERE duplicate.product_id = keeper.product_id
  AND duplicate.name = keeper.name
  AND duplicate.ctid > keeper.ctid;

INSERT INTO categories (name, sort_order)
VALUES
    ('Bebidas', 1),
    ('Comidas', 2),
    ('Combos', 3)
ON CONFLICT (name) DO UPDATE SET is_active = TRUE;

INSERT INTO subcategories (category_id, name, sort_order)
SELECT c.id, source.name, source.sort_order
FROM categories c
JOIN (VALUES
    ('Bebidas', 'Bubble Tea Base Leche', 1),
    ('Bebidas', 'Bubble Tea Base Agua', 2),
    ('Bebidas', 'Soda Italiana', 3),
    ('Bebidas', 'Tisana', 4),
    ('Bebidas', 'Chamoyada', 5),
    ('Bebidas', 'Otros', 6),
    ('Comidas', 'Nexuleta', 1),
    ('Comidas', 'Nachos', 2),
    ('Comidas', 'Mini Hot Cakes', 3),
    ('Comidas', 'Palomitas', 4),
    ('Comidas', 'Maruchan', 5),
    ('Comidas', 'Otros Snacks', 6),
    ('Combos', 'Combo', 1)
) AS source(category_name, name, sort_order) ON source.category_name = c.name
ON CONFLICT (category_id, name) DO UPDATE SET is_active = TRUE;

INSERT INTO products (name, product_type, sale_price, category_id, subcategory_id)
SELECT source.name, source.product_type::product_type, source.sale_price,
       c.id, s.id
FROM (VALUES
    ('Bubble Tea Taro Purple', 'individual', 75, 'Bebidas', 'Bubble Tea Base Leche'),
    ('Bubble Tea Oreo', 'individual', 75, 'Bebidas', 'Bubble Tea Base Leche'),
    ('Bubble Tea Matcha', 'individual', 75, 'Bebidas', 'Bubble Tea Base Leche'),
    ('Bubble Tea Fresas con crema', 'individual', 75, 'Bebidas', 'Bubble Tea Base Leche'),
    ('Bubble Tea Horchata', 'individual', 75, 'Bebidas', 'Bubble Tea Base Leche'),
    ('Bubble Tea Mazapán', 'individual', 75, 'Bebidas', 'Bubble Tea Base Leche'),
    ('Bubble Tea Ferrero', 'individual', 75, 'Bebidas', 'Bubble Tea Base Leche'),
    ('Bubble Tea Mora Azul', 'individual', 75, 'Bebidas', 'Bubble Tea Base Leche'),
    ('Bubble Tea Algodón de Azúcar', 'individual', 75, 'Bebidas', 'Bubble Tea Base Leche'),
    ('Bubble Tea Red Velvet', 'individual', 75, 'Bebidas', 'Bubble Tea Base Leche'),
    ('Bubble Tea Moka Intenso', 'individual', 75, 'Bebidas', 'Bubble Tea Base Leche'),
    ('Bubble Tea Turin', 'individual', 75, 'Bebidas', 'Bubble Tea Base Leche'),
    ('Bubble Tea Pepino Limón', 'individual', 75, 'Bebidas', 'Bubble Tea Base Agua'),
    ('Bubble Tea Frutos Rojos', 'individual', 75, 'Bebidas', 'Bubble Tea Base Agua'),
    ('Bubble Tea Fresa Sandía', 'individual', 75, 'Bebidas', 'Bubble Tea Base Agua'),
    ('Bubble Tea Frambuesa', 'individual', 75, 'Bebidas', 'Bubble Tea Base Agua'),
    ('Soda Italiana Berries', 'individual', 60, 'Bebidas', 'Soda Italiana'),
    ('Soda Italiana Blueberry', 'individual', 60, 'Bebidas', 'Soda Italiana'),
    ('Soda Italiana Maracuyá', 'individual', 60, 'Bebidas', 'Soda Italiana'),
    ('Soda Italiana Manzana Verde', 'individual', 60, 'Bebidas', 'Soda Italiana'),
    ('Soda Italiana Fruta del Dragón', 'individual', 60, 'Bebidas', 'Soda Italiana'),
    ('Tisana Pasión y Pétalos', 'individual', 60, 'Bebidas', 'Tisana'),
    ('Tisana Arándano / Fresa / Pétalos de rosa', 'individual', 60, 'Bebidas', 'Tisana'),
    ('Tisana Dulce Legado', 'individual', 60, 'Bebidas', 'Tisana'),
    ('Tisana Guayaba / Canela', 'individual', 60, 'Bebidas', 'Tisana'),
    ('Tisana Frutos Reales', 'individual', 60, 'Bebidas', 'Tisana'),
    ('Tisana Piña / Durazno / Mango', 'individual', 60, 'Bebidas', 'Tisana'),
    ('Chamoyada Tamarindo', 'individual', 60, 'Bebidas', 'Chamoyada'),
    ('Chamoyada Mango', 'individual', 60, 'Bebidas', 'Chamoyada'),
    ('Chamoyada Fresa', 'individual', 60, 'Bebidas', 'Chamoyada'),
    ('Chamoyada Pelón pelo rico', 'individual', 60, 'Bebidas', 'Chamoyada'),
    ('Refresco 355ml', 'individual', 20, 'Bebidas', 'Otros'),
    ('Agua Embotellada', 'individual', 20, 'Bebidas', 'Otros'),
    ('Café Americano', 'individual', 30, 'Bebidas', 'Otros'),
    ('Nexuleta 1 pieza', 'individual', 40, 'Comidas', 'Nexuleta'),
    ('Nexuleta 2 piezas', 'individual', 70, 'Comidas', 'Nexuleta'),
    ('Nexuleta 3 piezas', 'individual', 110, 'Comidas', 'Nexuleta'),
    ('Nachos', 'individual', 55, 'Comidas', 'Nachos'),
    ('12 Mini Hot Cakes', 'individual', 55, 'Comidas', 'Mini Hot Cakes'),
    ('24 Mini Hot Cakes', 'individual', 100, 'Comidas', 'Mini Hot Cakes'),
    ('Palomitas Chicas', 'individual', 25, 'Comidas', 'Palomitas'),
    ('Palomitas Medianas', 'individual', 45, 'Comidas', 'Palomitas'),
    ('Maruchan', 'individual', 30, 'Comidas', 'Maruchan'),
    ('Combo Nachos', 'combo', 210, 'Combos', 'Combo'),
    ('Nexus Duo', 'combo', 200, 'Combos', 'Combo'),
    ('Nexus de Compas', 'combo', 285, 'Combos', 'Combo'),
    ('Combo Nachos XL', 'combo', 275, 'Combos', 'Combo'),
    ('Nexus Squad', 'combo', 360, 'Combos', 'Combo'),
    ('Nexus Lovers', 'combo', 220, 'Combos', 'Combo'),
    ('Pa k Compartas', 'combo', 265, 'Combos', 'Combo'),
    ('Nexuletas pah Todos', 'combo', 200, 'Combos', 'Combo'),
    ('Nachos de Compas', 'combo', 175, 'Combos', 'Combo')
) AS source(name, product_type, sale_price, category_name, subcategory_name)
JOIN categories c ON c.name = source.category_name
JOIN subcategories s ON s.category_id = c.id AND s.name = source.subcategory_name
ON CONFLICT (name) DO UPDATE SET
    product_type = EXCLUDED.product_type,
    sale_price = EXCLUDED.sale_price,
    category_id = EXCLUDED.category_id,
    subcategory_id = EXCLUDED.subcategory_id,
    is_active = TRUE;

DO $$
DECLARE
    v_product_id UUID;
    v_modifier_id UUID;
BEGIN
    -- Bases de bebidas.
    FOR v_product_id IN
        SELECT p.id
        FROM products p
        JOIN subcategories s ON s.id = p.subcategory_id
        WHERE s.name IN ('Bubble Tea Base Leche', 'Bubble Tea Base Agua')
    LOOP
        INSERT INTO product_modifiers (product_id, name, required, min_selections, max_selections, sort_order, metadata)
        VALUES (v_product_id, 'Base', TRUE, 1, 1, 1, '{"default_option":"Tapioca"}')
        ON CONFLICT DO NOTHING;
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Base';
        INSERT INTO modifier_options (modifier_id, name, price_delta)
        VALUES (v_modifier_id, 'Tapioca', 0), (v_modifier_id, 'Perlas', 0)
        ON CONFLICT (modifier_id, name) DO NOTHING;

        INSERT INTO product_modifiers (product_id, name, required, min_selections, max_selections, sort_order)
        VALUES (v_product_id, 'Extras', FALSE, 0, 2, 2)
        ON CONFLICT DO NOTHING;
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Extras';
        INSERT INTO modifier_options (modifier_id, name, price_delta)
        VALUES (v_modifier_id, 'Extra Tapioca', 10), (v_modifier_id, 'Extra Perlas', 10)
        ON CONFLICT (modifier_id, name) DO NOTHING;
    END LOOP;

    -- Soda italiana: base fija parametrizada como grupo informativo.
    FOR v_product_id IN SELECT p.id FROM products p JOIN subcategories s ON s.id = p.subcategory_id WHERE s.name = 'Soda Italiana' LOOP
        INSERT INTO product_modifiers (product_id, name, required, min_selections, max_selections, sort_order, metadata)
        VALUES (v_product_id, 'Base fija', TRUE, 1, 1, 1, '{"fixed":true,"default_option":"Perlas explosivas"}')
        ON CONFLICT DO NOTHING;
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Base fija';
        INSERT INTO modifier_options (modifier_id, name, price_delta)
        VALUES (v_modifier_id, 'Perlas explosivas', 0)
        ON CONFLICT (modifier_id, name) DO NOTHING;
    END LOOP;

    -- Tisana.
    FOR v_product_id IN SELECT p.id FROM products p JOIN subcategories s ON s.id = p.subcategory_id WHERE s.name = 'Tisana' LOOP
        INSERT INTO product_modifiers (product_id, name, required, min_selections, max_selections, sort_order)
        VALUES (v_product_id, 'Preparación', TRUE, 1, 1, 1)
        ON CONFLICT DO NOTHING;
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Preparación';
        INSERT INTO modifier_options (modifier_id, name, price_delta)
        VALUES (v_modifier_id, 'Frío', 0), (v_modifier_id, 'Caliente', 0), (v_modifier_id, 'Frappeado', 0)
        ON CONFLICT (modifier_id, name) DO NOTHING;
    END LOOP;

    -- Chamoyadas, aderezos incluidos seleccionables hasta cuatro.
    FOR v_product_id IN SELECT p.id FROM products p JOIN subcategories s ON s.id = p.subcategory_id WHERE s.name = 'Chamoyada' LOOP
        INSERT INTO product_modifiers (product_id, name, required, min_selections, max_selections, sort_order, metadata)
        VALUES (v_product_id, 'Base', TRUE, 1, 1, 1, '{"default_option":"Tapioca"}')
        ON CONFLICT DO NOTHING;
        UPDATE product_modifiers
        SET required = TRUE, min_selections = 1, max_selections = 1,
            metadata = '{"default_option":"Tapioca"}'::jsonb
        WHERE product_modifiers.product_id = v_product_id AND name = 'Base';
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Base';
        INSERT INTO modifier_options (modifier_id, name, price_delta)
        VALUES (v_modifier_id, 'Tapioca', 0), (v_modifier_id, 'Perlas', 0)
        ON CONFLICT (modifier_id, name) DO NOTHING;

        INSERT INTO product_modifiers (product_id, name, required, min_selections, max_selections, sort_order, metadata)
        VALUES (v_product_id, 'Aderezos gratis', FALSE, 0, 4, 2, '{"default_options":["Chile","Chamoy","Tajín","Miguelito"]}')
        ON CONFLICT DO NOTHING;
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Aderezos gratis';
        UPDATE product_modifiers
        SET metadata = '{"default_options":["Chile","Chamoy","Tajín","Miguelito"]}'::jsonb
        WHERE product_modifiers.product_id = v_product_id AND name = 'Aderezos gratis';
        INSERT INTO modifier_options (modifier_id, name, price_delta)
        VALUES (v_modifier_id, 'Chile', 0), (v_modifier_id, 'Chamoy', 0), (v_modifier_id, 'Tajín', 0), (v_modifier_id, 'Miguelito', 0)
        ON CONFLICT (modifier_id, name) DO NOTHING;
    END LOOP;

    -- Mini hot cakes: el recargo de tercer topping se calcula en backend.
    FOR v_product_id IN SELECT p.id FROM products p JOIN subcategories s ON s.id = p.subcategory_id WHERE s.name = 'Mini Hot Cakes' LOOP
        INSERT INTO product_modifiers (product_id, name, required, min_selections, max_selections, sort_order, metadata)
        VALUES (v_product_id, 'Jarabe', TRUE, 1, 1, 1, '{"default_option":"Maple"}'),
               (v_product_id, 'Toppings', FALSE, 0, 10, 2, '{"included_selections":2,"extra_price":5}')
        ON CONFLICT DO NOTHING;
        UPDATE product_modifiers
        SET required = TRUE, min_selections = 1, max_selections = 6,
            metadata = '{"default_option":"Maple","included_selections":1,"extra_price":5}'::jsonb
        WHERE product_modifiers.product_id = v_product_id AND name = 'Jarabe';
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Jarabe';
        INSERT INTO modifier_options (modifier_id, name, price_delta)
        VALUES (v_modifier_id, 'Maple', 0), (v_modifier_id, 'Caramelo', 0), (v_modifier_id, 'Nutella', 0),
               (v_modifier_id, 'Lechera', 0), (v_modifier_id, 'Cajeta', 0), (v_modifier_id, 'Ninguno', 0)
        ON CONFLICT (modifier_id, name) DO NOTHING;
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Toppings';
        INSERT INTO modifier_options (modifier_id, name, price_delta)
        SELECT v_modifier_id, option_name, 0
        FROM unnest(ARRAY['Mazapán','Confeti','Chispas Chocolate','Oreo','Nuez','Almendras','Arándano','M&Ms','Bombones','Coco Rallado']) AS option_name
        ON CONFLICT (modifier_id, name) DO NOTHING;
    END LOOP;

    -- Nexuletas: un grupo por banderilla y regla global de queso derretido.
    FOR v_product_id IN SELECT p.id FROM products p JOIN subcategories s ON s.id = p.subcategory_id WHERE s.name = 'Nexuleta' LOOP
        FOR v_modifier_id IN 1..(
            CASE WHEN v_product_id IN (SELECT id FROM products WHERE name = 'Nexuleta 1 pieza') THEN 1
                 WHEN v_product_id IN (SELECT id FROM products WHERE name = 'Nexuleta 2 piezas') THEN 2 ELSE 3 END
        ) LOOP
            INSERT INTO product_modifiers (product_id, name, required, min_selections, max_selections, sort_order, metadata)
            VALUES
              (v_product_id, 'Banderilla ' || v_modifier_id || ' · Relleno', TRUE, 1, 1, v_modifier_id * 10 + 1, jsonb_build_object('banderilla', v_modifier_id, 'kind', 'filling', 'default_option', 'Mixta')),
              (v_product_id, 'Banderilla ' || v_modifier_id || ' · Aderezos', FALSE, 0, 3, v_modifier_id * 10 + 2, jsonb_build_object('banderilla', v_modifier_id, 'kind', 'dressing', 'default_options', ARRAY['Catsup','Mayo','Mostaza'])),
              (v_product_id, 'Banderilla ' || v_modifier_id || ' · Polvo', TRUE, 1, 1, v_modifier_id * 10 + 3, jsonb_build_object('banderilla', v_modifier_id, 'kind', 'powder', 'default_option', 'Sin polvo'))
            ON CONFLICT DO NOTHING;
        END LOOP;
        UPDATE product_modifiers
        SET metadata = jsonb_set(metadata, '{default_option}', '"Mixta"')
        WHERE product_id = v_product_id AND name LIKE '%Relleno';
        INSERT INTO product_modifiers (product_id, name, required, min_selections, max_selections, sort_order, metadata)
        VALUES (v_product_id, 'Queso derretido', FALSE, 0, 1, 10, '{"global":true}')
        ON CONFLICT DO NOTHING;
        FOR v_modifier_id IN SELECT pm.id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name LIKE '%· Relleno' LOOP
            INSERT INTO modifier_options (modifier_id, name, price_delta)
            VALUES (v_modifier_id, 'Mixta', 0), (v_modifier_id, 'Queso', 0), (v_modifier_id, 'Salchicha', 0)
            ON CONFLICT (modifier_id, name) DO NOTHING;
        END LOOP;
        FOR v_modifier_id IN SELECT pm.id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name LIKE '%· Aderezos' LOOP
            INSERT INTO modifier_options (modifier_id, name, price_delta)
            VALUES (v_modifier_id, 'Catsup', 0), (v_modifier_id, 'Mayo', 0), (v_modifier_id, 'Mostaza', 0)
            ON CONFLICT (modifier_id, name) DO NOTHING;
        END LOOP;
        FOR v_modifier_id IN SELECT pm.id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name LIKE '%· Polvo' LOOP
            INSERT INTO modifier_options (modifier_id, name, price_delta)
            VALUES (v_modifier_id, 'Sin polvo', 0), (v_modifier_id, 'Flamin', 0), (v_modifier_id, 'Takis', 0), (v_modifier_id, 'Cheddar', 0)
            ON CONFLICT (modifier_id, name) DO NOTHING;
        END LOOP;
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Queso derretido';
        INSERT INTO modifier_options (modifier_id, name, price_delta)
        VALUES (v_modifier_id, 'CON QUESO DERRETIDO', 10)
        ON CONFLICT (modifier_id, name) DO NOTHING;
    END LOOP;

    -- Otros alimentos.
    FOR v_product_id IN SELECT p.id FROM products p WHERE p.name = 'Nachos' LOOP
        INSERT INTO product_modifiers (product_id, name, required, min_selections, max_selections, sort_order)
        VALUES (v_product_id, 'Lugar', TRUE, 1, 1, 1), (v_product_id, 'Extras', FALSE, 0, 2, 2)
        ON CONFLICT DO NOTHING;
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Lugar';
        INSERT INTO modifier_options (modifier_id, name, price_delta) VALUES (v_modifier_id, 'Consumir aquí', 0), (v_modifier_id, 'Para llevar', 0) ON CONFLICT DO NOTHING;
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Extras';
        INSERT INTO modifier_options (modifier_id, name, price_delta) VALUES (v_modifier_id, 'Extra Queso', 10), (v_modifier_id, 'Extra Chile', 5) ON CONFLICT DO NOTHING;
    END LOOP;

    FOR v_product_id IN SELECT p.id FROM products p JOIN subcategories s ON s.id = p.subcategory_id WHERE s.name = 'Palomitas' LOOP
        INSERT INTO product_modifiers (product_id, name, required, min_selections, max_selections, sort_order, metadata)
        VALUES (v_product_id, 'Sabor', TRUE, 1, 1, 1, '{"default_option":"Mantequilla","medium_non_default_surcharge":5}')
        ON CONFLICT DO NOTHING;
        UPDATE product_modifiers
        SET metadata = '{"default_option":"Mantequilla","medium_non_default_surcharge":5}'::jsonb
        WHERE product_id = v_product_id AND name = 'Sabor';
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Sabor';
        INSERT INTO modifier_options (modifier_id, name, price_delta)
        VALUES (v_modifier_id, 'Mantequilla', 0), (v_modifier_id, 'Cheddar', 0), (v_modifier_id, 'Takis Fuego', 0), (v_modifier_id, 'Flamin Hot', 0)
        ON CONFLICT (modifier_id, name) DO NOTHING;
    END LOOP;

    FOR v_product_id IN SELECT p.id FROM products p WHERE p.name = 'Maruchan' LOOP
        INSERT INTO product_modifiers (product_id, name, required, min_selections, max_selections, sort_order, metadata)
        VALUES (v_product_id, 'Chile', TRUE, 1, 1, 1, '{"default_option":"Chile Piquín"}')
        ON CONFLICT DO NOTHING;
        SELECT pm.id INTO v_modifier_id FROM product_modifiers pm WHERE pm.product_id = v_product_id AND pm.name = 'Chile';
        INSERT INTO modifier_options (modifier_id, name, price_delta)
        VALUES (v_modifier_id, 'Chile Piquín', 0), (v_modifier_id, 'Habanero', 0)
        ON CONFLICT (modifier_id, name) DO NOTHING;
    END LOOP;
END $$;

-- Componentes estructurados de los nueve combos.
DELETE FROM combo_items
WHERE combo_product_id IN (
    SELECT id FROM products WHERE name IN (
        'Combo Nachos', 'Nexus Duo', 'Nexus de Compas', 'Combo Nachos XL',
        'Nexus Squad', 'Nexus Lovers', 'Pa k Compartas',
        'Nexuletas pah Todos', 'Nachos de Compas'
    )
);

INSERT INTO combo_items (combo_product_id, component_type, component_product_id, quantity, sort_order, metadata)
SELECT combo.id, component.component_type, product.id, component.quantity, component.sort_order, component.metadata::jsonb
FROM (VALUES
    ('Combo Nachos','RENTAL',NULL,1,1,'{"duration_minutes":60,"console_selection":"any"}'),
    ('Combo Nachos','PRODUCT','Refresco 355ml',2,2,'{"allowed_subcategory":"Bebidas"}'),
    ('Combo Nachos','PRODUCT','Nachos',1,3,'{}'),
    ('Nexus Duo','RENTAL',NULL,1,1,'{"duration_minutes":60,"console_selection":"any"}'),
    ('Nexus Duo','PRODUCT','Refresco 355ml',2,2,'{"allowed_subcategory":"Bebidas"}'),
    ('Nexus Duo','PRODUCT','Palomitas Medianas',1,3,'{}'),
    ('Nexus de Compas','RENTAL',NULL,1,1,'{"duration_minutes":120,"console_selection":"any"}'),
    ('Nexus de Compas','PRODUCT','Refresco 355ml',2,2,'{"allowed_subcategory":"Bebidas"}'),
    ('Nexus de Compas','PRODUCT','Palomitas Medianas',1,3,'{}'),
    ('Nexus de Compas','PRODUCT','Maruchan',2,4,'{}'),
    ('Combo Nachos XL','RENTAL',NULL,1,1,'{"duration_minutes":60,"console_selection":"any"}'),
    ('Combo Nachos XL','PRODUCT','Refresco 355ml',2,2,'{"allowed_subcategory":"Bebidas"}'),
    ('Combo Nachos XL','PRODUCT','Nachos',1,3,'{}'),
    ('Combo Nachos XL','PRODUCT','Nexuleta 2 piezas',1,4,'{}'),
    ('Nexus Squad','RENTAL',NULL,2,1,'{"duration_minutes":120,"console_selection":"two"}'),
    ('Nexus Squad','PRODUCT','Refresco 355ml',4,2,'{"allowed_subcategory":"Bebidas"}'),
    ('Nexus Squad','PRODUCT','Palomitas Medianas',1,3,'{}'),
    ('Nexus Lovers','PRODUCT','24 Mini Hot Cakes',1,1,'{}'),
    ('Nexus Lovers','PRODUCT','Refresco 355ml',2,2,'{"allowed_subcategory":"Bebidas","alternative_product":"Café Americano"}'),
    ('Pa k Compartas','PRODUCT','Refresco 355ml',3,1,'{"allowed_subcategory":"Bebidas"}'),
    ('Pa k Compartas','PRODUCT','Palomitas Medianas',1,2,'{}'),
    ('Pa k Compartas','PRODUCT','Maruchan',1,3,'{}'),
    ('Nexuletas pah Todos','PRODUCT','Refresco 355ml',2,1,'{"allowed_subcategory":"Bebidas"}'),
    ('Nexuletas pah Todos','PRODUCT','Nexuleta 1 pieza',2,2,'{}'),
    ('Nachos de Compas','PRODUCT','Refresco 355ml',2,1,'{"allowed_subcategory":"Bebidas"}'),
    ('Nachos de Compas','PRODUCT','Nachos',1,2,'{}')
) AS component(combo_name, component_type, component_name, quantity, sort_order, metadata)
JOIN products combo ON combo.name = component.combo_name
LEFT JOIN products product ON product.name = component.component_name;
