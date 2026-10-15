# Mimix Cuy

Un cuy con chullo corre por el espacio. Esquiva obstáculos, salta y recoge
monedas mientras intentas superar tu récord. Puedes controlarlo con el teclado
o moviendo tu cuerpo frente a la cámara.

**Versión actual: 1.0.0.**

🎮 **[Jugar Mimix Cuy](https://mimix-cuy.vercel.app/)**

Se juega desde una computadora, directamente en el navegador y sin crear una cuenta.

## Cómo jugar

1. Entra al juego desde el botón **Play** de la bienvenida.
2. Elige teclado o cámara. Puedes usar el **Tutorial** para practicar sin obstáculos.
3. Pulsa **Comenzar**, esquiva los obstáculos y recoge monedas.
4. Al terminar, guarda tu puntaje con un alias para participar en el ranking.

La Inca Kola te da **12 segundos de protección y puntos dobles**.
Puedes pausar la partida, reintentar o volver al inicio.

## Controles

| Acción | Teclado | Cámara |
| --- | --- | --- |
| Moverse a los lados | **← / →** o **A / D** | Muévete lateralmente |
| Saltar | **Espacio**, **W** o **↑** | Salta frente a la cámara |

Para jugar con cámara, deja espacio para que se vea tu cuerpo.

## Puntajes y ranking

El juego recuerda tu récord en el navegador. También puedes guardar una partida
con un alias y competir en el **Top 10 compartido**.

El ranking conserva el mejor puntaje de cada alias y las monedas recogidas en esa
partida. Los alias son públicos y no son cuentas verificadas: si dos personas usan
el mismo nombre, comparten esa posición. Las monedas no forman un saldo acumulado.

## Cámara y privacidad

El vídeo se procesa en tu equipo con MediaPipe. El juego no envía imágenes de la
cámara a un servidor. Al guardar una partida se envían el alias, el puntaje,
las monedas, la duración y el modo de control al backend del ranking.

El modo cámara requiere permiso del navegador y una conexión HTTPS o localhost.
También puedes jugar solo con el teclado.

## Tecnologías

Three.js para las escenas 3D, React para la bienvenida, MediaPipe para detectar
movimientos y Convex para guardar resultados y consultar el ranking. Vite prepara
la aplicación para desarrollo y producción.

## Desarrollo

Las instrucciones para ejecutar el proyecto, configurar el ranking y realizar
las comprobaciones están en [DEVELOPMENT.md](DEVELOPMENT.md).

## Créditos

Juego basado en [The Floor Is Lava](https://www.funwithcomputervision.com/demo7/),
de Fun with Computer Vision. El fondo Galaxy utiliza un shader de React Bits.
Las licencias de las fuentes, bibliotecas y otros recursos se conservan junto
a sus archivos.
