import { useMemo } from 'react'
import { useFrames } from '../sprites/useFrames'
import { makeBushFrames, makeGrassFrames, makeTreeFrames } from '../sprites/placeholders'
import AnimatedSprite from '../sprites/AnimatedSprite'
import { useHeightField } from './TerrainContext'
import type { LevelConfig } from '../config/levels'

function rng(seed: number) {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Item {
  x: number
  z: number
  size: [number, number]
  offset: number
}

export default function Decorations({ cfg }: { cfg: LevelConfig }) {
  const hf = useHeightField()
  const pal = cfg.terrain.palette

  // Trees/grass are tinted from the biome palette so each level reads
  // differently (green forest, autumn, snowy, …).
  const treeFrames = useFrames(`tree-L${cfg.level}`, {
    kind: 'proc',
    make: () => makeTreeFrames(pal.mid, pal.high),
  })
  const grassFrames = useFrames(`grass-L${cfg.level}`, {
    kind: 'proc',
    make: () => makeGrassFrames(pal.low),
  })
  const bushFrames = useFrames(`bush-L${cfg.level}`, {
    kind: 'proc',
    // tinted from low/mid (greener) rather than the washed-out high colour
    make: () => makeBushFrames(pal.low, pal.mid),
  })

  const trees = useMemo<Item[]>(() => {
    const r = rng(cfg.terrain.seed)
    return Array.from({ length: cfg.trees }, () => {
      const scale = 0.8 + r() * 0.8
      return {
        x: (r() * 2 - 1) * 36,
        z: -36 + r() * 44,
        size: [4 * scale, 6 * scale] as [number, number],
        offset: r() * 4,
      }
    })
  }, [cfg])

  const grass = useMemo<Item[]>(() => {
    const r = rng(cfg.terrain.seed + 99)
    return Array.from({ length: cfg.grass }, () => ({
      x: (r() * 2 - 1) * 38,
      z: -38 + r() * 54,
      size: [1.4, 1.4] as [number, number],
      offset: r() * 3,
    }))
  }, [cfg])

  const bushes = useMemo<Item[]>(() => {
    const r = rng(cfg.terrain.seed + 321)
    return Array.from({ length: cfg.bushes }, () => {
      const scale = 0.85 + r() * 0.6
      return {
        x: (r() * 2 - 1) * 37,
        z: -37 + r() * 48,
        size: [2.4 * scale, 1.8 * scale] as [number, number],
        offset: r() * 3,
      }
    })
  }, [cfg])

  return (
    <group>
      {trees.map((t, i) => (
        <group
          key={`t${i}`}
          position={[t.x, hf.heightAt(t.x, t.z) + t.size[1] / 2, t.z]}
        >
          <AnimatedSprite frames={treeFrames} fps={3} size={t.size} offset={t.offset} />
        </group>
      ))}
      {grass.map((g, i) => (
        <group
          key={`g${i}`}
          position={[g.x, hf.heightAt(g.x, g.z) + g.size[1] / 2, g.z]}
        >
          <AnimatedSprite frames={grassFrames} fps={4} size={g.size} offset={g.offset} />
        </group>
      ))}
      {bushes.map((bsh, i) => (
        <group
          key={`b${i}`}
          position={[bsh.x, hf.heightAt(bsh.x, bsh.z) + bsh.size[1] / 2, bsh.z]}
        >
          <AnimatedSprite frames={bushFrames} fps={3} size={bsh.size} offset={bsh.offset} />
        </group>
      ))}
    </group>
  )
}
