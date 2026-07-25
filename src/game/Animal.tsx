import { useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import type { Group } from 'three'
import { useGameStore, type AnimalResult, type ShotRecord } from '../state/gameStore'
import {
  SCORING,
  animalKey,
  animalSource,
  hitBoxesFor,
  regionAtUV,
  type AnimalType,
} from '../config/animals'
import { useHeightField } from './TerrainContext'
import { useFrames } from '../sprites/useFrames'
import AnimatedSprite from '../sprites/AnimatedSprite'

export interface AnimalInstance {
  id: number
  type: AnimalType
  x: number
  z: number
  /** flee-speed multiplier from the level config */
  fleeMult: number
  /** animation offset so the herd doesn't move in lockstep */
  offset: number
  /** per-instance height off the ground (for airborne birds) */
  flyOverride?: number
  /** if set, drifts at this velocity during the calm phase (flying across) */
  crossVel?: { x: number; z: number }
}

const BOUND = 38
const DEATH_TIME = 0.45
const FALL_TIME = 0.7 // how long a shot bird takes to fall to the ground
// Flee slower than the raw speeds so the scatter lasts longer (~1.5×), giving
// the player more time to hunt the fleeing herd.
const SCATTER_SLOWDOWN = 1.5

export default function Animal({
  inst,
  onResolve,
}: {
  inst: AnimalInstance
  onResolve: (id: number, result: AnimalResult) => void
}) {
  const { type } = inst
  const hf = useHeightField()
  const herdPhase = useGameStore((s) => s.herdPhase)

  const idleF = useFrames(animalKey(type, 'idle'), animalSource(type, 'idle'))
  const alertF = useFrames(animalKey(type, 'alert'), animalSource(type, 'alert'))
  const runF = useFrames(animalKey(type, 'run'), animalSource(type, 'run'))

  const group = useRef<Group>(null)
  const x = useRef(inst.x)
  const z = useRef(inst.z)
  const fly = useRef(inst.flyOverride ?? type.fly)
  const alive = useRef(true)
  const health = useRef(type.health)
  const shots = useRef<ShotRecord[]>([])
  const dying = useRef(false)
  const deadT = useRef(0)
  const resolved = useRef(false)
  const fleeDir = useRef<{ x: number; z: number } | null>(null)
  // sprites face right; mirror when travelling left so they don't move backward
  const [flipX, setFlipX] = useState(() =>
    inst.crossVel ? inst.crossVel.x < 0 : false,
  )

  // birds drifting across during the calm phase show the flying (run) animation
  const flyingCalm = herdPhase === 'calm' && !!inst.crossVel
  const displayState =
    dying.current || herdPhase === 'flee' || flyingCalm
      ? 'run'
      : herdPhase === 'alert'
        ? 'alert'
        : 'idle'
  const frames =
    displayState === 'run' ? runF : displayState === 'alert' ? alertF : idleF
  const fps =
    displayState === 'run'
      ? type.fps.run
      : displayState === 'alert'
        ? type.fps.alert
        : type.fps.idle

  const resolve = (killed: boolean) => {
    if (resolved.current) return
    resolved.current = true
    onResolve(inst.id, {
      typeId: type.id,
      name: type.name,
      shots: shots.current,
      killed,
      bonus: killed ? type.killBonus : 0,
    })
  }

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return

    // death, then resolve as a kill
    if (dying.current) {
      deadT.current += delta
      const groundY = hf.heightAt(x.current, z.current) + type.size[1] / 2
      if (fly.current > 0.5) {
        // airborne: fall out of the sky (accelerating) to the ground
        const k = Math.min(deadT.current / FALL_TIME, 1)
        g.position.y = groundY + fly.current * (1 - k * k) // gravity ease-in
        g.scale.setScalar(k > 0.85 ? 1 - (k - 0.85) / 0.15 : 1) // small splat on landing
        if (k >= 1) resolve(true)
      } else {
        // grounded: shrink + sink
        const k = Math.min(deadT.current / DEATH_TIME, 1)
        g.scale.setScalar(1 - k)
        g.position.y = groundY - k * 0.5
        if (k >= 1) resolve(true)
      }
      return
    }

    const phase = useGameStore.getState().herdPhase

    // flee: run away from the hunter (toward -z) with lateral spread
    if (alive.current && phase === 'flee') {
      if (!fleeDir.current) {
        const lateral = x.current * 0.15 + (inst.offset - 3) * 0.4
        const len = Math.hypot(lateral, 1)
        fleeDir.current = { x: lateral / len, z: -1 / len }
        setFlipX(fleeDir.current.x < 0)
      }
      const speed = (type.fleeSpeed * inst.fleeMult) / SCATTER_SLOWDOWN
      x.current += fleeDir.current.x * speed * delta
      z.current += fleeDir.current.z * speed * delta
      if (type.spec.bird) fly.current += delta * 3 // birds take off / climb

      if (Math.abs(x.current) > BOUND || z.current < -BOUND || z.current > 22) {
        resolve(false) // escaped
        return
      }
    } else if (alive.current && phase === 'calm' && inst.crossVel) {
      // peacefully flying across the screen before anything is spooked
      x.current += inst.crossVel.x * delta
      z.current += inst.crossVel.z * delta
      if (Math.abs(x.current) > BOUND || z.current < -BOUND || z.current > 22) {
        resolve(false) // drifted off the map
        return
      }
    }

    g.position.set(
      x.current,
      hf.heightAt(x.current, z.current) + type.size[1] / 2 + fly.current,
      z.current,
    )
  })

  const handleShot = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return // left button only
    e.stopPropagation()
    if (!alive.current || dying.current) return
    if (!useGameStore.getState().shoot()) return // out of ammo

    const region = e.uv
      ? regionAtUV(hitBoxesFor(type, displayState), e.uv.x, e.uv.y)
      : null
    if (!region) return // clipped the sprite plane but missed the body

    const store = useGameStore.getState()

    // Avoid-target (park ranger): record the penalty and drop it. Doesn't count
    // toward accuracy. (Points are tallied at level end, not scored live.)
    if (type.penalty != null) {
      shots.current.push({
        region,
        points: -type.penalty,
        u: e.uv!.x,
        v: e.uv!.y,
        state: displayState,
      })
      alive.current = false
      dying.current = true
      deadT.current = 0
      return
    }

    const points = SCORING[region]
    store.recordHit()
    shots.current.push({ region, points, u: e.uv!.x, v: e.uv!.y, state: displayState })

    health.current -= type.damage[region]
    if (health.current <= 0) {
      alive.current = false
      dying.current = true
      deadT.current = 0
    }
  }

  return (
    <group ref={group} position={[inst.x, type.fly, inst.z]}>
      <AnimatedSprite
        frames={frames}
        fps={fps}
        size={type.size}
        offset={inst.offset}
        flipX={flipX}
        onPointerDown={handleShot}
      />
    </group>
  )
}
