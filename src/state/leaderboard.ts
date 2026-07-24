/**
 * Leaderboard persistence. For now this is backed by localStorage; swap the
 * body of these two functions for API calls when the database is ready.
 */

export interface ScoreEntry {
  name: string
  score: number
  /** ISO date string */
  date: string
}

const STORAGE_KEY = 'moosen-hunter.leaderboard.v1'
const MAX_ENTRIES = 10

export function loadLeaderboard(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ScoreEntry[]) : []
  } catch {
    return []
  }
}

/** Adds an entry, keeps the top {@link MAX_ENTRIES}, persists, and returns it. */
export function saveScore(entry: ScoreEntry): ScoreEntry[] {
  const next = [...loadLeaderboard(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore write failures (private mode, quota, etc.)
  }
  return next
}
