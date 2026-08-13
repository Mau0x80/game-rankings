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

## Sugerencias de terceros (sin acceso al Sheet)

Cualquiera puede proponer un juego sin necesitar acceso al Google Sheet ni
al repo: [abre un issue con la plantilla "Agregar un juego"](../../issues/new?template=add-game.yml).

Un workflow (`.github/workflows/add-game.yml`) valida los datos, calcula
el Bayesian AVG con la misma fórmula que usa el resto del archivo, y abre
un Pull Request agregando la entrada a `src/data/community-games.json`
— **nunca escribe directamente en `main`**. Un mantenedor revisa y aprueba
el PR antes de que el juego aparezca en el sitio.

`community-games.json` es un archivo separado de `games.json` a propósito:
`sync-data` solo regenera `games.json` desde el Sheet, así que las
contribuciones de la comunidad sobreviven a futuros syncs sin perderse.
Sus `id` son negativos (el número del issue en negativo) para no chocar
nunca con los ids positivos del archivo original.

## Deploy

Automático vía GitHub Actions (`.github/workflows/deploy.yml`) a GitHub
Pages en cada push a `main`.
