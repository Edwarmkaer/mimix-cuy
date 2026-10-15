# Mimix Cuy

Minijuego para un evento: un cuy con chullo corre por una pista espacial,
esquiva obstáculos, salta y reúne monedas. Puedes jugar con teclado o mover
tu cuerpo frente a la cámara.

Esta aplicación es independiente de la plataforma Mimix. Contiene únicamente
la bienvenida y el juego, con un ranking ligero en Convex. Se juega sin cuenta
y sin los servicios de la plataforma Mimix.

## Ejecutar

Requisitos: Node.js 22 o superior y pnpm 10.34.6.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abre `http://localhost:5174/`. Desde la bienvenida, pulsa Play para entrar
a `/game`. Los enlaces antiguos de `/home` redirigen a `/` y los del juego
redirigen a `/game`, también en Vercel. Ambas páginas admiten entrada directa
y recarga sin cambiar la URL visible.

```bash
pnpm test
pnpm build
pnpm preview
```

`pnpm build` genera el sitio estático completo en `dist/`.
La vista previa de producción abre en `http://localhost:4174`.

## Cómo jugar

- Elige el icono de teclado o cámara.
- Pulsa **Tutorial** para practicar sin obstáculos, o **Comenzar** para jugar.
- Teclado: **← / →** o **A / D** para moverte; **Espacio**, **W** o **↑** para saltar.
- Cámara: muévete lateralmente y salta. Deja espacio para que se vea tu cuerpo.
- Recoge monedas y aprovecha los 12 segundos de protección de Inca Kola.
- Puedes pausar, reintentar o volver a la bienvenida.

Diseñado para desktop. El modo cámara necesita HTTPS o localhost. MediaPipe y
su detector se sirven desde la misma aplicación. El vídeo se procesa en el navegador:
esta aplicación no envía imágenes a un servidor. La selección de modo y el
récord se recuerdan en este navegador. Al terminar puedes confirmar un alias
y guardar tu resultado en el Top 10 compartido.

El ranking conserva el mejor resultado de cada alias y las monedas de esa
partida. Los alias son nombres públicos, no cuentas verificadas: quien use el
mismo alias comparte esa posición. No hay saldo de monedas ni sincronización
de una cuenta entre dispositivos. Un guardado fallido puede reintentarse sin
duplicar la partida; el resultado pendiente se conserva al recargar.

## Configurar el ranking

Sin configuración de Convex puedes jugar y conservar tu récord local.
Para conectar una base de desarrollo:

```bash
pnpm exec convex dev
```

La CLI crea `.env.local`, que no se sube al repositorio, y genera
`convex/_generated/`. Reinicia `pnpm dev` después de configurar el backend.
El juego usa únicamente `VITE_CONVEX_URL`, una URL pública que nunca debe
contener una clave de despliegue.

Para publicar cambios en el backend:

```bash
pnpm exec convex deploy
```

Configura en Vercel `VITE_CONVEX_URL` con la URL de **producción** que muestra
la CLI y vuelve a desplegar el frontend. Usa la URL de **desarrollo** para
Preview y Development, para que las pruebas no alteren el ranking del evento.
El despliegue del frontend no publica automáticamente cambios de Convex.

## Publicar en Vercel

Sube **esta carpeta** a un repositorio nuevo y conecta ese repositorio a Vercel.
El archivo `vercel.json` ya establece:

- Framework: **Vite**.
- Root Directory: raíz del repositorio.
- Install Command: `pnpm install --frozen-lockfile`.
- Build Command: `pnpm build`.
- Output Directory: `dist`.

El ranking compartido necesita `VITE_CONVEX_URL`; el juego y el récord local
funcionan también sin ella. Vercel ofrece HTTPS, necesario para pedir acceso
a la cámara fuera de localhost.
Antes del evento, prueba el enlace público desde una ventana sin sesión:
bienvenida → teclado → tutorial → partida → derrota → reintento → inicio.
Prueba también permisos y controles de cámara en el equipo del evento.

## Organización

```text
src/                 Bienvenida React y escena Three.js
  scene/             Solo los módulos visuales utilizados por la bienvenida
game/                Código, interfaz y recursos del minijuego
convex/              Esquema y funciones del ranking compartido
public/              Modelo del cuy y fuente tipográfica
scripts/             Preparación de recursos locales para dev y build
test/                Pruebas del juego, guardado local y backend
vercel.json          Configuración del despliegue estático
.github/workflows/   Validación automática en GitHub Actions
```

Edita el juego en `game/`. `public/experiences/` y `public/vendor/` se generan
automáticamente y no se versionan. Tampoco se suben `node_modules/` ni `dist/`.
Conserva `pnpm-lock.yaml` para instalaciones reproducibles.

Las carpetas de configuración local (`.cursor`, `.freebuff`, `.impeccable`),
Railway, Graphify y las capturas de desarrollo están excluidas de este repositorio.

## GitHub Actions

El workflow `CI` se ejecuta en cada push a `main`, en pull requests y manualmente
desde Actions. Comprueba el contenido público del repositorio, instala las
dependencias con el lockfile, verifica los tipos del backend, ejecuta las pruebas
y genera el build de producción.
Usa Node.js 22, pnpm 10.34.6 y acciones fijadas a commits específicos.

Puedes ejecutar las mismas comprobaciones localmente con `pnpm check`.
La publicación en Vercel se configura al conectar el repositorio; CI valida
la aplicación sin necesitar credenciales de despliegue.

## Procedencia

Extraído del resultado local de Mimix el 14 de octubre de 2026. Se conserva
la apariencia y la lógica del juego; la bienvenida pasa a una aplicación
estática y las dependencias del monorepo quedan incluidas localmente.
El proyecto Mimix original permanece en su ubicación y puede seguir evolucionando.

Las atribuciones y condiciones de los recursos se detallan en
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
