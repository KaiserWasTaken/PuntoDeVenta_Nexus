# Base de datos

La base de datos provisional del proyecto usa PostgreSQL y se actualizará
mediante migraciones numeradas. No se deben editar migraciones ya aplicadas;
cada cambio posterior debe agregarse en un archivo nuevo.

## Base local recomendada

```text
Nombre: puntoventa_nexus_dev
```

Estado actual del entorno local: la base fue creada en `localhost:5432` y las
migraciones `001_initial_schema.sql`, `002_time_sessions.sql`,
`003_nexus_pos.sql` y `004_consolidate_inventory.sql` ya fueron aplicadas
correctamente. Las migraciones 005 y 006 agregan soporte de pago diferido,
unidades normalizadas y líneas KDS; la 007 refuerza estas restricciones y
agrega recetas opcionales para opciones de modificadores.

La migración `005_normalize_inventory_units.sql` debe aplicarse después de
ellas. Agrega `orders.paid_at`, normaliza las unidades de `insumos` a `g`,
`ml` o `pieza`, y permite que los movimientos nuevos dependan de `insumo_id`
sin exigir una fila en el inventario legado.

La creación de la base y la aplicación de la primera migración dependen de la
instancia local o de desarrollo de PostgreSQL:

```sql
CREATE DATABASE puntoventa_nexus_dev;
```

Después, aplicar `migrations/001_initial_schema.sql` conectado a esa base.

## Alcance provisional

La primera migración contiene las entidades necesarias para comenzar:

- Usuarios y roles.
- Consolas y sesiones persistentes.
- Reservas públicas.
- Productos, insumos y recetas.
- Ventas y líneas de venta.
- Movimientos de inventario.
- Gastos operativos.
- Sesiones de renta con timestamps persistentes y pausas.
- Catálogo POS, modificadores y combos.
- Órdenes, líneas de orden y estados KDS.
- Tarifas de renta, gastos ampliados y cierres diarios.
- `insumos/recipes` como modelo canónico de inventario; las tablas anteriores
  se conservan temporalmente solo para compatibilidad.

Las migraciones 005, 006 y 007 son necesarias antes de usar el endpoint de
pago diferido, porque el backend escribe `paid_at`, usa `is_kds_visible` y
registra movimientos asociados a `insumos`. La migración
`008_seed_catalog_and_modifiers.sql` carga el catálogo inicial, modificadores
parametrizados y los nueve combos; `009_rental_kds_and_close_details.sql`
refuerza que las rentas nunca aparezcan en el KDS y amplía los cierres diarios.
