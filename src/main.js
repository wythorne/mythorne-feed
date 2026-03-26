import './style.css'
import { loadAll, relativeTime } from './data.js'
import { renderTimeline } from './views/Timeline.js'
import { renderMuseView } from './views/MuseView.js'
import { renderWriterView } from './views/WriterView.js'
import { initLightbox } from './components/PostCard.js'

// ── App bootstrap ─────────────────────────────────────────────────────────────

let appData = null

async function init() {
  initLightbox()
  setupNav()

  try {
    appData = await loadAll()
    updateSyncBadge(appData.meta)
    route()
  } catch (err) {
    console.error('Failed to load data:', err)
    document.getElementById('view-container').innerHTML = `
      <div class="empty-state">
        <span class="empty-state-glyph">⚯</span>
        <p class="empty-state-text">
          The archive could not be reached.<br/>
          <em style="font-size:.8rem;opacity:.6">${err.message}</em>
        </p>
      </div>
    `
  }
}

// ── Routing ───────────────────────────────────────────────────────────────────

function route() {
  if (!appData) return

  const hash = window.location.hash || '#/'
  const container = document.getElementById('view-container')

  // Update nav state
  const isWriter = hash.startsWith('#/writer')
  document.getElementById('nav-timeline')?.classList.toggle('active', !isWriter && !hash.startsWith('#/muse'))
  document.getElementById('nav-writer')?.classList.toggle('active', isWriter)

  // Scroll to top on navigation
  container.scrollIntoView({ behavior: 'instant', block: 'start' })
  window.scrollTo(0, 0)

  // Trigger entering animation
  container.classList.remove('view-transition-in')
  void container.offsetWidth // trigger reflow
  container.classList.add('view-transition-in')

  if (hash === '#/' || hash === '#/timeline' || hash === '#') {
    document.title = 'MyWythorne — The Compendium'
    renderTimeline(container, appData)
  } else if (hash === '#/writer' || hash === '#/muselist') {
    document.title = 'MyWythorne — The Workshop'
    renderWriterView(container, appData)
  } else if (hash.startsWith('#/muse/')) {
    const handle = hash.replace('#/muse/', '').split('/')[0]
    document.title = `@${handle} — MyWythorne`
    renderMuseView(container, appData, handle)
  } else {
    // Fallback
    renderTimeline(container, appData)
  }
}

window.addEventListener('hashchange', route)

// ── Navigation setup ──────────────────────────────────────────────────────────

function setupNav() {
  document.getElementById('logo-link')?.addEventListener('click', e => {
    e.preventDefault()
    window.location.hash = '#/'
  })
}

// ── Sync badge ────────────────────────────────────────────────────────────────

function updateSyncBadge(meta) {
  const label = document.getElementById('sync-label')
  if (!label || !meta?.last_sync) return
  label.textContent = `synced ${relativeTime(meta.last_sync)}`
}

// ── Start ─────────────────────────────────────────────────────────────────────

init()
