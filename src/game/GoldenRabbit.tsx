import { useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import type { Group } from 'three'
import { useGameStore, type AnimalResult, type ShotRecord } from '../state/gameStore'
import {
  ANIMALS,
  GOLDEN,
  animalKey,
  animalSource,
  hitBoxesFor,
  regionAtUV,
} from '../config/animals'
import { useHeightField } from './TerrainContext'
import { useFrames } from '../sprites/useFrames'
import AnimatedSprite from '../sprites/AnimatedSprite'

// A bit faster than a fleeing animal (~1.25×), but catchable.
const SPEED = 10
const ZIG_RATE = 7 // perpendicular zig-zag speed
const DEATH_TIME = 0.45 // shrink-out duration when killed
const SPIN_SPEED = 22 // radians/sec it spins while dying

// Travel extents just beyond the visible area, per axis.
const X_EDGE = 22 // left/right entry & exit
const Z_FAR = -24 // deep (top of view)
const Z_NEAR = 8 // close (bottom of view, past the herd)
// Zig-zag bounds on the perpendicular axis.
const Z_ZIG_NEAR = -3
const Z_ZIG_FAR = -14
const X_ZIG = 12

type Axis = 'x' | 'z'

/**
 * The rare golden rabbit. It waits, then (halfway through the grazing window)
 * dashes in from off-screen, weaving in a zig-zag across the map at double
 * speed until it exits. One hit kills it: +1000, and +2000 more on a headshot.
 */
export default function GoldenRabbit({
  id,
  spawnDelay,
  onResolve,
}: {
  id: number
  spawnDelay: number
  onResolve: (id: number, result: AnimalResult) => void
}) {
  const type = ANIMALS.golden
  const hf = useHeightField()
  const runF = useFrames(animalKey(type, 'run'), animalSource(type, 'run'))

  const group = useRef<Group>(null)
  const elapsed = useRef(0)
  const [active, setActive] = useState(false)
  const [flipX, setFlipX] = useState(false)
  const axis = useRef<Axis>('x') // which way it crosses the map
  const dir = useRef<1 | -1>(1) // direction along the cross axis
  const x = useRef(0)
  const z = useRef(-8)
  const zigDir = useRef<1 | -1>(1) // direction along the perpendicular axis
  const resolved = useRef(false)
  const dying = useRef(false)
  const deadT = useRef(0)
  const roll = useRef(0)
  const killShot = useRef<ShotRecord | null>(null)
  const killBonus = useRef(0)

  const resolve = (killed: boolean, shots: ShotRecord[], bonus: number) => {
    if (resolved.current) return
    resolved.current = true
    onResolve(id, { typeId: type.id, name: type.name, shots, killed, bonus })
  }

  useFrame((_, delta) => {
    if (!active) {
      elapsed.current += delta
      if (elapsed.current >= spawnDelay) {
        // Enter from any of the four sides: cross along x or z, either way.
        axis.current = Math.random() < 0.5 ? 'x' : 'z'
        dir.current = Math.random() < 0.5 ? 1 : -1
        zigDir.current = Math.random() < 0.5 ? 1 : -1
        if (axis.current === 'x') {
          x.current = -dir.current * X_EDGE // enter from left/right
          z.current = -8
        } else {
          z.current = dir.current > 0 ? Z_FAR : Z_NEAR // enter from top/bottom
          x.current = 0
        }
        setFlipX(axis.current === 'x' && dir.current < 0) // face travel direction
        setActive(true)
      }
      return
    }
    const g = group.current
    if (!g || resolved.current) return

    // death: spin + shrink where it fell, then resolve as a kill
    if (dying.current) {
      deadT.current += delta
      roll.current += delta * SPIN_SPEED
      const k = Math.min(deadT.current / DEATH_TIME, 1)
      const groundY = hf.heightAt(x.current, z.current) + type.size[1] / 2
      g.scale.setScalar(1 - k)
      g.position.set(x.current, groundY - k * 0.5, z.current)
      if (k >= 1)
        resolve(true, killShot.current ? [killShot.current] : [], killBonus.current)
      return
    }

    if (axis.current === 'x') {
      // cross left↔right, zig-zag in depth (z)
      x.current += dir.current * SPEED * delta
      z.current += zigDir.current * ZIG_RATE * delta
      if (z.current > Z_ZIG_NEAR) zigDir.current = -1
      else if (z.current < Z_ZIG_FAR) zigDir.current = 1
      if (Math.abs(x.current) > X_EDGE) resolve(false, [], 0)
    } else {
      // cross far↔near, zig-zag sideways (x)
      z.current += dir.current * SPEED * delta
      x.current += zigDir.current * ZIG_RATE * delta
      if (x.current > X_ZIG) zigDir.current = -1
      else if (x.current < -X_ZIG) zigDir.current = 1
      if (z.current < Z_FAR || z.current > Z_NEAR) resolve(false, [], 0)
    }

    g.position.set(x.current, hf.heightAt(x.current, z.current) + type.size[1] / 2, z.current)
  })

  const handleShot = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return // left button only
    e.stopPropagation()
    if (resolved.current || dying.current) return
    if (!useGameStore.getState().shoot()) return
    const region = e.uv ? regionAtUV(hitBoxesFor(type, 'run'), e.uv.x, e.uv.y) : null
    if (!region) return

    useGameStore.getState().recordHit()
    // record the kill; the death animation (shrink) resolves it afterward
    killShot.current = { region, points: GOLDEN.points, u: e.uv!.x, v: e.uv!.y, state: 'run' }
    killBonus.current = region === 'head' ? GOLDEN.headshotBonus : 0
    dying.current = true
    deadT.current = 0
  }

  if (!active || !runF) return null

  return (
    <group ref={group} position={[x.current, -100, z.current]}>
      <AnimatedSprite
        frames={runF}
        fps={type.fps.run}
        size={type.size}
        flipX={flipX}
        rollRef={roll}
        onPointerDown={handleShot}
      />
    </group>
  )
}
