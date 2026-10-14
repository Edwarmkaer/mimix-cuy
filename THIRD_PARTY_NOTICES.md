# Procedencia y recursos

## Juego base

El minijuego deriva de **The Floor Is Lava**, de **Fun with Computer Vision**:
https://www.funwithcomputervision.com/demo7/

La copia local recibida no incluía un archivo LICENSE. Esta extracción conserva
su procedencia y no atribuye al código base una licencia que no se haya confirmado.
Las condiciones de distribución del original siguen pendientes de comprobación.

## Galaxy

Shader basado en **React Bits Galaxy**, adaptado al renderizador Three.js:
https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Backgrounds/Galaxy/Galaxy.tsx

La licencia original se conserva en `src/scene/fx/reactbits/LICENSE.md` y
se copia junto al shader usado por el juego durante la preparación del sitio.

## Tipografía

**Lilita One**, Copyright 2011 Juan Montoreano, SIL Open Font License 1.1.
Licencia y fuente original en `public/fonts/`.

**Mimix Space Display** es el subconjunto derivado M/I/X utilizado por las
letras 3D. Su licencia se conserva en `src/scene/fx/fonts/OFL.txt`.

## Bibliotecas

React y Three.js conservan sus licencias en los paquetes instalados.
El build copia la licencia de Three.js junto a sus módulos de navegador.
El SDK de Convex usa Apache License 2.0. Su licencia y la de jwt-decode (MIT)
se copian junto a los módulos del ranking en `vendor/convex/` durante el build.
Vite es una herramienta de desarrollo y compilación, no un servidor necesario
para ejecutar el sitio publicado.

El control corporal descarga **MediaPipe Tasks Vision 0.10.14** y su modelo
desde sus proveedores originales. El procesamiento de vídeo ocurre localmente.

## Recursos gráficos

El cuy animado, su chullo y las ilustraciones de derrota provienen del trabajo
de Mimix. Pista, monedas, obstáculos y botella son los recursos utilizados en
esa experiencia. Esta copia no asigna una licencia general a recursos recibidos
o derivados cuyo permiso de redistribución no esté documentado.
