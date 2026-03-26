// ── Data loader ─────────────────────────────────────────────────────────────
// Loads from /data/*.json — in dev served by Vite from public/,
// in production from the GitHub Pages root after the bot copies data/ → dist/data/

const BASE = import.meta.env.BASE_URL

async function loadJSON(name) {
  const res = await fetch(`${BASE}data/${name}.json?_=${Date.now()}`)
  if (!res.ok) throw new Error(`Failed to load ${name}.json: ${res.status}`)
  return res.json()
}

export async function loadAll() {
  const [muses, posts, meta] = await Promise.all([
    loadJSON('muses'),
    loadJSON('posts'),
    loadJSON('meta'),
  ])
  return { muses, posts, meta }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getMuseByHandle(muses, handle) {
  return muses.find(m => m.handle === handle) || null
}

export function getPostsByHandle(posts, handle) {
  return posts.filter(p => p.muse_handle === handle)
}

export function getPostsByWriter(muses, posts, writerId) {
  const writerHandles = muses.filter(m => m.writer_id === writerId).map(m => m.handle)
  return posts.filter(p => writerHandles.includes(p.muse_handle))
}

export function groupByWriter(muses) {
  const map = {}
  for (const muse of muses) {
    if (!map[muse.writer_id]) {
      map[muse.writer_id] = { writer_id: muse.writer_id, writer_name: muse.writer_name, muses: [] }
    }
    map[muse.writer_id].muses.push(muse)
  }
  return Object.values(map)
}

export function groupByDate(posts) {
  const sorted = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const groups = {}
  for (const post of sorted) {
    const label = dateLabel(post.created_at)
    if (!groups[label]) groups[label] = []
    groups[label].push(post)
  }
  return groups
}

export function dateLabel(isoString) {
  const d = new Date(isoString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const postDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (postDay.getTime() === today.getTime()) return 'Today'
  if (postDay.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function relativeTime(isoString) {
  const d = new Date(isoString)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Deterministic rotation from post ID so cards don't jump on re-render
export function cardRotation(id) {
  const n = String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const rots = [-3, -2, -1, -1, 0, 0, 1, 1, 2, 3]
  return rots[n % rots.length]
}

export const PLATFORM_LABELS = {
  instagram: 'IG',
  twitter: 'TW',
  steam: 'ST',
  netflix: 'NF',
  maps: 'MP',
  spotify: 'SP',
}

export const PLATFORM_NAMES = {
  instagram: 'Instagram',
  twitter: 'Twitter',
  steam: 'Steam',
  netflix: 'Netflix',
  maps: 'Maps',
  spotify: 'Spotify',
}
