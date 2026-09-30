import { pool } from '../../config/database.js';

export async function listCategories() {
  const result = await pool.query(`
    SELECT c.id, c.name, c.sort_order, c.is_active,
      COALESCE(json_agg(json_build_object(
        'id', s.id, 'name', s.name, 'sort_order', s.sort_order,
        'is_active', s.is_active
      ) ORDER BY s.sort_order, s.name) FILTER (WHERE s.id IS NOT NULL), '[]') AS subcategories
    FROM categories c
    LEFT JOIN subcategories s ON s.category_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order, c.name
  `);
  return result.rows;
}

export async function createCategory(data) {
  const result = await pool.query(`
    INSERT INTO categories (name, sort_order)
    VALUES ($1, $2)
    RETURNING *
  `, [data.name, data.sort_order]);
  return result.rows[0];
}

export async function createSubcategory(data) {
  const result = await pool.query(`
    INSERT INTO subcategories (category_id, name, sort_order)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [data.category_id, data.name, data.sort_order]);
  return result.rows[0];
}

export async function updateCategory(id, data) {
  const result = await pool.query(`
    UPDATE categories
    SET name = COALESCE($2, name), sort_order = COALESCE($3, sort_order)
    WHERE id = $1
    RETURNING *
  `, [id, data.name ?? null, data.sort_order ?? null]);
  return result.rows[0] ?? null;
}

export async function deactivateCategory(id) {
  const result = await pool.query(`
    UPDATE categories SET is_active = FALSE WHERE id = $1 RETURNING *
  `, [id]);
  return result.rows[0] ?? null;
}

export async function listProducts(filters) {
  const values = [];
  const conditions = [];
  if (filters.category_id) {
    values.push(filters.category_id);
    conditions.push(`p.category_id = $${values.length}`);
  }
  if (filters.subcategory_id) {
    values.push(filters.subcategory_id);
    conditions.push(`p.subcategory_id = $${values.length}`);
  }
  if (filters.is_active !== undefined) {
    values.push(filters.is_active);
    conditions.push(`p.is_active = $${values.length}`);
  }
  const result = await pool.query(`
    SELECT p.*, c.name AS category_name, sc.name AS subcategory_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
    ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
    ORDER BY p.name
  `, values);
  return result.rows;
}

export async function findProduct(id) {
  const result = await pool.query(`
    SELECT p.*, c.name AS category_name, sc.name AS subcategory_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
    WHERE p.id = $1
  `, [id]);
  return result.rows[0] ?? null;
}

export async function findRecipe(productId) {
  const result = await pool.query(`
    SELECT r.id, r.insumo_id, i.name AS insumo_name, i.unit, r.quantity
    FROM recipes r
    INNER JOIN insumos i ON i.id = r.insumo_id
    WHERE r.product_id = $1
    ORDER BY i.name
  `, [productId]);
  return result.rows;
}

export async function createProduct(data) {
  const result = await pool.query(`
    INSERT INTO products (
      name, description, product_type, sale_price, category_id, subcategory_id, sku
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [data.name, data.description ?? null, data.product_type, data.sale_price,
    data.category_id ?? null, data.subcategory_id ?? null, data.sku ?? null]);
  return result.rows[0];
}

export async function updateProduct(id, data) {
  const result = await pool.query(`
    UPDATE products
    SET name = COALESCE($2, name),
        description = COALESCE($3, description),
        product_type = COALESCE($4, product_type),
        sale_price = COALESCE($5, sale_price),
        category_id = COALESCE($6, category_id),
        subcategory_id = COALESCE($7, subcategory_id),
        sku = COALESCE($8, sku)
    WHERE id = $1
    RETURNING *
  `, [id, data.name ?? null, data.description ?? null, data.product_type ?? null,
    data.sale_price ?? null, data.category_id ?? null, data.subcategory_id ?? null,
    data.sku ?? null]);
  return result.rows[0] ?? null;
}

export async function deactivateProduct(id) {
  const result = await pool.query(`
    UPDATE products SET is_active = FALSE WHERE id = $1 RETURNING *
  `, [id]);
  return result.rows[0] ?? null;
}

export async function findModifiers(productId, client = pool) {
  const result = await client.query(`
    SELECT
      m.id, m.product_id, m.name, m.required, m.min_selections,
      m.max_selections, m.sort_order, m.is_active,
      COALESCE(json_agg(json_build_object(
        'id', o.id, 'name', o.name, 'price_delta', o.price_delta,
        'is_active', o.is_active
      ) ORDER BY o.name) FILTER (WHERE o.id IS NOT NULL), '[]') AS options
    FROM product_modifiers m
    LEFT JOIN modifier_options o ON o.modifier_id = m.id
    WHERE m.product_id = $1
    GROUP BY m.id
    ORDER BY m.sort_order, m.name
  `, [productId]);
  return result.rows;
}

export async function createModifier(data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const modifier = await client.query(`
      INSERT INTO product_modifiers (
        product_id, name, required, min_selections, max_selections, sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [data.product_id, data.name, data.required, data.min_selections,
      data.max_selections, data.sort_order]);
    for (const option of data.options) {
      await client.query(`
        INSERT INTO modifier_options (modifier_id, name, price_delta)
        VALUES ($1, $2, $3)
      `, [modifier.rows[0].id, option.name, option.price_delta]);
    }
    await client.query('COMMIT');
    return modifier.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function findCombo(comboId) {
  const result = await pool.query(`
    SELECT
      p.id, p.name, p.sale_price, p.product_type,
      COALESCE(json_agg(json_build_object(
        'id', ci.id, 'component_product_id', ci.component_product_id,
        'component_type', ci.component_type, 'quantity', ci.quantity,
        'sort_order', ci.sort_order, 'metadata', ci.metadata,
        'component_name', cp.name, 'component_price', cp.sale_price
      ) ORDER BY ci.sort_order, ci.id) FILTER (WHERE ci.id IS NOT NULL), '[]') AS items
    FROM products p
    LEFT JOIN combo_items ci ON ci.combo_product_id = p.id
    LEFT JOIN products cp ON cp.id = ci.component_product_id
    WHERE p.id = $1 AND p.product_type = 'combo'
    GROUP BY p.id
  `, [comboId]);
  return result.rows[0] ?? null;
}

export async function findProductForOrder(productId, client = pool) {
  const result = await client.query(`
    SELECT id, name, sale_price, product_type, is_active
    FROM products
    WHERE id = $1 AND is_active = TRUE
  `, [productId]);
  return result.rows[0] ?? null;
}

export async function findSelectedOptions(productId, optionIds, client = pool) {
  const result = await client.query(`
    SELECT m.id AS modifier_id, m.name AS modifier_name, m.required,
      m.min_selections, m.max_selections,
      o.id AS option_id, o.name AS option_name, o.price_delta
    FROM product_modifiers m
    INNER JOIN modifier_options o ON o.modifier_id = m.id
    WHERE m.product_id = $1
      AND m.is_active = TRUE
      AND o.is_active = TRUE
      AND o.id = ANY($2::uuid[])
  `, [productId, optionIds]);
  return result.rows;
}
