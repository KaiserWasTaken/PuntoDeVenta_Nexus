# Frontend

Panel React + Vite + Tailwind CSS para la operación del Game Center.

## Instalación

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Por defecto, el frontend busca la API y Socket.io en el puerto `3000`:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

El backend usa `3000` por defecto. Si eliges otro puerto, actualiza ambas
variables del frontend para que coincidan.

## Estructura

```text
src/
  components/
  hooks/
  services/
  App.jsx
  main.jsx
  styles.css
```

El monitor combina el catálogo de consolas con las sesiones activas. El
cronómetro visual se actualiza localmente usando los timestamps entregados por
el servidor; el navegador no es la fuente de verdad. Las mutaciones siempre
se ejecutan mediante la API.

## Identidad visual

Las fuentes se cargan desde Google Fonts en `src/styles.css`:

- `font-silkscreen`: etiquetas accent y navegación compacta.
- `font-changa`: títulos y números destacados.
- `font-exo`: cuerpo, botones, formularios y tablas.

Los colores oficiales están definidos en `tailwind.config.js`:

```text
brand-gold  #F0E922
brand-dark  #1D1C33
brand-blue  #0629F5
brand-muted #DAD9E7
brand-light #F0F1FF
```
