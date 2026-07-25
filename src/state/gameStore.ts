import { create } from 'zustand'
import { TOTAL_LEVELS } from '../config/levels'
import type { HitRegion } from '../config/animals'
import type { AnimalState } from '../sprites/placeholders'
import { loadLeaderboard, saveScore, type ScoreEntry } from './leaderboard'

export type Phase = 'title' | 'playing' | 'levelComplete' | 'gameover' | 'leaderboard'

/** Herd behaviour: grazing → briefly alert (heads up) → scatter and flee. */
export type HerdPhase = 'calm' | 'alert' | 'flee'

export interface ShotRecord {
  region: HitRegion
  points: number
  /** where on the sprite it landed, for the tally diagram (v=1 top) */
  u: number
  v: number
  /** the animation pose when hit, so the tally can remap the marker */
  state: AnimalState
}

export interface AnimalResult {
  typeId: string
  name: string
  shots: ShotRecord[]
  killed: boolean
  bonus: number
}

const MAX_AMMO = 6
const RELOAD_MS = 1100
const ALERT_MS = 700

interface GameState {
  phase: Phase
  level: number
  totalScore: number
  ammo: number
  maxAmmo: number
  reloading: boolean
  herdPhase: HerdPhase
  levelResults: AnimalResult[]
  /** shots fired / shots that hit an animal this level (for accuracy) */
  levelShots: number
  levelHits: number
  /** accuracy bonus awarded at the end of the level (for the tally screen) */
  levelAccuracyBonus: number
  /** the one level (after level 2) the golden rabbit appears in, this game */
  goldenLevel: number
  /** bumped on every shot fired — the camera watches this to recoil/shake */
  recoilTick: number
  leaderboard: ScoreEntry[]

  startGame: () => void
  startLevel: (level: number) => void
  endLevel: () => void
  nextLevel: () => void
  submitScore: (name: string) => void
  showLeaderboard: () => void
  backToTitle: () => void

  fire: () => boolean
  /** Fire a round: handles ammo, auto-reload on empty, and spooks the herd.
      Returns true if a round was actually spent. */
  shoot: () => boolean
  reload: () => void
  /** Move the whole herd from calm → alert → flee. No-op unless calm. */
  alertHerd: () => void
  addScore: (points: number) => void
  addResult: (result: AnimalResult) => void
  /** record a shot that landed on an animal (for accuracy) */
  recordHit: () => void
}

const ACCURACY_BONUS_MAX = 200

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'title',
  level: 1,
  totalScore: 0,
  ammo: MAX_AMMO,
  maxAmmo: MAX_AMMO,
  reloading: false,
  herdPhase: 'calm',
  levelResults: [],
  levelShots: 0,
  levelHits: 0,
  levelAccuracyBonus: 0,
  goldenLevel: 0,
  recoilTick: 0,
  leaderboard: loadLeaderboard(),

  startGame: () => {
    // The golden rabbit appears exactly once per game, in a random level after
    // level 2 (guaranteed to show up in that one level).
    const goldenLevel = 3 + Math.floor(Math.random() * (TOTAL_LEVELS - 2))
    set({ totalScore: 0, goldenLevel })
    get().startLevel(1)
  },

  startLevel: (level) => {
    set({
      phase: 'playing',
      level,
      ammo: MAX_AMMO,
      maxAmmo: MAX_AMMO,
      reloading: false,
      herdPhase: 'calm',
      levelResults: [],
      levelShots: 0,
      levelHits: 0,
      levelAccuracyBonus: 0,
    })
  },

  endLevel: () => {
    if (get().phase !== 'playing') return
    const { levelShots, levelHits } = get()
    const accuracy = levelShots > 0 ? levelHits / levelShots : 0
    const bonus = Math.round(accuracy * ACCURACY_BONUS_MAX)
    set((s) => ({
      totalScore: s.totalScore + bonus,
      levelAccuracyBonus: bonus,
      phase: 'levelComplete',
    }))
  },

  nextLevel: () => {
    const next = get().level + 1
    if (next > TOTAL_LEVELS) set({ phase: 'gameover' })
    else get().startLevel(next)
  },

  submitScore: (name) => {
    const clean = name.trim().slice(0, 12).toUpperCase() || 'AAA'
    const board = saveScore({
      name: clean,
      score: get().totalScore,
      date: new Date().toISOString(),
    })
    set({ leaderboard: board, phase: 'leaderboard' })
  },

  showLeaderboard: () => set({ phase: 'leaderboard' }),
  backToTitle: () => set({ phase: 'title' }),

  fire: () => {
    const { ammo, reloading, phase } = get()
    if (phase !== 'playing' || reloading || ammo <= 0) return false
    set((s) => ({ ammo: s.ammo - 1 }))
    return true
  },

  shoot: () => {
    const s = get()
    if (!s.fire()) {
      if (!s.reloading) s.reload()
      return false
    }
    set((st) => ({ levelShots: st.levelShots + 1, recoilTick: st.recoilTick + 1 }))
    s.alertHerd()
    return true
  },

  reload: () => {
    const { reloading, ammo, maxAmmo } = get()
    if (reloading || ammo >= maxAmmo) return
    set({ reloading: true })
    setTimeout(() => {
      if (get().phase !== 'playing') {
        set({ reloading: false })
        return
      }
      set((s) => ({ ammo: s.maxAmmo, reloading: false }))
    }, RELOAD_MS)
  },

  alertHerd: () => {
    if (get().herdPhase !== 'calm') return
    set({ herdPhase: 'alert' })
    setTimeout(() => {
      if (get().phase === 'playing' && get().herdPhase === 'alert')
        set({ herdPhase: 'flee' })
    }, ALERT_MS)
  },

  addScore: (points) => set((s) => ({ totalScore: s.totalScore + points })),

  addResult: (result) =>
    set((s) => ({ levelResults: [...s.levelResults, result] })),

  recordHit: () => set((s) => ({ levelHits: s.levelHits + 1 })),
}))
