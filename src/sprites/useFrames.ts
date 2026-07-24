import { useEffect, useState } from 'react'
import type { Texture } from 'three'
import { loadFrames, type SpriteSource } from './frames'

// Frame textures are cached by key so a sprite used many times (grass, a herd
// of the same animal) is only built/decoded once. `pending` dedupes concurrent
// requests so dozens of instances mounting at once share a single load.
const cache = new Map<string, Texture[]>()
const pending = new Map<string, Promise<Texture[]>>()

/**
 * Returns the frame textures for a sprite source, or null while loading.
 * `key` must be stable and unique per distinct source (e.g. "moose-run").
 */
export function useFrames(key: string, src: SpriteSource): Texture[] | null {
  const [frames, setFrames] = useState<Texture[] | null>(
    () => cache.get(key) ?? null,
  )

  useEffect(() => {
    if (cache.has(key)) {
      setFrames(cache.get(key)!)
      return
    }
    let alive = true
    let load = pending.get(key)
    if (!load) {
      load = loadFrames(src).then((tex) => {
        cache.set(key, tex)
        pending.delete(key)
        return tex
      })
      pending.set(key, load)
    }
    load.then((tex) => {
      if (alive) setFrames(tex)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return frames
}
