# PuntoDeVenta Nexus

Sistema de control operativo, punto de venta (POS) y sincronización en tiempo
real para un Game Center / sala de consolas y cafetería.

Este documento es la fuente de contexto del proyecto. Antes de comenzar una
nueva sesión de desarrollo, debe leerse para conservar la arquitectura,
reglas de negocio y orden de implementación.

## 1. Objetivo

Construir un sistema centralizado que permita:

- Controlar consolas, sesiones de juego, reservas y cronómetros.
- Operar ventas de productos y combos desde un POS.
- Descontar automáticamente insumos mediante recetas.
- Administrar inventario, gastos y ganancias.
- Sincronizar estados y eventos en tiempo real.
- Integrarse con el sitio público del negocio creado en WordPress + Divi.

## 2. Arquitectura

El sistema se divide en tres capas desacopladas:

### 2.1 Sitio público del cliente

El cliente mantiene la landing page en WordPress + Divi. Nuestro sistema le
proporcionará un widget JavaScript ligero (o micro-React) para:

- Mostrar el estado en vivo de las consolas:
  - Verde: libre.
  - Rojo: ocupada.
  - Amarillo: reservada.
- Enviar solicitudes de reserva mediante la API REST.
- Permitir armar combos desde el móvil y generar un código QR con el pedido.

El widget debe poder pegarse en un módulo de Código HTML de Divi sin depender
de la aplicación privada del personal.

### 2.2 Backend central

Tecnologías:

- Node.js.
- Express.
- Socket.io.
- PostgreSQL.

Responsabilidades:

- Exponer la API REST.
- Autenticar y autorizar usuarios internos.
- Aplicar las reglas de negocio.
- Persistir sesiones, ventas, reservas, inventario y gastos.
- Ejecutar transacciones atómicas para ventas y movimientos de inventario.
- Calcular timers usando timestamps del servidor.
- Emitir eventos de Socket.io a los clientes autorizados y al widget público.

### 2.3 Panel privado

Aplicación SPA para empleados y administradores en
`sistema.tudominio.com`.

Tecnología: React.

Módulos previstos:

- Monitor de consolas y sesiones.
- POS y pedidos.
- Gestor de reservas.
- Inventario y recetas.
- Gastos y resumen financiero.
- Administración de usuarios y permisos.

## 3. Reglas de negocio críticas

### 3.1 Sesiones y cronómetros

- El servidor es la autoridad del tiempo; el navegador solo presenta el
  estado.
- Una sesión debe guardar, como mínimo, consola, modalidad, inicio, fin
  esperado, fin real, estado y usuario que la inició o cerró.
- El tiempo debe continuar correctamente aunque se cierre la pestaña, se
  apague la computadora o se reinicie el servidor.
- Modalidades iniciales:
  - Tiempo libre.
  - Tiempo fijo.
  - Pausa.
  - Stop/finalización.
- Las sesiones de tiempo fijo deben generar alertas visuales y sonoras al
  finalizar.
- Los cambios de estado deben persistirse y emitirse por WebSocket.

### 3.2 Reservas

- El sitio público crea solicitudes con `POST /api/reservas`.
- El personal puede aceptar, rechazar o asignar fecha, hora y consola.
- Los cambios de una reserva deben reflejarse en tiempo real donde
  corresponda.
- Las entradas públicas deben validarse, limitarse y no exponer datos
  internos.

### 3.3 POS y combos

- El empleado puede seleccionar productos individuales o combos.
- El POS puede importar un pedido generado por QR.
- El contenido del QR representa datos de pedido y debe validarse nuevamente
  en el backend; nunca se debe confiar en precios o cantidades enviados por
  el cliente.
- Una venta y sus descuentos de inventario se ejecutan en una única
  transacción atómica.
- Si cualquier descuento falla, se revierte toda la operación.

### 3.4 Recetas e inventario

Una venta de producto terminado descuenta sus insumos base según la receta.
Ejemplos:

- Frappe Oreo: 200 ml de leche, 30 g de base frappe, 2 galletas Oreo y
  1 vaso.
- Banderilla: 1 salchicha, 80 g de harina y 1 palillo.

Requisitos:

- Las cantidades y unidades deben ser consistentes.
- Cada insumo puede tener stock actual y stock mínimo.
- Debe existir historial de movimientos.
- Debe notificarse cuando un insumo queda por debajo del mínimo.
- Los ajustes manuales deben registrar usuario, motivo y fecha.

### 3.5 Gastos y ganancias

El sistema debe registrar gastos con categoría, monto, descripción, fecha y
usuario. La ganancia neta diaria se calcula como:

`Ventas totales - Gastos = Ganancia real`

Los reportes deben basarse en datos persistidos y rangos de fecha explícitos.

## 4. Integración, seguridad y operación

- Configurar CORS para el dominio WordPress y el subdominio privado.
- Restringir los orígenes permitidos mediante variables de entorno.
- Proteger las rutas privadas con autenticación y autorización por roles.
- Validar y normalizar toda entrada externa.
- No aceptar del cliente precios, costos, stock o descuentos calculados.
- Usar consultas parametrizadas/ORM y transacciones de base de datos.
- Registrar errores de forma útil sin filtrar secretos ni datos sensibles.
- Mantener secretos, credenciales y URLs privadas fuera del repositorio.
- Diseñar Socket.io con autenticación, autorización por sala y reconexión.

## 5. Orden de implementación

El desarrollo será incremental y verificable:

1. Diseñar el modelo relacional, relaciones, índices y restricciones.
2. Crear la estructura del backend Node.js/Express, conexión segura a
   PostgreSQL y configuración de Socket.io.
3. Implementar autenticación, usuarios, roles y auditoría básica.
4. Implementar consolas, estados y API de sesiones/tiempos.
5. Implementar persistencia y emisión de eventos en tiempo real.
6. Implementar reservas públicas y flujo de aprobación.
7. Implementar catálogo, recetas, inventario y movimientos.
8. Implementar POS, QR y transacciones de ventas.
9. Implementar gastos, cierres y reportes financieros.
10. Construir el panel SPA privado con React.
11. Construir y documentar el widget de WordPress/Divi.
12. Agregar pruebas unitarias, integración, validación de transacciones y
    pruebas de reconexión de WebSockets.
13. Preparar despliegue, backups, observabilidad y documentación operativa.

Cada etapa debe mantener el sistema ejecutable y acompañarse de pruebas
enfocadas en las reglas que modifica.

## 6. Estructura objetivo

La estructura separa responsabilidades de esta manera:

```text
backend/
  src/
    config/
    db/
    modules/
      auth/
      consoles/
      reservations/
      inventory/
      products/
      sales/
      expenses/
    realtime/
    shared/
  migrations/
  tests/

frontend/                         # React
  src/
    app/
    modules/
    components/
    services/
    realtime/
    auth/

public-widget/
  src/
  dist/
  README.md
```

## 7. Convenciones para futuras sesiones

- Leer primero este archivo y revisar el estado actual del repositorio.
- Antes de modificar código, identificar el módulo y las reglas afectadas.
- Preferir cambios pequeños, tipados, testeables y compatibles con las
  convenciones existentes.
- No implementar lógica de tiempo únicamente en el frontend.
- No actualizar stock fuera de una transacción de venta.
- No confiar en datos calculados por el cliente.
- Documentar cualquier cambio de arquitectura o regla de negocio aquí.
- Mantener la API versionable y separar el widget público del panel privado.

## 8. Base de datos provisional

La base de datos usa PostgreSQL y se mantiene mediante migraciones numeradas
en [database/](C:/Users/Kaiser/OneDrive/Documents/PuntoDeVenta_Nexus/database).
La primera migración define el esquema inicial ampliable. La base local
recomendada es `puntoventa_nexus_dev`.

No se deben editar migraciones que ya hayan sido aplicadas. Los cambios
posteriores deben agregarse en nuevas migraciones.

## 9. Frontend React inicial

El panel privado inicial está en [frontend/](C:/Users/Kaiser/OneDrive/Documents/PuntoDeVenta_Nexus/frontend)
y usa Vite, React, Tailwind CSS, Axios, Socket.io Client y Lucide React.
Incluye el monitor responsive de consolas, tarjetas de estado, cronómetros
visuales basados en timestamps del servidor, modales para iniciar/finalizar
rentas y alertas de tiempo agotado.

La referencia funcional de [imagenesMovil/](C:/Users/Kaiser/OneDrive/Documents/PuntoDeVenta_Nexus/imagenesMovil)
fue revisada. Se conservaron sus conceptos de navegación, rentas, consola,
duración, controles y carrito, pero se reorganizaron para escritorio/tablet
con grillas, espaciado y jerarquía visual más clara.

## 10. Especificación Nexus POS procesada

La especificación funcional de Nexus POS fue incorporada en la migración
[003_nexus_pos.sql](C:/Users/Kaiser/OneDrive/Documents/PuntoDeVenta_Nexus/database/migrations/003_nexus_pos.sql)
y en módulos backend para órdenes/KDS, gastos y cierres diarios. El cierre de
una renta crea obligatoriamente su orden y línea de venta antes de liberar la
consola. Los precios de productos se resuelven en PostgreSQL.

La identidad visual usa los tokens corporativos documentados en
[frontend/tailwind.config.js](C:/Users/Kaiser/OneDrive/Documents/PuntoDeVenta_Nexus/frontend/tailwind.config.js).

La migración `004_consolidate_inventory.sql` establece
`insumos/recipes` como modelo canónico de inventario y conserva el esquema
anterior solo durante la transición.

## 11. Próximo paso

El siguiente entregable debe ser el diseño del esquema de base de datos:

- Entidades y relaciones.
- Tipos de datos.
- Estados y transiciones.
- Índices y restricciones.
- Estrategia de unidades para inventario.
- Transacciones requeridas para ventas y sesiones.

Decisiones confirmadas:

- Base de datos: PostgreSQL.
- Frontend privado: React.

El siguiente entregable será continuar el panel con reservas, POS y catálogo,
manteniendo la separación modular del frontend y la sincronización por
Socket.io.
