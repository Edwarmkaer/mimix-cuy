# Desarrollo de Mimix Cuy

## Ejecutar localmente

Requisitos: Node.js 22 o superior y pnpm 10.34.6.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abre `http://localhost:5174/`. La bienvenida está en `/` y el juego en `/game`.
Los enlaces antiguos de `/home` redirigen a `/`.

## Configurar el ranking

Sin configurar Convex puedes jugar y conservar el récord local. Para conectar
una base de desarrollo:

```bash
pnpm exec convex dev
```

La CLI crea `.env.local`, excluido de Git, y genera los archivos de
`convex/_generated/`. Reinicia `pnpm dev` después de configurar el backend.

El frontend usa `VITE_CONVEX_URL`, la URL pública del backend. Esta variable
no debe contener una clave de despliegue. Usa una base de desarrollo para las
pruebas y la de producción para el juego público.

`convex/schema.ts` define las partidas y los mejores resultados por alias.
`convex/leaderboard.ts` valida y guarda resultados, evita duplicar una partida
reenviada y consulta el ranking. Los archivos de `convex/` son código fuente;
los registros de los jugadores se almacenan en el servicio de Convex.

Si un guardado falla, el resultado pendiente se conserva en el navegador y
puede reintentarse, incluso después de recargar.

## Comprobaciones y compilación

```bash
pnpm check
pnpm preview
```

`pnpm check` revisa el contenido del repositorio, comprueba los tipos del
backend, ejecuta las pruebas y genera el sitio en `dist/`. La vista previa
abre en `http://localhost:4174/`.

El workflow `CI` ejecuta estas comprobaciones en los pushes a `main`, en pull
requests y manualmente desde GitHub Actions.

## Publicar cambios

El sitio se compila con `pnpm build` y se sirve desde `dist/`. La configuración
de rutas y cabeceras está en `vercel.json`; el servidor de desarrollo y la vista
previa aplican las mismas rutas.

El modo cámara necesita HTTPS fuera de localhost. Configura `VITE_CONVEX_URL`
en el entorno de compilación antes de generar el frontend.

Cuando cambie el código del backend, publícalo también:

```bash
pnpm exec convex deploy
```

Publicar el frontend no despliega automáticamente las funciones de Convex.

## Organización

| Ruta | Contenido |
| --- | --- |
| `src/` | Bienvenida React y escena Three.js |
| `game/` | Código, interfaz y recursos del juego |
| `convex/` | Esquema de datos y funciones del ranking |
| `public/` | Modelo del cuy y fuentes |
| `scripts/` | Preparación de recursos y comprobaciones del repositorio |
| `test/` | Pruebas del juego, guardado y backend |
| `.github/workflows/` | Validación automática en GitHub Actions |

Edita el juego en `game/`. `public/experiences/` y `public/vendor/` se generan
automáticamente y no se versionan. `node_modules/`, `dist/` y los archivos
de entorno también están excluidos. Conserva `pnpm-lock.yaml` para instalaciones
reproducibles.
