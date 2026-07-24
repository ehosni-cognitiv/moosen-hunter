/**
 * Procedural placeholder sprite art, drawn to <canvas> (no Three.js here).
 * These stand in until real pixel-art GIF/PNG assets are dropped into
 * public/sprites/ (see loadFrames() in frames.ts for the drop-in path).
 *
 * Everything is drawn at a small pixel resolution and later upscaled with
 * NEAREST filtering, so it reads as chunky pixel art. Animals face RIGHT.
 */

import masonUrl from '../assets/mason.png'

export type AnimalState = 'idle' | 'alert' | 'run'

export interface CritterSpec {
  body: string
  belly: string
  head: string
  leg: string
  bodyW: number // body block width in px
  antlers?: boolean
  ears?: 'none' | 'long' | 'short'
  tail?: 'none' | 'bushy' | 'stub'
  bird?: boolean
  /** draw a (human) face as the head instead of an animal muzzle (the Moosen) */
  humanFace?: boolean
  /** draw an upright human figure (park ranger) instead of a quadruped */
  human?: boolean
}

// Animal sprite *logical* dimensions. Exported so hit-region math in
// animals.ts stays in sync (UV is normalized, so the logical size is what
// matters). Frames are rasterized at SPRITE_SCALE× for extra pixel detail.
export const SPRITE_W = 64
export const SPRITE_H = 48
const AW = SPRITE_W
const AH = SPRITE_H
const SPRITE_SCALE = 2

function newCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/** A 2×-resolution canvas with the drawing context scaled to logical coords. */
function animalCanvas() {
  const c = newCanvas(AW * SPRITE_SCALE, AH * SPRITE_SCALE)
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.scale(SPRITE_SCALE, SPRITE_SCALE)
  return { c, ctx }
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

// Resolution the photo is downsampled to for the pixelated look. Higher = more
// facial detail (but chunkier only up to the on-screen head size).
const FACE_W = 34
const FACE_H = 40
let faceCanvas: HTMLCanvasElement | null = null
let facePromise: Promise<void> | null = null

/**
 * Loads src/assets/mason.png and bakes a pixelated version of it into a canvas,
 * once. Because it's loaded (not hard-coded), swapping the PNG updates the
 * Moosen/ranger face with no code changes. Awaited before face sprites build
 * (see loadFrames), so the face is always ready when drawn.
 */
export function ensureFace(): Promise<void> {
  if (facePromise) return facePromise
  facePromise = new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const c = newCanvas(FACE_W, FACE_H)
      const g = c.getContext('2d')!
      g.imageSmoothingEnabled = true // box-filter down to the low-res grid
      const s = Math.min(FACE_W / img.width, FACE_H / img.height)
      const dw = img.width * s
      const dh = img.height * s
      g.drawImage(img, (FACE_W - dw) / 2, (FACE_H - dh) / 2, dw, dh)
      faceCanvas = c
      resolve()
    }
    img.onerror = () => resolve() // fall back to a plain head if it can't load
    img.src = masonUrl
  })
  return facePromise
}

/** The pixelated face canvas, shared by the Moosen and ranger, or null if the
 *  image hasn't loaded yet (ensureFace() gates that for sprite building). */
function getFace(): HTMLCanvasElement | null {
  return faceCanvas
}

/** One quadruped frame. headLift 0=grazing, 1=head high; legPhase animates gait. */
function drawQuadruped(
  spec: CritterSpec,
  headLift: number,
  legPhase: number,
): HTMLCanvasElement {
  const { c, ctx } = animalCanvas()
  const baseline = 44
  const bodyBottom = 34
  const bodyTop = 22
  const bodyLeft = 32 - spec.bodyW / 2
  const bodyRight = bodyLeft + spec.bodyW

  // legs (front pair + back pair swing opposite)
  const swing = Math.sin(legPhase * Math.PI * 2) * 3
  const legY = bodyBottom
  const legH = baseline - legY
  px(ctx, bodyLeft + 2 + swing, legY, 4, legH, spec.leg) // back-far
  px(ctx, bodyRight - 8 - swing, legY, 4, legH, spec.leg) // front-far
  px(ctx, bodyLeft + 4 - swing, legY, 4, legH, spec.leg) // back-near
  px(ctx, bodyRight - 6 + swing, legY, 4, legH, spec.leg) // front-near

  // body
  px(ctx, bodyLeft, bodyTop, spec.bodyW, bodyBottom - bodyTop, spec.body)
  px(ctx, bodyLeft, bodyBottom - 4, spec.bodyW, 4, spec.belly)

  // tail
  if (spec.tail === 'bushy') px(ctx, bodyLeft - 5, bodyTop + 2, 6, 8, spec.body)
  else if (spec.tail === 'stub') px(ctx, bodyLeft - 3, bodyTop + 3, 3, 4, spec.belly)

  // neck + head (head at front/right, raised by headLift)
  const headY = 30 - headLift * 20 // 30 (down) .. 10 (up)
  const neckX = bodyRight - 6
  px(ctx, neckX, headY + 4, 6, bodyTop + 2 - (headY + 4) + 8, spec.body) // neck

  if (spec.humanFace) {
    // blit the pixelated photo face into the head box
    ctx.imageSmoothingEnabled = false
    const face = getFace()
    if (face) ctx.drawImage(face, neckX, headY - 3, 14, 15)
    else px(ctx, neckX + 1, headY, 12, 12, '#dcb08a') // fallback while loading
  } else {
    px(ctx, neckX + 2, headY, 12, 10, spec.head) // head block
    px(ctx, neckX + 12, headY + 3, 3, 4, spec.head) // snout
    px(ctx, neckX + 5, headY + 2, 2, 2, '#0d0d10') // eye

    // ears
    if (spec.ears === 'long') {
      px(ctx, neckX + 3, headY - 8, 2, 8, spec.head)
      px(ctx, neckX + 7, headY - 8, 2, 8, spec.head)
    } else if (spec.ears === 'short') {
      px(ctx, neckX + 3, headY - 3, 2, 3, spec.head)
    }
  }

  // antlers
  if (spec.antlers) {
    const ax = neckX + 4
    const ay = headY - 2
    px(ctx, ax, ay - 8, 2, 8, '#c9b78a')
    px(ctx, ax - 4, ay - 6, 5, 2, '#c9b78a')
    px(ctx, ax - 4, ay - 10, 2, 4, '#c9b78a')
    px(ctx, ax + 6, ay - 8, 2, 8, '#c9b78a')
    px(ctx, ax + 6, ay - 6, 5, 2, '#c9b78a')
    px(ctx, ax + 9, ay - 12, 2, 6, '#c9b78a')
  }

  return c
}

/** A simple flying bird frame. wing 0..1 controls flap. */
function drawBird(spec: CritterSpec, wing: number): HTMLCanvasElement {
  const { c, ctx } = animalCanvas()
  const cx = 30
  const cy = 24
  px(ctx, cx - 8, cy - 2, 16, 6, spec.body) // body
  px(ctx, cx + 7, cy - 3, 6, 5, spec.head) // head
  px(ctx, cx + 12, cy - 1, 3, 2, '#ffcf4d') // beak
  px(ctx, cx + 9, cy - 2, 2, 2, '#0d0d10') // eye
  const wy = cy - 2 - wing * 8
  px(ctx, cx - 6, wy, 10, 4, spec.belly) // near wing
  px(ctx, cx - 2, cy + 2 + wing * 6, 10, 4, spec.belly) // far wing
  return c
}

/** An upright human figure (park ranger). legPhase animates a walk/run. */
function drawHuman(spec: CritterSpec, legPhase: number): HTMLCanvasElement {
  const { c, ctx } = animalCanvas()
  const cx = 32
  const swing = Math.sin(legPhase * Math.PI * 2) * 2.5

  // legs (pants)
  px(ctx, cx - 4 + swing, 34, 3, 10, spec.leg)
  px(ctx, cx + 1 - swing, 34, 3, 10, spec.leg)
  // torso (uniform) + belt
  px(ctx, cx - 6, 22, 12, 13, spec.body)
  px(ctx, cx - 6, 31, 12, 2, spec.belly)
  // arms
  px(ctx, cx - 9, 23, 3, 9, spec.body)
  px(ctx, cx + 6, 23, 3, 9, spec.body)
  // head: the ranger face (same pixelated photo as the Moosen)
  ctx.imageSmoothingEnabled = false
  const face = getFace()
  if (face) ctx.drawImage(face, cx - 8, 6, 16, 17)
  else px(ctx, cx - 6, 8, 12, 13, '#dcb08a') // fallback while loading

  return c
}

export function makeAnimalFrames(
  spec: CritterSpec,
  state: AnimalState,
): HTMLCanvasElement[] {
  if (spec.human) {
    // ranger: paces while idle, walks/runs when spooked
    if (state === 'run')
      return [drawHuman(spec, 0), drawHuman(spec, 0.25), drawHuman(spec, 0.5), drawHuman(spec, 0.75)]
    if (state === 'idle') return [drawHuman(spec, 0), drawHuman(spec, 0.5)]
    return [drawHuman(spec, 0)]
  }
  if (spec.bird) {
    if (state === 'idle')
      return [drawBird(spec, 0.2), drawBird(spec, 0.4)]
    return [drawBird(spec, 0), drawBird(spec, 0.6), drawBird(spec, 1)]
  }
  switch (state) {
    case 'idle': // grazing bob
      return [drawQuadruped(spec, 0.05, 0), drawQuadruped(spec, 0.2, 0)]
    case 'alert': // head high, still
      return [drawQuadruped(spec, 1, 0), drawQuadruped(spec, 0.95, 0)]
    case 'run': // head forward-ish, legs cycling
      return [
        drawQuadruped(spec, 0.7, 0),
        drawQuadruped(spec, 0.7, 0.25),
        drawQuadruped(spec, 0.7, 0.5),
        drawQuadruped(spec, 0.7, 0.75),
      ]
  }
}

/** Tree: trunk + 2 foliage tiers; foliage top sways across frames. */
export function makeTreeFrames(
  foliage: string,
  foliage2: string,
  trunk = '#5b3d24',
): HTMLCanvasElement[] {
  const W = 48
  const H = 72
  const frames: HTMLCanvasElement[] = []
  for (const sway of [-2, 0, 2, 0]) {
    const c = newCanvas(W, H)
    const ctx = c.getContext('2d')!
    px(ctx, W / 2 - 4, 50, 8, 22, trunk)
    // lower tier (wide)
    ctx.fillStyle = foliage
    tri(ctx, W / 2 + sway * 0.3, 18, 22, 40)
    // upper tier (narrow, sways more)
    ctx.fillStyle = foliage2
    tri(ctx, W / 2 + sway, 6, 15, 26)
    frames.push(c)
  }
  return frames
}

/** Grass tuft: a few blades bending in the wind across frames. */
export function makeGrassFrames(color = '#4f7a3a'): HTMLCanvasElement[] {
  const W = 24
  const H = 24
  const frames: HTMLCanvasElement[] = []
  for (const bend of [-2, 0, 2]) {
    const c = newCanvas(W, H)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = color
    for (const bx of [6, 11, 16]) {
      ctx.beginPath()
      ctx.moveTo(bx - 2, H)
      ctx.lineTo(bx + 2, H)
      ctx.lineTo(bx + bend + 1, 6)
      ctx.closePath()
      ctx.fill()
    }
    frames.push(c)
  }
  return frames
}

function tri(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  halfW: number,
  h: number,
) {
  ctx.beginPath()
  ctx.moveTo(cx, top)
  ctx.lineTo(cx - halfW, top + h)
  ctx.lineTo(cx + halfW, top + h)
  ctx.closePath()
  ctx.fill()
}
