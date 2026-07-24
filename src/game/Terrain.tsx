import { useMemo } from 'react'
import { Color, Float32BufferAttribute, PlaneGeometry } from 'three'
import type { HeightField } from './heightfield'

export const TERRAIN_SIZE = 80
const SEGMENTS = 110

/** Blends the biome palette across the height range for vertex colouring. */
function colorForHeight(y: number, amp: number, hf: HeightField): Color {
  const t = Math.min(Math.max((y / amp + 1) / 2, 0), 1)
  const { low, mid, high } = hf.params.palette
  const c = new Color()
  if (t < 0.5) c.set(low).lerp(new Color(mid), t / 0.5)
  else c.set(mid).lerp(new Color(high), (t - 0.5) / 0.5)
  return c
}

export default function Terrain({ hf }: { hf: HeightField }) {
  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEGMENTS, SEGMENTS)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    const colors: number[] = []
    const amp = hf.params.amplitude
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const y = hf.heightAt(x, z)
      pos.setY(i, y)
      const c = colorForHeight(y, amp, hf)
      colors.push(c.r, c.g, c.b)
    }
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [hf])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading />
    </mesh>
  )
}
