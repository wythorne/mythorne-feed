import { groupByDate, getMuseByHandle, PLATFORM_NAMES } from '../data.js'
import { renderPostCard, bindCardInteractions, platformIcon } from '../components/PostCard.js'

export function renderTimeline(container, { muses, posts }) {
  // ── Escape HTML helper ────────────────────────────────────────────────────
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  let activeFilter = 'all'
  let searchQuery = ''

  const PLATFORMS = ['instagram', 'twitter', 'steam', 'netflix', 'maps', 'spotify']

  function filteredPosts() {
    return posts.filter(p => {
      if (activeFilter === 'notes') return p.comments?.length > 0
      if (activeFilter !== 'all' && p.platform !== activeFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const content = (p.content || '').toLowerCase()
        const handle = p.muse_handle.toLowerCase()
        const meta = JSON.stringify(p.metadata || '').toLowerCase()
        if (!content.includes(q) && !handle.includes(q) && !meta.includes(q)) return false
      }
      return true
    })
  }

  function renderFilters() {
    return `
      <div class="filter-bar" id="timeline-filter-bar">
        <button class="filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-filter="all" id="filter-all">All</button>
        ${PLATFORMS.map(p => `
          <button class="filter-btn ${activeFilter === p ? 'active' : ''}" data-filter="${p}" id="filter-${p}">
            ${esc(PLATFORM_NAMES[p] || p)}
          </button>
        `).join('')}
        <button class="filter-btn ${activeFilter === 'notes' ? 'active' : ''}" data-filter="notes" id="filter-notes">Notes</button>
        <div class="search-wrap">
          <span class="search-icon">⌕</span>
          <input
            type="search"
            class="search-input"
            id="timeline-search"
            placeholder="Search muse, text…"
            value="${esc(searchQuery)}"
            aria-label="Search posts"
          />
        </div>
      </div>
    `
  }

  function renderGroups() {
    const fp = filteredPosts()
    if (fp.length === 0) {
      return `
        <div class="empty-state">
          <span class="empty-state-glyph">⚯</span>
          <p class="empty-state-text">The archive holds no entries matching this query.<br/>Perhaps the compendium has not yet recorded it.</p>
        </div>
      `
    }

    const groups = groupByDate(fp)
    return Object.entries(groups).map(([label, groupPosts]) => {
      const dateStr = groupPosts[0]
        ? new Date(groupPosts[0].created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : label
      const displayLabel = label === 'Today' ? `Today — ${dateStr}` : label === 'Yesterday' ? `Yesterday — ${dateStr}` : dateStr

      const cards = groupPosts.map(p => {
        const muse = getMuseByHandle(muses, p.muse_handle)
        return renderPostCard(p, muse, { showMuseLink: true })
      }).join('')

      return `
        <div class="date-group" data-date-group="${esc(label)}">
          <div class="date-label" data-toggle-group="${esc(label)}">
            ${esc(displayLabel)}
            <span class="date-toggle">▸</span>
          </div>
          <div class="posts-grid" id="group-grid-${esc(label)}">${cards}</div>
        </div>
      `
    }).join('')
  }

  function render() {
    container.innerHTML = `
      <div class="timeline-header">
        <h1 class="timeline-title">The Compendium</h1>
        <p class="timeline-subtitle">An indexed archive of the Conservatory's social traces.</p>
      </div>
      ${renderFilters()}
      <div id="timeline-groups">${renderGroups()}</div>
    `
    bindEvents()
  }

  function updateGroups() {
    const groupsEl = container.querySelector('#timeline-groups')
    if (groupsEl) {
      groupsEl.innerHTML = renderGroups()
      bindCardInteractions(groupsEl)
      bindGroupToggles(groupsEl)
      bindMuseLinks(groupsEl)
    }
  }

  function bindEvents() {
    // Filter buttons
    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.filter
        container.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === activeFilter))
        updateGroups()
      })
    })

    // Search
    const searchInput = container.querySelector('#timeline-search')
    let searchTimer
    searchInput?.addEventListener('input', () => {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(() => {
        searchQuery = searchInput.value.trim()
        updateGroups()
      }, 250)
    })

    bindCardInteractions(container)
    bindGroupToggles(container)
    bindMuseLinks(container)
  }

  function bindGroupToggles(root) {
    root.querySelectorAll('[data-toggle-group]').forEach(label => {
      label.addEventListener('click', () => {
        const gid = label.dataset.toggleGroup
        const grid = root.querySelector(`#group-grid-${gid}`)
        if (!grid) return
        const collapsed = grid.style.display === 'none'
        grid.style.display = collapsed ? '' : 'none'
        const arrow = label.querySelector('.date-toggle')
        if (arrow) arrow.textContent = collapsed ? '▸' : '▾'
      })
    })
  }

  function bindMuseLinks(root) {
    root.querySelectorAll('[data-nav-muse]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault()
        e.stopPropagation()
        window.location.hash = `#/muse/${el.dataset.navMuse}`
      })
    })
  }

  render()
}
