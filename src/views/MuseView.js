import { getMuseByHandle, getPostsByHandle, PLATFORM_NAMES } from '../data.js'
import { renderPostCard, bindCardInteractions, platformIcon } from '../components/PostCard.js'

export function renderMuseView(container, { muses, posts }, handle) {
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const muse = getMuseByHandle(muses, handle)
  const musePosts = getPostsByHandle(posts, handle)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  if (!muse) {
    container.innerHTML = `
      <a href="#/" class="back-btn">← back to compendium</a>
      <div class="empty-state">
        <span class="empty-state-glyph">⚯</span>
        <p class="empty-state-text">No record found for <em>@${esc(handle)}</em> in the archive.<br/>Perhaps they have not yet been catalogued.</p>
      </div>
    `
    return
  }

  let activeFilter = 'all'
  const platformsUsed = [...new Set(musePosts.map(p => p.platform))]

  const pfpEl = muse.pfp_url
    ? `<img class="profile-pfp" src="${esc(muse.pfp_url)}" alt="${esc(muse.display_name)}" />`
    : `<div class="profile-pfp-placeholder">${esc(muse.display_name[0] || '?')}</div>`

  const platformLinks = Object.entries(muse.platform_links || {})
    .filter(([, url]) => url)
    .map(([plat, url]) => `
      <a class="profile-link-btn" href="${esc(url)}" target="_blank" rel="noopener" id="muse-link-${esc(plat)}">
        <span class="platform-dot" style="background:var(--pin-${plat}, var(--pin-default))"></span>
        ${esc(PLATFORM_NAMES[plat] || plat)}
      </a>
    `).join('')

  function filteredPosts() {
    if (activeFilter === 'all') return musePosts
    return musePosts.filter(p => p.platform === activeFilter)
  }

  function renderCards() {
    const fp = filteredPosts()
    if (fp.length === 0) return `
      <div class="empty-state">
        <span class="empty-state-glyph">⚯</span>
        <p class="empty-state-text">No ${activeFilter === 'all' ? '' : PLATFORM_NAMES[activeFilter] + ' '}entries in the archive.</p>
      </div>
    `
    return `<div class="posts-grid">${fp.map(p => renderPostCard(p, muse, { showMuseLink: false })).join('')}</div>`
  }

  function render() {
    container.innerHTML = `
      <a href="#/" class="back-btn" id="muse-back-btn">← back to compendium</a>

      <div class="muse-view">
        <div class="profile-card">
          <div class="pin pin-default"></div>
          <div class="profile-inner">
            ${pfpEl}
            <div class="profile-info">
              <div class="profile-display-name">${esc(muse.display_name)}</div>
              <div class="profile-handle">@${esc(muse.handle)}</div>
              <div class="profile-tags">
                ${muse.pronouns ? `<span class="profile-tag">${esc(muse.pronouns)}</span>` : ''}
                ${muse.wythorne_class ? `<span class="profile-tag">${esc(muse.wythorne_class)}</span>` : ''}
                ${musePosts.length > 0 ? `<span class="profile-tag">${musePosts.length} ${musePosts.length === 1 ? 'entry' : 'entries'}</span>` : ''}
              </div>
              ${muse.bio ? `
                <div class="profile-divider"></div>
                <div class="profile-bio">${esc(muse.bio)}</div>
              ` : ''}
              ${platformLinks ? `
                <div class="profile-links">${platformLinks}</div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="muse-activity-header">Recent Activity</div>

        ${platformsUsed.length > 1 ? `
          <div class="muse-filter-bar" id="muse-filter-bar">
            <button class="filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-muse-filter="all" id="muse-filter-all">All</button>
            ${platformsUsed.map(p => `
              <button class="filter-btn ${activeFilter === p ? 'active' : ''}" data-muse-filter="${esc(p)}" id="muse-filter-${esc(p)}">
                ${esc(PLATFORM_NAMES[p] || p)}
              </button>
            `).join('')}
          </div>
        ` : ''}

        <div id="muse-posts-grid">${renderCards()}</div>
      </div>
    `
    bindEvents()
  }

  function updateGrid() {
    const grid = container.querySelector('#muse-posts-grid')
    if (grid) {
      grid.innerHTML = renderCards()
      bindCardInteractions(grid)
      bindMuseLinks(grid)
    }
  }

  function bindEvents() {
    // Filter buttons
    container.querySelectorAll('[data-muse-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.museFilter
        container.querySelectorAll('[data-muse-filter]').forEach(b =>
          b.classList.toggle('active', b.dataset.museFilter === activeFilter))
        updateGrid()
      })
    })

    bindCardInteractions(container)
    bindMuseLinks(container)
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
