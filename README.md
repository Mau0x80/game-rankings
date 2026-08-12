# Game Rankings

Navegador moderno del archivo de scores de GameRankings.com.

**En vivo:** https://mau0x80.github.io/game-rankings/

## Desarrollo

Requiere Node.js 20 (misma versión que usa el workflow de deploy).

    npm install
    npm run dev

## Build de producción

    npm run build      # genera dist/
    npm run preview    # sirve dist/ localmente para probar el build

## Actualizar datos

Los datos vienen de un snapshot de un Google Sheet, no de una API en vivo.
`src/data/games.json` es un archivo generado — no lo edites a mano, se
sobrescribe cada vez que corres `sync-data`.

Para traer juegos nuevos que hayas agregado al Sheet:

    npm run sync-data
    git add src/data/games.json
    git commit -m "Sync data"
    git push

Un push a `main` reconstruye y republica el sitio automáticamente.

## Deploy

Automático vía GitHub Actions (`.github/workflows/deploy.yml`) a GitHub
Pages en cada push a `main`.
