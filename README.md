# Moosen Hunter

A simple, pixelated-style arcade game built with **React**, **Vite**, and
**React Three Fiber**.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) — dev server & build
- [Three.js](https://threejs.org/) via [React Three Fiber](https://r3f.docs.pmnd.rs/)
- [drei](https://drei.docs.pmnd.rs/) — R3F helpers (controls, etc.)

## The pixelated look

The scene renders into a reduced-resolution WebGL buffer (`dpr = 1 / PIXELATION`
in `src/game/Game.tsx`) with antialiasing off, and the canvas is scaled back up
with `image-rendering: pixelated` (`src/index.css`). Bump `PIXELATION` for
chunkier pixels.

## Getting started

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # oxlint
```

## Project layout

```
src/
  main.tsx        React entry point
  App.tsx         mounts the game + HUD overlay
  game/
    Game.tsx      the <Canvas> and pixelation config
    Scene.tsx     lights, ground, and scene contents
```
