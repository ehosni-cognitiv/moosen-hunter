import { createNoise2D } from 'simplex-noise'

/** Seedable PRNG so each level's terrain is deterministic but distinct. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface BiomePalette {
  low: string
  mid: string
  high: string
  sky: string
  fog: string
}

export interface TerrainParams {
  seed: number
  amplitude: number
  frequency: number
  octaves: number
  palette: BiomePalette
}

export interface HeightField {
  params: TerrainParams
  /** terrain surface height (world y) at a world (x, z) */
  heightAt: (x: number, z: number) => number
}

export function makeHeightField(params: TerrainParams): HeightField {
  const noise = createNoise2D(mulberry32(params.seed))

  const heightAt = (x: number, z: number) => {
    let amp = 1
    let freq = params.frequency
    let sum = 0
    let norm = 0
    for (let o = 0; o < params.octaves; o++) {
      sum += noise(x * freq, z * freq) * amp
      norm += amp
      amp *= 0.5
      freq *= 2
    }
    return (sum / norm) * params.amplitude
  }

  return { params, heightAt }
}
