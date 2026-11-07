/**
 * Procedural placeholder sound effects, synthesized straight into sample
 * buffers (no audio files). These stand in until real arcade SFX are dropped
 * into public/sfx/ (see bufferFor() in sfx.ts for the drop-in path).
 *
 * Everything is built from noise bursts and plain oscillators — the audio
 * equivalent of the chunky canvas art in sprites/placeholders.ts. Samples are
 * mono, in roughly [-1, 1]; the player soft-clips whatever comes out.
 */

const TAU = Math.PI * 2

/** Renders one effect's mono samples at the given sample rate. */
export type Render = (sr: number) => Float32Array

type Wave = 'sine' | 'square' | 'saw' | 'tri'

const WAVES: Record<Wave, (phase: number) => number> = {
  sine: (p) => Math.sin(TAU * p),
  square: (p) => (p % 1 < 0.5 ? 1 : -1),
  saw: (p) => (p % 1) * 2 - 1,
  tri: (p) => 4 * Math.abs(((p + 0.25) % 1) - 0.5) - 1,
}

function buf(sr: number, seconds: number) {
  return new Float32Array(Math.max(1, Math.round(sr * seconds)))
}

/** Attack/decay envelope: fades in over `attack`, then decays with `tau`. */
function env(t: number, tau: number, attack: number) {
  const rise = attack > 0 ? 1 - Math.exp(-t / attack) : 1
  return rise * Math.exp(-t / tau)
}

interface Layer {
  /** start time within the buffer, seconds */
  at?: number
  dur: number
  amp?: number
  /** decay time constant; defaults to a third of the duration */
  tau?: number
  attack?: number
}

interface ToneLayer extends Layer {
  /** start frequency */
  f0: number
  /** end frequency, swept exponentially from f0 (defaults to no sweep) */
  f1?: number
  wave?: Wave
}

/** Mixes a pitch-swept oscillator into `out`. Phase is integrated, so a sweep
 *  never clicks. */
function tone(out: Float32Array, sr: number, o: ToneLayer) {
  const { f0, f1 = f0, wave = 'sine', dur, amp = 1, tau = dur / 3, attack = 0 } = o
  const i0 = Math.round((o.at ?? 0) * sr)
  const n = Math.round(dur * sr)
  const shape = WAVES[wave]
  let phase = 0
  for (let i = 0; i < n && i0 + i < out.length; i++) {
    const f = f0 * Math.pow(f1 / f0, n > 1 ? i / (n - 1) : 0)
    phase += f / sr
    out[i0 + i] += shape(phase) * amp * env(i / sr, tau, attack)
  }
}

/** One-pole filters over a scratch buffer, in place. */
function lowpass(data: Float32Array, sr: number, hz: number) {
  const a = 1 - Math.exp((-TAU * hz) / sr)
  let y = 0
  for (let i = 0; i < data.length; i++) {
    y += a * (data[i] - y)
    data[i] = y
  }
}

function highpass(data: Float32Array, sr: number, hz: number) {
  const a = 1 - Math.exp((-TAU * hz) / sr)
  let y = 0
  for (let i = 0; i < data.length; i++) {
    y += a * (data[i] - y)
    data[i] -= y
  }
}

/** Mixes a band-shaped noise burst into `out` — the basis of every crack,
 *  thump and rustle below. */
function burst(out: Float32Array, sr: number, o: Layer & { lp?: number; hp?: number }) {
  const { dur, amp = 1, tau = dur / 3, attack = 0 } = o
  const n = Math.round(dur * sr)
  const tmp = new Float32Array(n)
  for (let i = 0; i < n; i++) tmp[i] = Math.random() * 2 - 1
  if (o.lp) lowpass(tmp, sr, o.lp)
  if (o.hp) highpass(tmp, sr, o.hp)
  const i0 = Math.round((o.at ?? 0) * sr)
  for (let i = 0; i < n && i0 + i < out.length; i++) {
    out[i0 + i] += tmp[i] * amp * env(i / sr, tau, attack)
  }
}

/** A plucked arcade note: a bright lead with a softer octave under it. */
function note(out: Float32Array, sr: number, at: number, f: number, amp: number, dur: number) {
  tone(out, sr, { at, dur, f0: f, amp, tau: dur / 3, wave: 'square' })
  tone(out, sr, { at, dur, f0: f / 2, amp: amp * 0.45, tau: dur / 3, wave: 'tri' })
}

export const SOUNDS = {
  /** rifle crack: bright transient, low body thump, a short valley tail */
  shot: (sr) => {
    const out = buf(sr, 0.45)
    burst(out, sr, { dur: 0.25, amp: 0.9, tau: 0.035, hp: 900 })
    burst(out, sr, { dur: 0.45, amp: 0.3, tau: 0.17, lp: 700 })
    tone(out, sr, { dur: 0.18, f0: 180, f1: 45, amp: 0.7, tau: 0.07 })
    return out
  },

  /** the hammer falling on an empty chamber */
  dryFire: (sr) => {
    const out = buf(sr, 0.1)
    burst(out, sr, { dur: 0.05, amp: 0.5, tau: 0.006, hp: 2500 })
    tone(out, sr, { dur: 0.05, f0: 900, f1: 500, amp: 0.2, tau: 0.01, wave: 'square' })
    return out
  },

  /** shells going into the magazine */
  reload: (sr) => {
    const out = buf(sr, 0.6)
    for (const [at, f] of [
      [0, 1400],
      [0.17, 1150],
      [0.34, 1300],
    ]) {
      burst(out, sr, { at, dur: 0.06, amp: 0.35, tau: 0.008, hp: 1800 })
      tone(out, sr, { at, dur: 0.05, f0: f, f1: f * 0.6, amp: 0.18, tau: 0.012, wave: 'square' })
    }
    return out
  },

  /** the bolt snapping shut — loaded and ready */
  reloadDone: (sr) => {
    const out = buf(sr, 0.22)
    burst(out, sr, { dur: 0.05, amp: 0.45, tau: 0.01, hp: 1500 })
    burst(out, sr, { at: 0.08, dur: 0.08, amp: 0.55, tau: 0.012, hp: 1200 })
    tone(out, sr, { at: 0.08, dur: 0.09, f0: 520, f1: 300, amp: 0.25, tau: 0.02, wave: 'square' })
    return out
  },

  /** dull thwack into hide */
  hitBody: (sr) => {
    const out = buf(sr, 0.3)
    burst(out, sr, { dur: 0.18, amp: 0.5, tau: 0.035, lp: 800 })
    tone(out, sr, { dur: 0.2, f0: 150, f1: 70, amp: 0.5, tau: 0.06 })
    return out
  },

  /** wetter, with a little more pitch to it */
  hitHeart: (sr) => {
    const out = buf(sr, 0.32)
    burst(out, sr, { dur: 0.2, amp: 0.45, tau: 0.04, lp: 1200 })
    tone(out, sr, { dur: 0.22, f0: 230, f1: 80, amp: 0.5, tau: 0.07 })
    tone(out, sr, { at: 0.02, dur: 0.16, f0: 420, f1: 260, amp: 0.18, tau: 0.05, wave: 'tri' })
    return out
  },

  /** sharp crack plus the headshot ding */
  hitHead: (sr) => {
    const out = buf(sr, 0.55)
    burst(out, sr, { dur: 0.12, amp: 0.55, tau: 0.02, hp: 1500 })
    tone(out, sr, { dur: 0.12, f0: 300, f1: 120, amp: 0.4, tau: 0.04 })
    tone(out, sr, { at: 0.03, dur: 0.5, f0: 1760, amp: 0.3, tau: 0.16 })
    tone(out, sr, { at: 0.03, dur: 0.5, f0: 2640, amp: 0.14, tau: 0.12 })
    return out
  },

  /** a downed animal: the grunt, then the body hitting the ground */
  kill: (sr) => {
    const out = buf(sr, 0.65)
    tone(out, sr, { dur: 0.35, f0: 300, f1: 90, amp: 0.4, tau: 0.14, wave: 'saw' })
    burst(out, sr, { at: 0.25, dur: 0.32, amp: 0.4, tau: 0.08, lp: 500 })
    tone(out, sr, { at: 0.25, dur: 0.28, f0: 110, f1: 50, amp: 0.5, tau: 0.08 })
    return out
  },

  /** you shot a ranger — a harsh two-tone alarm */
  ranger: (sr) => {
    const out = buf(sr, 0.75)
    for (let k = 0; k < 2; k++) {
      const at = k * 0.3
      tone(out, sr, { at, dur: 0.26, f0: 140, amp: 0.35, tau: 0.13, wave: 'square' })
      tone(out, sr, { at, dur: 0.26, f0: 149, amp: 0.35, tau: 0.13, wave: 'square' })
      tone(out, sr, { at, dur: 0.26, f0: 70, amp: 0.25, tau: 0.13, wave: 'square' })
    }
    return out
  },

  /** the herd's heads come up */
  alert: (sr) => {
    const out = buf(sr, 0.36)
    tone(out, sr, { dur: 0.16, f0: 320, f1: 820, amp: 0.3, tau: 0.09, wave: 'square' })
    burst(out, sr, { dur: 0.32, amp: 0.22, tau: 0.1, hp: 1800 })
    return out
  },

  /** the scatter: a low rumble under a run of hoofbeats */
  stampede: (sr) => {
    const out = buf(sr, 1.3)
    burst(out, sr, { dur: 1.3, amp: 0.35, tau: 0.5, lp: 260, attack: 0.09 })
    let at = 0.02
    for (let i = 0; i < 14; i++) {
      burst(out, sr, { at, dur: 0.09, amp: 0.22, tau: 0.02, lp: 1400 })
      tone(out, sr, { at, dur: 0.1, f0: 120 + Math.random() * 40, f1: 60, amp: 0.18, tau: 0.03 })
      at += 0.055 + Math.random() * 0.04
    }
    return out
  },

  /** the hunt begins */
  levelStart: (sr) => {
    const out = buf(sr, 0.95)
    tone(out, sr, { dur: 0.7, f0: 196, amp: 0.3, tau: 0.3, wave: 'saw', attack: 0.05 })
    tone(out, sr, { dur: 0.7, f0: 294, amp: 0.2, tau: 0.28, wave: 'saw', attack: 0.07 })
    tone(out, sr, { at: 0.3, dur: 0.6, f0: 392, amp: 0.22, tau: 0.25, wave: 'saw', attack: 0.05 })
    return out
  },

  /** the golden rabbit breaks cover */
  goldenAppear: (sr) => {
    const out = buf(sr, 0.9)
    const notes = [1047, 1319, 1568, 2093, 2637]
    notes.forEach((f, k) => {
      tone(out, sr, { at: k * 0.07, dur: 0.5, f0: f, amp: 0.22, tau: 0.16 })
      tone(out, sr, { at: k * 0.07, dur: 0.3, f0: f * 2, amp: 0.08, tau: 0.09 })
    })
    return out
  },

  /** you got it — the jackpot fanfare */
  goldenKill: (sr) => {
    const out = buf(sr, 1.5)
    const notes = [523, 659, 784, 1047, 1319, 1568]
    notes.forEach((f, k) => note(out, sr, k * 0.09, f, 0.24, 0.6))
    for (let i = 0; i < 16; i++) {
      tone(out, sr, {
        at: 0.55 + i * 0.04,
        dur: 0.25,
        f0: 1500 + Math.random() * 2200,
        amp: 0.07,
        tau: 0.06,
      })
    }
    return out
  },

  /** menu button blip */
  uiClick: (sr) => {
    const out = buf(sr, 0.09)
    tone(out, sr, { dur: 0.06, f0: 1200, f1: 900, amp: 0.3, tau: 0.018, wave: 'square' })
    return out
  },

  /** one step of the score counter ratcheting up */
  tallyTick: (sr) => {
    const out = buf(sr, 0.05)
    tone(out, sr, { dur: 0.03, f0: 1800, amp: 0.18, tau: 0.008, wave: 'square' })
    return out
  },

  /** the score counter going the wrong way (a ranger in the tally) */
  tallyBad: (sr) => {
    const out = buf(sr, 0.45)
    tone(out, sr, { dur: 0.35, f0: 420, f1: 110, amp: 0.3, tau: 0.14, wave: 'square' })
    tone(out, sr, { dur: 0.35, f0: 432, f1: 113, amp: 0.2, tau: 0.14, wave: 'square' })
    return out
  },

  levelComplete: (sr) => {
    const out = buf(sr, 1.1)
    const mel: [number, number][] = [
      [0, 523],
      [0.12, 659],
      [0.24, 784],
      [0.38, 1047],
    ]
    for (const [at, f] of mel) note(out, sr, at, f, 0.26, 0.5)
    return out
  },

  huntComplete: (sr) => {
    const out = buf(sr, 2.1)
    const mel: [number, number][] = [
      [0, 523],
      [0.16, 523],
      [0.3, 784],
      [0.46, 659],
      [0.62, 784],
      [0.78, 1047],
      [1.0, 1319],
    ]
    for (const [at, f] of mel) note(out, sr, at, f, 0.24, 0.6)
    return out
  },

  scoreSubmit: (sr) => {
    const out = buf(sr, 0.7)
    note(out, sr, 0, 784, 0.24, 0.3)
    note(out, sr, 0.12, 1047, 0.24, 0.4)
    note(out, sr, 0.24, 1319, 0.24, 0.5)
    return out
  },
} satisfies Record<string, Render>

export type SoundId = keyof typeof SOUNDS
