/**
 * Turns a sprite source into an array of Three.js frame textures.
 *
 * Three source kinds, so placeholder art works today and real art drops in
 * later with no code changes:
 *   - proc:  procedural canvases (the placeholders in placeholders.ts)
 *   - gif:   an animated .gif in public/sprites/ (decoded to frames)
 *   - sheet: a PNG sprite sheet in public/sprites/ (sliced into a frame grid)
 */
import { CanvasTexture, NearestFilter, SRGBColorSpace, type Texture } from 'three'
import { parseGIF, decompressFrames } from 'gifuct-js'

export type SpriteSource =
  | { kind: 'proc'; make: () => HTMLCanvasElement[]; ready?: () => Promise<void> }
  | { kind: 'gif'; url: string }
  | { kind: 'sheet'; url: string; cols: number; rows: number; count?: number }

function toTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const tex = new CanvasTexture(canvas)
  tex.magFilter = NearestFilter
  tex.minFilter = NearestFilter
  tex.generateMipmaps = false
  tex.colorSpace = SRGBColorSpace
  return tex
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

async function loadGifFrames(url: string): Promise<Texture[]> {
  const buf = await (await fetch(url)).arrayBuffer()
  const gif = parseGIF(buf)
  const frames = decompressFrames(gif, true)
  const w = gif.lsd.width
  const h = gif.lsd.height

  const stage = newCtx(w, h)
  const patch = newCtx(0, 0)
  const out: Texture[] = []

  for (const f of frames) {
    patch.canvas.width = f.dims.width
    patch.canvas.height = f.dims.height
    const imgData = patch.ctx.createImageData(f.dims.width, f.dims.height)
    imgData.data.set(f.patch)
    patch.ctx.putImageData(imgData, 0, 0)
    stage.ctx.drawImage(patch.canvas, f.dims.left, f.dims.top)

    const snap = newCtx(w, h)
    snap.ctx.drawImage(stage.canvas, 0, 0)
    out.push(toTexture(snap.canvas))

    if (f.disposalType === 2)
      stage.ctx.clearRect(f.dims.left, f.dims.top, f.dims.width, f.dims.height)
  }
  return out
}

async function loadSheetFrames(
  url: string,
  cols: number,
  rows: number,
  count?: number,
): Promise<Texture[]> {
  const img = await loadImage(url)
  const fw = img.width / cols
  const fh = img.height / rows
  const n = count ?? cols * rows
  const out: Texture[] = []
  for (let i = 0; i < n; i++) {
    const { canvas, ctx } = newCtx(fw, fh)
    ctx.drawImage(img, (i % cols) * fw, Math.floor(i / cols) * fh, fw, fh, 0, 0, fw, fh)
    out.push(toTexture(canvas))
  }
  return out
}

export async function loadFrames(src: SpriteSource): Promise<Texture[]> {
  if (src.kind === 'proc') {
    if (src.ready) await src.ready() // e.g. wait for the face image to load
    return src.make().map(toTexture)
  }
  if (src.kind === 'gif') return loadGifFrames(src.url)
  return loadSheetFrames(src.url, src.cols, src.rows, src.count)
}

function newCtx(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d')! }
}
