import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import type { Group } from 'three'
import { useGameStore, type AnimalResult, type ShotRecord } from '../state/gameStore'
import {
  SCORING,
  animalKey,
  animalSource,
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
}

const BOUND = 38
const DEATH_TIME = 0.45

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
  const fly = useRef(type.fly)
  const alive = useRef(true)
  const hp = useRef(SCORING.bodyHP)
  const shots = useRef<ShotRecord[]>([])
  const dying = useRef(false)
  const deadT = useRef(0)
  const resolved = useRef(false)
  const fleeDir = useRef<{ x: number; z: number } | null>(null)

  const displayState = dying.current || herdPhase === 'flee'
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
      bonus: killed ? SCORING.killBonus : 0,
    })
  }

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return

    // death: shrink + drop, then resolve as a kill
    if (dying.current) {
      deadT.current += delta
      const k = Math.min(deadT.current / DEATH_TIME, 1)
      g.scale.setScalar(1 - k)
      g.position.y = hf.heightAt(x.current, z.current) + type.size[1] / 2 - k * 0.5
      if (k >= 1) resolve(true)
      return
    }

    // flee: run away from the hunter (toward -z) with lateral spread
    if (alive.current && useGameStore.getState().herdPhase === 'flee') {
      if (!fleeDir.current) {
        const lateral = x.current * 0.15 + (inst.offset - 3) * 0.4
        const len = Math.hypot(lateral, 1)
        fleeDir.current = { x: lateral / len, z: -1 / len }
      }
      const speed = type.fleeSpeed * inst.fleeMult
      x.current += fleeDir.current.x * speed * delta
      z.current += fleeDir.current.z * speed * delta
      if (type.fly > 0) fly.current += delta * 1.5 // birds climb

      if (Math.abs(x.current) > BOUND || z.current < -BOUND || z.current > 22) {
        resolve(false) // escaped
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
    e.stopPropagation()
    if (!alive.current || dying.current) return
    if (!useGameStore.getState().shoot()) return // out of ammo

    const region = e.uv ? regionAtUV(type.hit, e.uv.x, e.uv.y) : null
    if (!region) return // clipped the sprite plane but missed the body

    const points = SCORING[region]
    const store = useGameStore.getState()
    store.addScore(points)
    shots.current.push({ region, points, u: e.uv!.x, v: e.uv!.y })

    const lethal = region === 'head' || region === 'heart' || --hp.current <= 0
    if (lethal) {
      alive.current = false
      dying.current = true
      deadT.current = 0
      store.addScore(SCORING.killBonus)
    }
  }

  return (
    <group ref={group} position={[inst.x, type.fly, inst.z]}>
      <AnimatedSprite
        frames={frames}
        fps={fps}
        size={type.size}
        offset={inst.offset}
        onPointerDown={handleShot}
      />
    </group>
  )
}
