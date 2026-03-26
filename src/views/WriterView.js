import { groupByWriter, getPostsByHandle, relativeTime } from '../data.js'

export function renderWriterView(container, { muses, posts }) {
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const writerGroups = groupByWriter(muses)

  function getLastPost(handle) {
    const musePosts = getPostsByHandle(posts, handle)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return musePosts[0] || null
  }

  function postCount(handle) {
    return getPostsByHandle(posts, handle).length
  }

  function lastPostSnippet(handle) {
    const last = getLastPost(handle)
    if (!last) return 'No entries yet.'
    const content = last.content || last.metadata?.game || last.metadata?.show || last.metadata?.location || '…'
    const truncated = content.length > 80 ? content.slice(0, 80) + '…' : content
    return `${relativeTime(last.created_at)}: "${esc(truncated)}"`
  }

  function museRow(muse) {
    const count = postCount(muse.handle)
    const pfp = muse.pfp_url
      ? `<img class="muse-row-pfp" src="${esc(muse.pfp_url)}" alt="${esc(muse.display_name)}" />`
      : `<div class="muse-row-pfp-placeholder">${esc(muse.display_name[0] || '?')}</div>`

    return `
      <a class="muse-row" href="#/muse/${esc(muse.handle)}" id="writer-muse-${esc(muse.handle)}" data-nav-muse="${esc(muse.handle)}">
        ${pfp}
        <div class="muse-row-info">
          <div class="muse-row-name">${esc(muse.display_name)}</div>
          <div class="muse-row-handle">@${esc(muse.handle)} · ${esc(muse.pronouns || '—')}</div>
          <div class="muse-row-meta">${esc(muse.wythorne_class || '')}</div>
        </div>
        <div>
          <span class="muse-post-badge">${count} ${count === 1 ? 'entry' : 'entries'}</span>
        </div>
        <div class="muse-preview-tip">${lastPostSnippet(muse.handle)}</div>
      </a>
    `
  }

  function writerCard(writer, index) {
    const initial = (writer.writer_name || 'W')[0].toUpperCase()
    return `
      <div class="writer-card ${index === 0 ? 'open' : ''}" id="writer-card-${esc(writer.writer_id)}" data-writer="${esc(writer.writer_id)}">
        <div class="writer-card-header" data-toggle-writer="${esc(writer.writer_id)}" id="writer-toggle-${esc(writer.writer_id)}">
          <div class="writer-avatar">${esc(initial)}</div>
          <div class="writer-name">${esc(writer.writer_name || 'Unknown Writer')}</div>
          <div class="writer-muse-count">${writer.muses.length} ${writer.muses.length === 1 ? 'muse' : 'muses'}</div>
          <span class="writer-chevron">▸</span>
        </div>
        <div class="writer-muse-list" id="muse-list-${esc(writer.writer_id)}">
          ${writer.muses.map(m => museRow(m)).join('')}
        </div>
      </div>
    `
  }

  container.innerHTML = `
    <div class="writer-view">
      <div class="writer-intro">
        <h1 class="writer-intro-title">The Workshop</h1>
        <p class="writer-intro-sub">All writers and their muses, indexed by the archive.</p>
      </div>
      ${writerGroups.length === 0 ? `
        <div class="empty-state">
          <span class="empty-state-glyph">⚯</span>
          <p class="empty-state-text">No writers have been catalogued yet.</p>
        </div>
      ` : writerGroups.map((w, i) => writerCard(w, i)).join('')}
    </div>
  `

  // Bind accordion toggles
  container.querySelectorAll('[data-toggle-writer]').forEach(header => {
    header.addEventListener('click', () => {
      const wid = header.dataset.toggleWriter
      const card = container.querySelector(`#writer-card-${wid}`)
      card?.classList.toggle('open')
    })
  })

  // Bind muse nav links
  container.querySelectorAll('[data-nav-muse]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault()
      window.location.hash = `#/muse/${el.dataset.navMuse}`
    })
  })
}
