# Game Rankings — Diseño

**Fecha:** 2026-08-11
**Estado:** Aprobado para pasar a plan de implementación

## Propósito

Recrear, con estilo moderno, el archivo de scores de [gr.blade.sk](https://gr.blade.sk/) (un navegador del archivo histórico de GameRankings.com). Es una herramienta pública/comunidad: cualquiera puede explorar, filtrar y buscar en el archivo de ~28,800 juegos (juego × plataforma) con sus puntuaciones.

Los datos viven en una hoja de Google Sheets propiedad del usuario (copia de un dump de GameRankings de 2019-12-08):
`https://docs.google.com/spreadsheets/d/1rnHawH0zI0w6wa7TIazdOpk5lIrKKyYSkH5X9GFfYYc/edit`

Columnas de origen: `id, title, platform, year, avg score, reviews, developer, image, link, GameFAQs, bayesian avg`.

El sheet seguirá siendo la fuente de verdad para agregar juegos en el futuro (la lista actual llega solo hasta mediados de 2019).

## Alcance de esta fase (MVP)

**Incluido:**
- Vista única: tabla híbrida virtualizada con todos los juegos, filtrable y ordenable.
- Filtro por plataforma (multi-selección).
- Búsqueda por título.
- Filtro de reviews mínimas.
- Snapshot de datos generado desde Google Sheets al momento de publicar.
- Deployment automático a GitHub Pages vía GitHub Actions.

**Explícitamente fuera de alcance (fases futuras):**
- Página de detalle individual por juego.
- Panel de administración con login para agregar juegos (se sigue usando Google Sheets + script de sync para el dueño del sitio).
- Lectura en vivo del Sheet en cada visita (se descartó por rendimiento con ~28,800 filas y límites de la API de Sheets).

**Agregado post-MVP:** un canal de contribución pública sin necesidad de acceso al Sheet ni al repo — cualquiera puede abrir un GitHub Issue con una plantilla estructurada; un workflow lo valida y abre un Pull Request contra `src/data/community-games.json` (un archivo separado de `games.json`, para que `sync-data` no lo sobrescriba); el dueño del sitio revisa y aprueba el PR manualmente. No es un panel de administración (no hay login ni escritura directa a `main`), sino un flujo de propuesta-y-revisión. Ver README, sección "Sugerencias de terceros".

## Dirección visual

**Estilo "Dark Data Dashboard":** fondo oscuro (`#0b0e14` / `#141824`), tipografía de sistema (sans-serif técnica), acentos teal (`#7dd3c0`) y ámbar (`#f0b429`) para resaltar scores altos. Badges de plataforma como chips pequeños. Se siente como una herramienta de datos seria, no una página editorial ni un sitio retro-arcade. Referencia visual acordada durante el brainstorming (mockups A/B/C, se eligió A).

**Densidad de la tabla:** tabla densa (como el sitio original), sin miniatura de carátula. El diseño original contemplaba un híbrido con una miniatura pequeña al inicio de cada fila, pero se descartó tras el lanzamiento: las URLs de imagen del dump de 2019 apuntan a `gamefaqs1.cbsistatic.com`, cuyo certificado TLS expiró en mayo de 2025 (CBS Interactive migró GameFAQs a `gamefaqs.gamespot.com`), por lo que ningún navegador puede cargar esas portadas hoy. Se retiró el campo `image`/`i` de todo el pipeline de datos (sync script, tipos, loader) en vez de dejarlo como peso muerto.

## Arquitectura y stack técnico

**Vite + React + TypeScript + TanStack Table + TanStack Virtual**

Justificación: la app es, en esencia, una única tabla interactiva — no se necesita un framework full-stack ni SSR. TanStack Virtual resuelve la virtualización de ~28,800 filas (solo renderiza las visibles, permitiendo scroll infinito fluido). TanStack Table resuelve ordenamiento y filtrado sin reimplementar esa lógica a mano. El ecosistema es amplio y facilita extender la app después (ej. página de detalle con React Router) sin cambiar de stack.

Se descartó una alternativa sin framework (HTML/CSS/JS plano) porque virtualización + ordenamiento + filtrado de ~28,800 filas a mano es reinventar la rueda, con más riesgo de bugs sutiles de performance/scroll, y sería más difícil de extender.

## UX y funcionalidad

**Tabla principal (vista única, sin rutas por ahora):**
- Columnas: rank/#, título, plataforma (badge), año, desarrollador, # reviews, score. (Sin columna de miniatura — ver "Dirección visual".)
- Score por defecto mostrado y usado para ordenar: **Bayesian AVG** (columna `bayesian avg` del sheet), igual que el sitio original. Se puede exponer también el "avg score" simple (columna `avg score`) como dato secundario si cabe en el layout.
- Click en encabezado de columna ordena asc/desc: título, año, score, # reviews.
- Orden por defecto: Bayesian AVG descendente.
- Scroll infinito virtualizado — sin paginación de "página siguiente/anterior".
- Un mismo juego aparece una fila por cada plataforma en la que se lanzó (no se agrupan/deduplican), igual que el sitio original — el `id` de la hoja ya es único por combinación juego+plataforma.

**Filtros:**
- Plataforma: chips/botones toggle, selección múltiple, con opción "todas". Lista de plataformas: PC, MAC, PS, PS2, PS3, PS4, PSP, VITA, SNES, N64, GC, WII, WIIU, NS, GB, GBC, GBA, DS, 3DS, XBOX, X360, XONE, GEN, SCD, SAT, DC, MOBI, NGE, IOS (las mismas del sitio original).
- Búsqueda de texto libre por título o desarrollador (substring, insensible a mayúsculas/acentos; la búsqueda por desarrollador es feedback post-lanzamiento, no estaba en el alcance MVP original).
- Reviews mínimas: input/slider numérico (replica la vista "3+ reviews" ya existente en el Sheet).
- Botón "Limpiar filtros".

## Pipeline de datos

**Script de sync (`scripts/sync-data.mjs`):**
1. Descarga el Sheet como CSV vía la URL pública de exportación (`.../export?format=csv&gid=782449831`).
2. Parsea el CSV, recorta espacios, descarta filas vacías/inválidas.
3. Genera `src/data/games.json` con claves cortas (ej. `t` para título) para minimizar el tamaño del bundle de datos.
4. Omite las columnas `link` y `GameFAQs` (URLs a las páginas originales) en este JSON — no se usan sin página de detalle. Se vuelven a incluir cuando se construya esa fase.

**Flujo para agregar juegos nuevos (futuro):**
1. El usuario agrega/edita filas directamente en su Google Sheet.
2. Corre `npm run sync-data` localmente, lo que regenera `src/data/games.json`.
3. Commit + push a `main`.
4. GitHub Actions reconstruye y republica el sitio automáticamente.

No es instantáneo (requiere un paso manual de sync + push), pero mantiene el sitio 100% estático y rápido para los visitantes, evitando depender de la disponibilidad/límites de la API de Google Sheets en cada visita.

**Tamaño estimado:** ~28,800 filas → aproximadamente 1-2MB comprimidos, cargados una sola vez al entrar al sitio.

## Deployment

- Repositorio nuevo en GitHub (se crea desde cero como parte de la implementación).
- GitHub Actions: al hacer push a `main`, un workflow corre `vite build` y publica el resultado a **GitHub Pages**.
- Sin dominio propio por ahora (se usa el subdominio `github.io` por defecto); se puede agregar dominio personalizado más adelante si se desea.

## Testing

- Pruebas manuales en navegador durante desarrollo (filtros, orden, scroll, búsqueda) — no se plantean pruebas automatizadas (unit/e2e) para este MVP dado el alcance y que es un proyecto personal/comunidad sin lógica de negocio compleja. Se puede reconsiderar si el proyecto crece (ej. al agregar panel de administración).
- Validación del script de sync: correr contra el Sheet real y verificar conteo de filas y campos clave (título, score, plataforma) antes de cada publicación.

## Decisiones clave (resumen)

| Tema | Decisión |
|---|---|
| Propósito | Herramienta pública/comunidad |
| Hosting | Sitio estático en GitHub Pages |
| Fuente de datos | Google Sheets (copia del usuario), snapshot al publicar |
| Agregar juegos futuros | Editando el Sheet + script de sync + push |
| Stack | Vite + React + TypeScript + TanStack Table/Virtual |
| Estilo visual | Dark Data Dashboard |
| Densidad de tabla | Híbrido (fila densa + miniatura de carátula) |
| Navegación de lista | Scroll infinito virtualizado |
| Filtro de plataforma | Multi-selección |
| Página de detalle | Fuera de alcance (fase futura) |
