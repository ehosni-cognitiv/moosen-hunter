/**
 * Sound-effect playback: one shared AudioContext, each effect rendered once
 * into an AudioBuffer and cached (the audio twin of the texture cache in
 * sprites/useFrames.ts).
 *
 * Buffers come from the procedural placeholders in placeholders.ts. To use
 * real audio later, swap the body of bufferFor() for a fetch +
 * decodeAudioData of `/sfx/${id}.wav` — nothing that calls playSfx() changes.
 */
import { SOUNDS, type SoundId } from './placeholders'

export type { SoundId }

const MASTER_GAIN = 0.45
const STORAGE_KEY = 'moosen-hunter.muted.v1'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = loadMuted()
const cache = new Map<SoundId, AudioBuffer>()

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setMuted(next: boolean) {
  muted = next
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
  } catch {
    // ignore write failures (private mode, quota, etc.)
  }
}

/** The shared context, created on first use. Browsers only allow audio after a
 *  user gesture, so this stays null until the player clicks something. */
function audio(): AudioContext | null {
  if (!ctx) {
    if (typeof AudioContext === 'undefined') return null
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = MASTER_GAIN
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function bufferFor(c: AudioContext, id: SoundId): AudioBuffer {
  const cached = cache.get(id)
  if (cached) return cached
  const samples = SOUNDS[id](c.sampleRate)
  const buffer = c.createBuffer(1, samples.length, c.sampleRate)
  const out = buffer.getChannelData(0)
  // tanh soft-clips the stacked layers instead of letting them wrap
  for (let i = 0; i < samples.length; i++) out[i] = Math.tanh(samples[i])
  cache.set(id, buffer)
  return buffer
}

/**
 * Plays a sound effect. No-op while muted or before audio is available.
 * `rate` repitches it (handy for per-shot variation), `gain` attenuates it.
 */
export function playSfx(id: SoundId, opts: { gain?: number; rate?: number } = {}) {
  if (muted) return
  const c = audio()
  if (!c || !master) return

  const src = c.createBufferSource()
  src.buffer = bufferFor(c, id)
  src.playbackRate.value = opts.rate ?? 1

  if (opts.gain != null && opts.gain !== 1) {
    const g = c.createGain()
    g.gain.value = opts.gain
    src.connect(g).connect(master)
  } else {
    src.connect(master)
  }
  src.start()
}

/** A touch of per-shot pitch variation, so repeated hits don't sound machined. */
export const vary = (spread = 0.06) => 1 + (Math.random() * 2 - 1) * spread
