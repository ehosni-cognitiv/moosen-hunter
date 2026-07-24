import type { BiomePalette } from '../game/heightfield'

export interface SpawnWeight {
  type: string
  weight: number
}

export interface LevelConfig {
  level: number
  name: string
  /** number of animals standing in the herd at level start */
  animalCount: number
  /** multiplier on each animal's flee speed (harder = faster escapes) */
  fleeMult: number
  /** seconds the herd stays calm before spooking on its own */
  planTime: number
  spawns: SpawnWeight[]
  terrain: {
    seed: number
    amplitude: number
    frequency: number
    octaves: number
    palette: BiomePalette
  }
  /** scenery billboard counts */
  trees: number
  grass: number
}

interface Biome {
  name: string
  palette: BiomePalette
  amplitude: number
  frequency: number
  trees: number
  grass: number
}

// 10 hand-tuned biomes — each level looks and feels different.
const BIOMES: Biome[] = [
  { name: 'Pinecrest Glade', amplitude: 2.5, frequency: 0.05, trees: 16, grass: 50,
    palette: { low: '#2f5a2e', mid: '#3f6b3a', high: '#6a8a4a', sky: '#9fb9c9', fog: '#9fb9c9' } },
  { name: 'Birchwood Hollow', amplitude: 3, frequency: 0.045, trees: 14, grass: 55,
    palette: { low: '#4a6b34', mid: '#6a8f45', high: '#9bb36a', sky: '#bcd3d8', fog: '#bcd3d8' } },
  { name: 'Foggy Fen', amplitude: 1.8, frequency: 0.06, trees: 10, grass: 60,
    palette: { low: '#28413a', mid: '#37564a', high: '#5a7360', sky: '#8fa6a3', fog: '#7e9490' } },
  { name: 'Cedar Ridge', amplitude: 4, frequency: 0.05, trees: 18, grass: 40,
    palette: { low: '#4a4030', mid: '#5f6b3a', high: '#8a8560', sky: '#a9bcc4', fog: '#a9bcc4' } },
  { name: 'Elk Pass', amplitude: 5, frequency: 0.04, trees: 12, grass: 35,
    palette: { low: '#3d5a3a', mid: '#6a7a55', high: '#b7b7a6', sky: '#c2d2da', fog: '#c2d2da' } },
  { name: 'Timberfall', amplitude: 3.2, frequency: 0.05, trees: 20, grass: 45,
    palette: { low: '#6b3f1f', mid: '#a5601f', high: '#d19a3a', sky: '#d8bfa0', fog: '#d8bfa0' } },
  { name: 'Frostpine Ravine', amplitude: 4.5, frequency: 0.045, trees: 10, grass: 20,
    palette: { low: '#5a6b7a', mid: '#9db0bd', high: '#eef3f7', sky: '#cfdae2', fog: '#cfdae2' } },
  { name: 'Old Growth', amplitude: 3, frequency: 0.055, trees: 24, grass: 55,
    palette: { low: '#1f3a24', mid: '#2f5230', high: '#4f6b3a', sky: '#7d9489', fog: '#6f867c' } },
  { name: 'Wolf Creek', amplitude: 3.5, frequency: 0.05, trees: 16, grass: 40,
    palette: { low: '#3a3550', mid: '#6b5a55', high: '#a58a6a', sky: '#8a7d9a', fog: '#8a7d9a' } },
  { name: 'Grandmoose Summit', amplitude: 6, frequency: 0.04, trees: 8, grass: 15,
    palette: { low: '#5a6070', mid: '#aab3c0', high: '#ffffff', sky: '#b9c6d6', fog: '#b9c6d6' } },
]

function spawnsFor(level: number): SpawnWeight[] {
  const t = (level - 1) / 9
  return [
    { type: 'moose', weight: 6 },
    { type: 'deer', weight: 4 },
    { type: 'elk', weight: level >= 3 ? 3 : 0 },
    { type: 'fox', weight: level >= 4 ? 2 : 0 },
    { type: 'rabbit', weight: level >= 2 ? 3 : 0 },
    { type: 'grouse', weight: level >= 5 ? 2 + Math.round(t * 2) : 0 },
    // park rangers (avoid!) start showing up early and get more common
    { type: 'ranger', weight: level >= 2 ? 2 + Math.round(t * 3) : 0 },
  ].filter((s) => s.weight > 0)
}

export const LEVELS: LevelConfig[] = BIOMES.map((b, i) => {
  const level = i + 1
  const t = i / 9
  return {
    level,
    name: b.name,
    animalCount: Math.round(2 + t * 8), // 2 → 10
    fleeMult: Number((1 + t * 0.6).toFixed(2)), // 1.0 → 1.6
    planTime: 22,
    spawns: spawnsFor(level),
    terrain: {
      seed: level * 1013 + 7,
      amplitude: b.amplitude,
      frequency: b.frequency,
      octaves: 4,
      palette: b.palette,
    },
    trees: b.trees,
    grass: b.grass,
  }
})

export const TOTAL_LEVELS = LEVELS.length
