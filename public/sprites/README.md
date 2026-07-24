# Sprite assets

The game currently draws **procedural placeholder sprites** (see
`src/sprites/placeholders.ts`). To replace any of them with your own pixel art,
drop files here and point the loader at them — no other code changes needed.

The sprite engine (`src/sprites/frames.ts`) accepts three source kinds:

| kind    | file                          | notes                                  |
| ------- | ----------------------------- | -------------------------------------- |
| `gif`   | animated `.gif`               | decoded to frames automatically        |
| `sheet` | PNG sprite sheet (grid)       | give `cols`, `rows`, optional `count`  |
| `proc`  | drawn in code (current)       | the placeholders                       |

## Animals

Each animal has three animation states: `idle`, `alert`, `run`.
To use real art, edit `animalSource()` in `src/config/animals.ts`, e.g.:

```ts
export function animalSource(type, state) {
  return { kind: 'gif', url: `/sprites/${type.id}-${state}.gif` }
  // or a sheet:
  // return { kind: 'sheet', url: `/sprites/${type.id}-${state}.png`, cols: 4, rows: 1 }
}
```

Expected files (if using the gif convention): `moose-idle.gif`,
`moose-alert.gif`, `moose-run.gif`, and the same for `elk`, `deer`, `rabbit`,
`fox`, `grouse`.

**Face right.** Sprites should face right; the hit-region boxes
(`QUADRUPED_HIT` / `BIRD_HIT` in `animals.ts`) assume head-front-right,
heart-mid-front. Adjust those UV boxes if your art is laid out differently.

## Trees & grass

Edit the `useFrames(...)` calls in `src/game/Decorations.tsx` to swap in
`{ kind: 'gif', url: '/sprites/tree.gif' }` etc.
