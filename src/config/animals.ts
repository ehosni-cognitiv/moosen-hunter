import {
  ensureFace,
  makeAnimalFrames,
  SPRITE_W,
  SPRITE_H,
  type AnimalState,
  type CritterSpec,
} from '../sprites/placeholders'
import type { SpriteSource } from '../sprites/frames'

/** Points awarded per hit location. */
export const SCORING = {
  head: 100,
  heart: 50,
  body: 20,
}

export type HitRegion = 'head' | 'heart' | 'body'

/** UV rectangles [u0, v0, u1, v1] on the sprite plane. v=1 is the top. */
export interface HitBoxes {
  head: [number, number, number, number]
  heart: [number, number, number, number]
  body: [number, number, number, number]
}

export interface AnimalType {
  id: string
  name: string
  spec: CritterSpec
  /** billboard size in world units [width, height] */
  size: [number, number]
  /** extra height off the ground (flyers) */
  fly: number
  /** idle wander speed */
  speed: number
  /** flee running speed */
  fleeSpeed: number
  fps: { idle: number; alert: number; run: number }
  /** total hit points */
  health: number
  /** hit points removed per hit location */
  damage: { head: number; heart: number; body: number }
  /** bonus points awarded when the animal is killed */
  killBonus: number
  /** if set, this is an "avoid" target (park ranger): hitting it subtracts
   *  this many points and downs it. Overrides the normal scoring. */
  penalty?: number
  /** the rare golden rabbit — special spawn/behaviour/scoring (see GoldenRabbit) */
  golden?: boolean
  /** some instances may spawn already airborne, drifting peacefully across the
   *  screen during the calm phase (see Scene spawner). Birds only. */
  canFlyAcross?: boolean
}

/** Golden rabbit scoring: a kill is worth `points`, +`headshotBonus` if it was
 *  a headshot. One hit kills it regardless of location. */
export const GOLDEN = { points: 1000, headshotBonus: 2000 }

// Combat presets.
//  NORMAL: head/heart are one-shot kills; 3 body shots also kill.
//  MOOSEN: tanky — 2 headshots, or 2 heart + 1 body, or 5 body shots.
const NORMAL = {
  health: 60,
  damage: { head: 60, heart: 60, body: 20 },
  killBonus: 100,
}
const MOOSEN = {
  health: 100,
  damage: { head: 50, heart: 40, body: 20 },
  killBonus: 250,
}

export const ANIMALS: Record<string, AnimalType> = {
  // The star: a moose with a human face. Exactly one spawns per level.
  moosen: {
    id: 'moosen',
    name: 'Moosen',
    spec: { body: '#5c3d22', belly: '#4a3018', head: '#6b4a2b', leg: '#2f2013', bodyW: 32, antlers: true, ears: 'short', tail: 'stub', humanFace: true },
    size: [3.7, 3.1],
    fly: 0,
    speed: 0.3,
    fleeSpeed: 5.6,
    fps: { idle: 2, alert: 3, run: 10 },
    ...MOOSEN,
  },
  moose: {
    id: 'moose',
    name: 'Moose',
    spec: { body: '#5c3d22', belly: '#4a3018', head: '#6b4a2b', leg: '#2f2013', bodyW: 30, antlers: true, ears: 'short', tail: 'stub' },
    size: [3.4, 2.8],
    fly: 0,
    speed: 0.35,
    fleeSpeed: 6,
    fps: { idle: 2, alert: 3, run: 11 },
    ...NORMAL,
  },
  elk: {
    id: 'elk',
    name: 'Elk',
    spec: { body: '#7a5230', belly: '#6b4a2b', head: '#8a6238', leg: '#4a3018', bodyW: 26, antlers: true, ears: 'short', tail: 'stub' },
    size: [2.8, 2.4],
    fly: 0,
    speed: 0.4,
    fleeSpeed: 6.8,
    fps: { idle: 2, alert: 3, run: 12 },
    ...NORMAL,
  },
  deer: {
    id: 'deer',
    name: 'Deer',
    spec: { body: '#b08150', belly: '#d8c9a8', head: '#b8895a', leg: '#6b4a2b', bodyW: 22, ears: 'short', tail: 'stub' },
    size: [2.2, 2.0],
    fly: 0,
    speed: 0.5,
    fleeSpeed: 7.5,
    fps: { idle: 3, alert: 3, run: 13 },
    ...NORMAL,
  },
  rabbit: {
    id: 'rabbit',
    name: 'Rabbit',
    spec: { body: '#cfc9be', belly: '#efeae0', head: '#dcd6cc', leg: '#a89f92', bodyW: 12, ears: 'long', tail: 'stub' },
    size: [1.1, 1.1],
    fly: 0,
    speed: 0.6,
    fleeSpeed: 8.5,
    fps: { idle: 3, alert: 4, run: 15 },
    ...NORMAL,
  },
  fox: {
    id: 'fox',
    name: 'Fox',
    spec: { body: '#d1732a', belly: '#f0e6d8', head: '#d1732a', leg: '#3a2a1c', bodyW: 18, ears: 'short', tail: 'bushy' },
    size: [1.7, 1.4],
    fly: 0,
    speed: 0.55,
    fleeSpeed: 8.5,
    fps: { idle: 3, alert: 4, run: 14 },
    ...NORMAL,
  },
  grouse: {
    id: 'grouse',
    name: 'Grouse',
    spec: { body: '#7a5a3a', belly: '#a8865a', head: '#6b4a2b', leg: '#6b4a2b', bodyW: 16, bird: true },
    size: [1.5, 1.1],
    fly: 0, // sits on the ground, takes off when spooked
    speed: 0.3,
    fleeSpeed: 9.5,
    fps: { idle: 4, alert: 6, run: 14 },
    ...NORMAL,
  },
  mallard: {
    id: 'mallard',
    name: 'Mallard',
    spec: { body: '#6b5233', belly: '#b59a6a', head: '#2f7d3b', leg: '#d0a020', bodyW: 16, bird: true },
    size: [1.7, 1.2],
    fly: 0, // grounded by default; some spawn airborne (see Scene)
    speed: 0.3,
    fleeSpeed: 9,
    fps: { idle: 5, alert: 7, run: 16 },
    ...NORMAL,
    canFlyAcross: true,
  },
  // Park ranger — a human with a Moosen-like face (hat + mustache). DON'T shoot!
  ranger: {
    id: 'ranger',
    name: 'Park Ranger',
    spec: { body: '#3f5d3a', belly: '#2e2a20', head: '#dcb08a', leg: '#4a3a2a', bodyW: 12, human: true, faceId: 'lance', headScale: 1.45 },
    size: [2.0, 2.7],
    fly: 0,
    speed: 0.45,
    fleeSpeed: 6.5,
    fps: { idle: 2, alert: 2, run: 12 },
    health: 20,
    damage: { head: 20, heart: 20, body: 20 },
    killBonus: 0,
    penalty: 1000,
  },
  // The rare golden rabbit — Mahir's face, appears once per game (see Scene).
  golden: {
    id: 'golden',
    name: 'Golden Rabbit',
    spec: { body: '#f2c438', belly: '#ffe89a', head: '#f2c438', leg: '#c99a1e', bodyW: 12, ears: 'long', tail: 'stub', humanFace: true, faceId: 'mahir', headScale: 1.45 },
    size: [1.6, 1.6],
    fly: 0,
    speed: 0,
    fleeSpeed: 0,
    fps: { idle: 10, alert: 10, run: 18 },
    health: 1,
    damage: { head: 1, heart: 1, body: 1 },
    killBonus: 0,
    golden: true,
  },
}

// Head lift per animation state — MUST match makeAnimalFrames() in
// placeholders.ts (idle grazes head-down, alert/run raise it).
const HEAD_LIFT: Record<AnimalState, number> = { idle: 0.12, alert: 0.97, run: 0.7 }

// Bird hit boxes are static (its layout doesn't change much between states).
const BIRD_HIT: HitBoxes = {
  head: [0.6, 0.4, 0.82, 0.64],
  heart: [0.4, 0.36, 0.6, 0.56],
  body: [0.22, 0.28, 0.82, 0.72],
}

// Upright human (ranger) hit boxes — static across poses (head stays up).
const HUMAN_HIT: HitBoxes = {
  head: [0.39, 0.56, 0.6, 0.84],
  heart: [0.43, 0.37, 0.57, 0.5],
  body: [0.34, 0.08, 0.66, 0.84],
}

/** Canvas rect (top-left origin) → UV box (v flipped so v=1 is the top). */
function uvBox(
  x0: number,
  yTop: number,
  x1: number,
  yBot: number,
): [number, number, number, number] {
  return [x0 / SPRITE_W, 1 - yBot / SPRITE_H, x1 / SPRITE_W, 1 - yTop / SPRITE_H]
}

/**
 * Hit regions computed from the sprite's actual geometry for the given
 * animation state. Because the grazing (idle) pose draws the head low and the
 * alert/run poses raise it, the head box follows the head — so a shot on the
 * head you can *see* actually counts as a headshot in every pose.
 */
export function hitBoxesFor(type: AnimalType, state: AnimalState): HitBoxes {
  if (type.spec.human) return HUMAN_HIT
  if (type.spec.bird) return BIRD_HIT

  const bodyW = type.spec.bodyW ?? 24
  const bodyRight = 32 + bodyW / 2
  const bodyLeft = 32 - bodyW / 2
  const neckX = bodyRight - 6
  const headY = 30 - HEAD_LIFT[state] * 20 // matches drawQuadruped()

  return {
    head: uvBox(neckX + 1, headY - 3, Math.min(neckX + 15, SPRITE_W), headY + 11),
    heart: uvBox(32, 26, bodyRight - 2, 33),
    body: uvBox(bodyLeft - 2, Math.min(headY - 3, 20), bodyRight + 9, 44),
  }
}

/**
 * Resolves the sprite frames for an animal state. Procedural placeholder today;
 * to use real art later, replace the returned value with, e.g.
 *   { kind: 'gif', url: `/sprites/${type.id}-${state}.gif` }
 * or a sprite sheet — nothing else in the game needs to change.
 */
export function animalSource(type: AnimalType, state: AnimalState): SpriteSource {
  const usesFace = type.spec.humanFace || type.spec.human
  const faceId = type.spec.faceId ?? 'mason'
  return {
    kind: 'proc',
    make: () => makeAnimalFrames(type.spec, state),
    // face sprites must wait for their face image to load before rasterizing
    ...(usesFace ? { ready: () => ensureFace(faceId) } : {}),
  }
}

export function animalKey(type: AnimalType, state: AnimalState): string {
  return `${type.id}-${state}`
}

// Begin loading the face images as soon as this module is imported, so they're
// ready for the first sprites (and the tally diagram, which builds frames
// synchronously).
void ensureFace('mason')
void ensureFace('mahir')
void ensureFace('lance')

/** Which region (if any) a UV hit falls in; head > heart > body priority. */
export function regionAtUV(hit: HitBoxes, u: number, v: number): HitRegion | null {
  const inside = (b: [number, number, number, number]) =>
    u >= b[0] && u <= b[2] && v >= b[1] && v <= b[3]
  if (inside(hit.head)) return 'head'
  if (inside(hit.heart)) return 'heart'
  if (inside(hit.body)) return 'body'
  return null
}
