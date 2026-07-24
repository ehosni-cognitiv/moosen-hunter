import { createContext, useContext } from 'react'
import type { HeightField } from './heightfield'

export const TerrainContext = createContext<HeightField | null>(null)

export function useHeightField(): HeightField {
  const hf = useContext(TerrainContext)
  if (!hf) throw new Error('useHeightField must be used within a Terrain')
  return hf
}
