import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore, type AnimalResult } from '../state/gameStore'
import { LEVELS } from '../config/levels'
import { ANIMALS } from '../config/animals'
import { makeHeightField } from './heightfield'
import { TerrainContext } from './TerrainContext'
import Terrain from './Terrain'
import Decorations from './Decorations'
import Animal, { type AnimalInstance } from './Animal'

function pickType(cfg: (typeof LEVELS)[number], r: () => number) {
  const total = cfg.spawns.reduce((s, x) => s + x.weight, 0)
  let n = r() * total
  for (const s of cfg.spawns) {
    n -= s.weight
    if (n <= 0) return ANIMALS[s.type]
  }
  return ANIMALS[cfg.spawns[0].type]
}

export default function Scene() {
  const level = useGameStore((s) => s.level)
  const addResult = useGameStore((s) => s.addResult)
  const alertHerd = useGameStore((s) => s.alertHerd)
  const endLevel = useGameStore((s) => s.endLevel)
  const cfg = LEVELS[level - 1]

  const hf = useMemo(() => makeHeightField(cfg.terrain), [cfg])

  // Build the herd once per level.
  const herd = useMemo<AnimalInstance[]>(() => {
    let seed = cfg.terrain.seed + 500
    const r = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    // Exactly one Moosen per level (index 0); the rest are drawn from the
    // level's weighted spawn table (which never includes the Moosen).
    return Array.from({ length: cfg.animalCount }, (_, i) => ({
      id: i,
      type: i === 0 ? ANIMALS.moosen : pickType(cfg, r),
      x: (r() * 2 - 1) * 14,
      z: -3 - r() * 15, // -3 .. -18, in front of the camera
      fleeMult: cfg.fleeMult,
      offset: i,
    }))
  }, [cfg])

  const [remaining, setRemaining] = useState(() => herd.map((h) => h.id))
  const resolvedCount = useRef(0)

  // Reset when the level (herd) changes.
  useEffect(() => {
    resolvedCount.current = 0
    setRemaining(herd.map((h) => h.id))
  }, [herd])

  // Herd spooks on its own if the hunter waits too long.
  useEffect(() => {
    const t = setTimeout(() => alertHerd(), cfg.planTime * 1000)
    return () => clearTimeout(t)
  }, [cfg, alertHerd])

  const handleResolve = useCallback(
    (id: number, result: AnimalResult) => {
      addResult(result)
      resolvedCount.current += 1
      setRemaining((prev) => prev.filter((x) => x !== id))
      if (resolvedCount.current >= herd.length) {
        setTimeout(() => endLevel(), 600)
      }
    },
    [addResult, endLevel, herd.length],
  )

  const pal = cfg.terrain.palette

  return (
    <TerrainContext.Provider value={hf}>
      <color attach="background" args={[pal.sky]} />
      <fog attach="fog" args={[pal.fog, 34, 95]} />

      <ambientLight intensity={0.7} />
      <hemisphereLight args={[pal.sky, pal.low, 0.6]} />
      <directionalLight position={[10, 18, 8]} intensity={1.3} castShadow />

      <Terrain hf={hf} />
      <Decorations cfg={cfg} />

      {herd
        .filter((h) => remaining.includes(h.id))
        .map((inst) => (
          <Animal key={inst.id} inst={inst} onResolve={handleResolve} />
        ))}
    </TerrainContext.Provider>
  )
}
