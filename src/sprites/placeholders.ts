/**
 * Procedural placeholder sprite art, drawn to <canvas> (no Three.js here).
 * These stand in until real pixel-art GIF/PNG assets are dropped into
 * public/sprites/ (see loadFrames() in frames.ts for the drop-in path).
 *
 * Everything is drawn at a small pixel resolution and later upscaled with
 * NEAREST filtering, so it reads as chunky pixel art. Animals face RIGHT.
 */

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
}

// Animal sprite canvas dimensions. Exported so hit-region math in animals.ts
// stays in sync with how the critters are actually drawn here.
export const SPRITE_W = 64
export const SPRITE_H = 48
const AW = SPRITE_W
const AH = SPRITE_H

function newCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
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

/** One quadruped frame. headLift 0=grazing, 1=head high; legPhase animates gait. */
function drawQuadruped(
  spec: CritterSpec,
  headLift: number,
  legPhase: number,
): HTMLCanvasElement {
  const c = newCanvas(AW, AH)
  const ctx = c.getContext('2d')!
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
  const c = newCanvas(AW, AH)
  const ctx = c.getContext('2d')!
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

export function makeAnimalFrames(
  spec: CritterSpec,
  state: AnimalState,
): HTMLCanvasElement[] {
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
