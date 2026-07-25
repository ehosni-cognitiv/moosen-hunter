import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import { DoubleSide } from 'three'
import { useGameStore, type AnimalResult } from '../state/gameStore'
import { LEVELS } from '../config/levels'
import { ANIMALS } from '../config/animals'
import { makeHeightField } from './heightfield'
import { TerrainContext } from './TerrainContext'
import Terrain from './Terrain'
import Decorations from './Decorations'
import Animal, { type AnimalInstance } from './Animal'
import GoldenRabbit from './GoldenRabbit'

const GOLDEN_ID = -1

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
  const goldenLevel = useGameStore((s) => s.goldenLevel)
  const addResult = useGameStore((s) => s.addResult)
  const alertHerd = useGameStore((s) => s.alertHerd)
  const endLevel = useGameStore((s) => s.endLevel)
  const cfg = LEVELS[level - 1]
  const isGoldenLevel = level === goldenLevel

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
    return Array.from({ length: cfg.animalCount }, (_, i) => {
      const type = i === 0 ? ANIMALS.moosen : pickType(cfg, r)
      const base = { id: i, type, fleeMult: cfg.fleeMult, offset: i }

      // ~half of "fly across" birds (mallards) start airborne, drifting slowly
      // across the screen; the rest start grounded like everything else.
      if (type.canFlyAcross && r() < 0.5) {
        const dir = r() < 0.5 ? 1 : -1
        return {
          ...base,
          x: -dir * (12 + r() * 8), // enter from a side...
          z: -6 - r() * 9,
          flyOverride: 4 + r() * 2.5, // ...up in the air
          crossVel: { x: dir * (1.3 + r() * 0.9), z: (r() - 0.5) * 0.5 },
        }
      }
      return { ...base, x: (r() * 2 - 1) * 14, z: -3 - r() * 15 }
    })
  }, [cfg])

  const [remaining, setRemaining] = useState(() => herd.map((h) => h.id))
  const [goldenGone, setGoldenGone] = useState(false)
  const resolvedCount = useRef(0)
  const total = herd.length + (isGoldenLevel ? 1 : 0)

  // Reset when the level (herd) changes.
  useEffect(() => {
    resolvedCount.current = 0
    setRemaining(herd.map((h) => h.id))
    setGoldenGone(false)
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
      if (id === GOLDEN_ID) setGoldenGone(true)
      else setRemaining((prev) => prev.filter((x) => x !== id))
      if (resolvedCount.current >= total) {
        setTimeout(() => endLevel(), 600)
      }
    },
    [addResult, endLevel, total],
  )

  // A shot that hits no animal — fires on pointer DOWN (via the catcher mesh
  // below) so shooting/recoil is instant, not delayed to pointer-up.
  const handleMiss = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return // left button only
    const st = useGameStore.getState()
    // shoot() spends a round, spooks the herd and bumps recoil; it counts as a
    // shot (not a hit), so accuracy handles the "miss" implicitly.
    if (!st.shoot() && !st.reloading) st.reload() // auto-reload on empty
  }, [])

  const pal = cfg.terrain.palette

  return (
    <TerrainContext.Provider value={hf}>
      <color attach="background" args={[pal.sky]} />
      <fog attach="fog" args={[pal.fog, 34, 95]} />

      <ambientLight intensity={0.7} />
      <hemisphereLight args={[pal.sky, pal.low, 0.6]} />
      <directionalLight position={[10, 18, 8]} intensity={1.3} castShadow />

      {/* invisible catch-all behind everything: turns a click that hits no
          animal into an instant (pointer-down) miss */}
      <mesh position={[0, 6, 18]} onPointerDown={handleMiss}>
        <sphereGeometry args={[80, 8, 6]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} side={DoubleSide} />
      </mesh>

      <Terrain hf={hf} />
      <Decorations cfg={cfg} />

      {herd
        .filter((h) => remaining.includes(h.id))
        .map((inst) => (
          <Animal key={inst.id} inst={inst} onResolve={handleResolve} />
        ))}

      {isGoldenLevel && !goldenGone && (
        <GoldenRabbit
          id={GOLDEN_ID}
          spawnDelay={cfg.planTime / 2}
          onResolve={handleResolve}
        />
      )}
    </TerrainContext.Provider>
  )
}
