# Game Rankings

Navegador moderno del archivo de scores de GameRankings.com.

## Desarrollo

    npm install
    npm run dev

## Actualizar datos

Los datos vienen de un snapshot de un Google Sheet, no de una API en vivo.
Para traer juegos nuevos que hayas agregado al Sheet:

    npm run sync-data
    git add src/data/games.json
    git commit -m "Sync data"
    git push

Un push a `main` reconstruye y republica el sitio automáticamente.

## Deploy

Automático vía GitHub Actions (`.github/workflows/deploy.yml`) a GitHub
Pages en cada push a `main`.
