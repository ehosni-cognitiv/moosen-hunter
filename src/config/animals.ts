import { makeAnimalFrames, type AnimalState, type CritterSpec } from '../sprites/placeholders'
import type { SpriteSource } from '../sprites/frames'

/** Scoring rules (hit-location based). */
export const SCORING = {
  head: 100,
  heart: 50,
  body: 20,
  killBonus: 100,
  /** body shots needed to kill (head/heart are instant kills) */
  bodyHP: 3,
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
  hit: HitBoxes
  fps: { idle: number; alert: number; run: number }
}

const QUADRUPED_HIT: HitBoxes = {
  head: [0.72, 0.55, 1.0, 0.98],
  heart: [0.52, 0.26, 0.72, 0.5],
  body: [0.12, 0.08, 0.96, 0.64],
}

const BIRD_HIT: HitBoxes = {
  head: [0.6, 0.4, 0.82, 0.64],
  heart: [0.4, 0.36, 0.6, 0.56],
  body: [0.22, 0.28, 0.82, 0.72],
}

export const ANIMALS: Record<string, AnimalType> = {
  moose: {
    id: 'moose',
    name: 'Moose',
    spec: { body: '#5c3d22', belly: '#4a3018', head: '#6b4a2b', leg: '#2f2013', bodyW: 30, antlers: true, ears: 'short', tail: 'stub' },
    size: [3.4, 2.8],
    fly: 0,
    speed: 0.35,
    fleeSpeed: 6,
    hit: QUADRUPED_HIT,
    fps: { idle: 2, alert: 3, run: 11 },
  },
  elk: {
    id: 'elk',
    name: 'Elk',
    spec: { body: '#7a5230', belly: '#6b4a2b', head: '#8a6238', leg: '#4a3018', bodyW: 26, antlers: true, ears: 'short', tail: 'stub' },
    size: [2.8, 2.4],
    fly: 0,
    speed: 0.4,
    fleeSpeed: 6.8,
    hit: QUADRUPED_HIT,
    fps: { idle: 2, alert: 3, run: 12 },
  },
  deer: {
    id: 'deer',
    name: 'Deer',
    spec: { body: '#b08150', belly: '#d8c9a8', head: '#b8895a', leg: '#6b4a2b', bodyW: 22, ears: 'short', tail: 'stub' },
    size: [2.2, 2.0],
    fly: 0,
    speed: 0.5,
    fleeSpeed: 7.5,
    hit: QUADRUPED_HIT,
    fps: { idle: 3, alert: 3, run: 13 },
  },
  rabbit: {
    id: 'rabbit',
    name: 'Rabbit',
    spec: { body: '#cfc9be', belly: '#efeae0', head: '#dcd6cc', leg: '#a89f92', bodyW: 12, ears: 'long', tail: 'stub' },
    size: [1.1, 1.1],
    fly: 0,
    speed: 0.6,
    fleeSpeed: 8.5,
    hit: QUADRUPED_HIT,
    fps: { idle: 3, alert: 4, run: 15 },
  },
  fox: {
    id: 'fox',
    name: 'Fox',
    spec: { body: '#d1732a', belly: '#f0e6d8', head: '#d1732a', leg: '#3a2a1c', bodyW: 18, ears: 'short', tail: 'bushy' },
    size: [1.7, 1.4],
    fly: 0,
    speed: 0.55,
    fleeSpeed: 8.5,
    hit: QUADRUPED_HIT,
    fps: { idle: 3, alert: 4, run: 14 },
  },
  grouse: {
    id: 'grouse',
    name: 'Grouse',
    spec: { body: '#7a5a3a', belly: '#a8865a', head: '#6b4a2b', leg: '#6b4a2b', bodyW: 16, bird: true },
    size: [1.5, 1.1],
    fly: 2.2,
    speed: 0.3,
    fleeSpeed: 9.5,
    hit: BIRD_HIT,
    fps: { idle: 4, alert: 6, run: 14 },
  },
}

/**
 * Resolves the sprite frames for an animal state. Procedural placeholder today;
 * to use real art later, replace the returned value with, e.g.
 *   { kind: 'gif', url: `/sprites/${type.id}-${state}.gif` }
 * or a sprite sheet — nothing else in the game needs to change.
 */
export function animalSource(type: AnimalType, state: AnimalState): SpriteSource {
  return { kind: 'proc', make: () => makeAnimalFrames(type.spec, state) }
}

export function animalKey(type: AnimalType, state: AnimalState): string {
  return `${type.id}-${state}`
}

/** Which region (if any) a UV hit falls in; head > heart > body priority. */
export function regionAtUV(hit: HitBoxes, u: number, v: number): HitRegion | null {
  const inside = (b: [number, number, number, number]) =>
    u >= b[0] && u <= b[2] && v >= b[1] && v <= b[3]
  if (inside(hit.head)) return 'head'
  if (inside(hit.heart)) return 'heart'
  if (inside(hit.body)) return 'body'
  return null
}
