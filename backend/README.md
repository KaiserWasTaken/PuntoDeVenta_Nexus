# Backend

Servidor base de PuntoDeVenta Nexus con Node.js, Express, PostgreSQL y
Socket.io.

## Inicialización

Desde la raíz del repositorio:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Completa `.env` con las credenciales de PostgreSQL. No guardes `.env` en Git.

Configura también un `JWT_SECRET` de al menos 32 caracteres. Para crear el
primer usuario administrativo:

```powershell
node scripts/create-user.js admin@localhost "cambia-esta-clave" "Administrador" admin
```

## Ejecución

```powershell
npm run dev
```

La API queda disponible en `http://localhost:3000`.

## Endpoints iniciales

```text
GET   /health
GET   /api/v1/consolas
PATCH /api/v1/consolas/:id/estado
```

El PATCH recibe `{ "estado": "LIBRE" }`, `{ "estado": "OCUPADA" }` o
`{ "estado": "RESERVADA" }`. Después de actualizar la base se emite
`consola:actualizada` por Socket.io.

## Sesiones de renta

```text
POST /api/v1/sesiones/iniciar
POST /api/v1/sesiones/:id/pausar
POST /api/v1/sesiones/:id/reanudar
POST /api/v1/sesiones/:id/finalizar
GET  /api/v1/sesiones/activas
```

El tiempo se calcula con `TIMESTAMPTZ` y segundos acumulados persistidos en
PostgreSQL. El cliente no es una fuente de tiempo. Las operaciones de cambio
de estado bloquean la sesión y la consola dentro de una transacción.

Al iniciar:

```json
{
  "consola_id": "uuid",
  "tipo_renta": "FIJO",
  "duracion_minutos": 60,
  "precio_por_hora": 100
}
```

Los eventos emitidos son `sesion:actualizada` y
`sesion:tiempo_agotado`. El segundo se revisa cada cinco segundos y no
finaliza automáticamente la sesión; esa decisión queda en el flujo operativo.

## Nexus POS

La migración `database/migrations/003_nexus_pos.sql` agrega categorías,
subcategorías, modificadores, opciones, combos, órdenes, líneas de orden,
tarifas, gastos ampliados, insumos, recetas y cierres diarios.

Endpoints disponibles:

```text
POST  /api/v1/ordenes
POST  /api/v1/ordenes/:id/pagar
GET   /api/v1/ordenes/kds
PATCH /api/v1/ordenes/kds/items/:itemId

Catálogo autenticado:

```text
GET    /api/v1/catalogo/categorias
POST   /api/v1/catalogo/categorias
POST   /api/v1/catalogo/subcategorias
PATCH  /api/v1/catalogo/categorias/:id
DELETE /api/v1/catalogo/categorias/:id
GET    /api/v1/catalogo/productos
GET    /api/v1/catalogo/productos/:id
POST   /api/v1/catalogo/productos
PATCH  /api/v1/catalogo/productos/:id
DELETE /api/v1/catalogo/productos/:id
GET    /api/v1/catalogo/productos/:id/modificadores
POST   /api/v1/catalogo/modificadores
GET    /api/v1/catalogo/combos/:id
```

Las órdenes reciben `product_id` o `combo_id`. Las opciones de modificadores
se envían únicamente como UUIDs; el backend consulta sus nombres y precios
desde PostgreSQL. Los combos generan una cabecera con precio y componentes a
precio cero, visibles en KDS únicamente cuando corresponda.
GET   /api/v1/gastos
POST  /api/v1/gastos
POST  /api/v1/reportes/cerrar
```

Una orden valida los productos y precios en PostgreSQL; nunca acepta el precio
del cliente. La creación deja la orden en `PENDING`, sin método de pago.
`POST /api/v1/ordenes/:id/pagar` bloquea la orden, descuenta las recetas y
confirma el pago dentro de una única transacción. Las órdenes sin pago no se
incluyen en el cierre diario.

Al detener una sesión, el backend crea dentro de la misma transacción una
orden `PENDING` con una línea `RENTAL` y solo después libera la consola. La
renta queda lista para cobrarse desde el botón de pago.

El descuento de inventario usa `insumos/recipes`, bloquea los insumos con
`FOR UPDATE`, registra `inventory_movements` y revierte todo si el stock es
insuficiente. Cuando un insumo queda en o por debajo de su mínimo se emite
`insumo:stock_bajo`.

Los números de orden incluyen un sufijo aleatorio para evitar colisiones bajo
concurrencia. El inventario canónico es `insumos/recipes`; las tablas
`ingredients/recipe_items` son legado temporal y no deben recibir nuevas
escrituras.

## Autenticación

```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

Las rutas de sesiones, órdenes, gastos y administración requieren
`Authorization: Bearer <token>`. Socket.io requiere el mismo token:

```javascript
io('http://localhost:3000', { auth: { token } });
```

La consulta pública de consolas permanece disponible para el futuro widget;
las modificaciones de estado requieren autenticación.

## Arquitectura

```text
src/
  app.js
  server.js
  config/
  modules/consoles/
  routes/
  sockets/
  shared/
```

## Estructura recomendada de crecimiento

Los nuevos módulos deben vivir bajo `src/modules/<modulo>` y separar, cuando
sea necesario, sus rutas, controladores, servicios y repositorios. La
configuración transversal permanece en `src/config`, los middlewares
compartidos en `src/shared` y los eventos Socket.io en `src/sockets`.
