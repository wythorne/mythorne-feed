import {
  cardRotation,
  relativeTime,
  PLATFORM_LABELS,
  PLATFORM_NAMES,
} from '../data.js'

// ── Platform icon ────────────────────────────────────────────────────────────
export function platformIcon(platform) {
  const label = PLATFORM_LABELS[platform] || '??'
  return `<span class="platform-icon icon-${platform}" aria-label="${PLATFORM_NAMES[platform] || platform}">${label}</span>`
}

// ── Author avatar (tupperbot webhook) or platform icon ───────────────────────
export function authorAvatar(post) {
  if (post.author_avatar_url) {
    return `<img class="post-avatar" src="${escAttr(post.author_avatar_url)}" alt="Tupperbot avatar" loading="lazy" />`
  }
  return platformIcon(post.platform)
}

// ── Reaction pills ───────────────────────────────────────────────────────────
function reactionDisplay(reactions) {
  if (!reactions || reactions.total === 0) return ''
  const topEmoji = Object.entries(reactions.by_emoji || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([e, c]) => `${e} ${c}`)
    .join('  ')
  return `<span class="reaction-count" title="Reactions from Discord">♡ ${reactions.total}${topEmoji ? '  ·  ' + topEmoji : ''}</span>`
}

// ── Discord-flavor markdown renderer ─────────────────────────────────────────
// Converts Discord markdown to HTML while HTML-escaping all text content.
// Strategy: run a protect/escape/unprotect cycle so HTML tags we add are
// preserved, but any raw HTML in the original text is neutralised.
function renderMd(text) {
  if (!text) return ''

  // Placeholder tokens for HTML tag delimiters — unlikely to appear in user text
  const OPEN  = '\x00OPEN\x00'
  const CLOSE = '\x00CLOSE\x00'
  const AMP   = '\x00AMP\x00'

  // Step 1: Protect HTML tag delimiters in the raw text
  let s = text
    .replace(/</g, OPEN)
    .replace(/>/g, CLOSE)
    .replace(/&/g, AMP)

  // Step 2: Convert Discord markdown → HTML (content is still plain text here)
  s = s
    // Inline code: `code` → <code>escHtml(code)</code>
    .replace(/`([^`\n]+)`/g, (_, code) => `<code>${escHtml(code)}</code>`)
    // Bold: **text** → <strong>escHtml(text)</strong>
    .replace(/\*\*(.+?)\*\*/g, (_, code) => `<strong>${escHtml(code)}</strong>`)
    // Italic: *text* → <em>escHtml(text)</em>
    .replace(/(?<!\*)\*(?!\*)([^\*\n]+)(?<!\*)\*(?!\*)/g, (_, code) => `<em>${escHtml(code)}</em>`)
    // Strikethrough: ~~text~~ → <del>escHtml(text)</del>
    .replace(/~~(.+?)~~/g, (_, code) => `<del>${escHtml(code)}</del>`)

  // Step 3: Restore protected chars as proper HTML entities
  return s
    .replace(/\x00OPEN\x00/g, '&lt;')
    .replace(/\x00CLOSE\x00/g, '&gt;')
    .replace(/\x00AMP\x00/g, '&amp;')
}

// ── Post content renderer ────────────────────────────────────────────────────
function renderPostContent(post) {
  const { platform, template_type, content, metadata } = post
  const m = metadata || {}

  switch (platform) {
    case 'instagram':
      if (template_type === 'new_post') {
        return `<p class="card-body">${renderMd(content)}</p>`
      }
      if (template_type === 'comment') {
        return `<p class="card-body metadata-line">
          commented on <span class="metadata-value">@${escHtml(m.post_author || '?')}</span>'s photo
          ${content ? `<br/><em>"${renderMd(content)}"</em>` : ''}
        </p>`
      }
      break
    case 'twitter':
      if (template_type === 'retweet') {
        return `<p class="card-body metadata-line">
          retweeted <span class="metadata-value">@${escHtml(m.original_author || '?')}</span>
        </p>`
      }
      return `<p class="card-body">${renderMd(content)}</p>`
    case 'steam':
      if (template_type === 'time_played') {
        return `<p class="card-body metadata-line">
          has been playing <span class="metadata-value">${escHtml(m.game || '?')}</span> for <span class="metadata-value">${escHtml(m.play_duration || '?')}</span>
        </p>`
      }
      return `<p class="card-body metadata-line">
        is playing <span class="metadata-value">${escHtml(m.game || '?')}</span>
      </p>`
    case 'netflix':
      if (template_type === 'episode_progress') {
        return `<p class="card-body metadata-line">
          is on episode <span class="metadata-value">#${escHtml(m.episode || '?')}</span> of <span class="metadata-value">${escHtml(m.show || '?')}</span>
        </p>`
      }
      return `<p class="card-body metadata-line">
        is watching <span class="metadata-value">${escHtml(m.show || '?')}</span>
      </p>`
    case 'maps':
      if (template_type === 'location_with_companion' && m.companion) {
        return `<p class="card-body metadata-line">
          is at <span class="metadata-value">${escHtml(m.location || '?')}</span>
          with <span class="metadata-value">@${escHtml(m.companion)}</span>
        </p>`
      }
      return `<p class="card-body metadata-line">
        is at <span class="metadata-value">${escHtml(m.location || '?')}</span>
      </p>`
    case 'spotify':
      return `<p class="card-body metadata-line">
        is listening to <span class="metadata-value">${escHtml(m.track || content || '?')}</span>
        ${m.artist ? `by <span class="metadata-value">${escHtml(m.artist)}</span>` : ''}
      </p>`
    default:
      return `<p class="card-body">${renderMd(content || '')}</p>`
  }

  return `<p class="card-body">${renderMd(content || '')}</p>`
}

// ── Comment thread ────────────────────────────────────────────────────────────
function renderComments(comments) {
  if (!comments || comments.length === 0) return ''
  return `
    <div class="comment-thread" id="comments-${comments[0]?.post_id}">
      ${comments.map(c => `
        <div class="comment-note">
          <div class="comment-handle">@${escHtml(c.commenter_handle)}</div>
          <div class="comment-content">${renderMd(c.content)}</div>
          <div class="comment-footer">
            <a href="${escAttr(c.jump_url)}" target="_blank" rel="noopener" title="View in Discord">↗ discord</a>
          </div>
        </div>
      `).join('')}
    </div>
  `
}

// ── Full post card ────────────────────────────────────────────────────────────
export function renderPostCard(post, muse, opts = {}) {
  const { showMuseLink = true } = opts
  const rot = cardRotation(post.id)
  const pinClass = `pin pin-${post.platform}`
  const commentCount = post.comments?.length || 0
  const hasComments = commentCount > 0

  const museAnchor = showMuseLink
    ? `<a href="#/muse/${post.muse_handle}" class="handle-link" data-nav-muse="${post.muse_handle}">@${escHtml(post.muse_handle)}</a>`
    : `<span class="handle-at">@${escHtml(post.muse_handle)}</span>`

  return `
    <article class="post-card fade-up" data-rot="${rot}" data-post-id="${post.id}" data-platform="${post.platform}">
      <div class="${pinClass}"></div>
      <div class="card-header">
        ${authorAvatar(post)}
        <div class="card-meta">
          <div class="card-handle">
            ${museAnchor}
            ${muse ? `<span style="color:var(--paper-faint);font-weight:300;font-size:.85rem">${escHtml(muse.display_name)}</span>` : ''}
          </div>
          <div class="card-time">${relativeTime(post.created_at)}</div>
        </div>
      </div>
      ${renderPostContent(post)}
      ${post.image_url ? `
        <div class="card-image-wrap">
          <img src="${escAttr(post.image_url)}" alt="Post image" loading="lazy" data-lightbox="${escAttr(post.image_url)}" />
        </div>
      ` : ''}
      <div class="card-footer">
        ${reactionDisplay(post.reactions)}
        ${hasComments ? `
          <button class="notes-count" data-toggle-comments="${post.id}" aria-expanded="false">
            ↳ ${commentCount} ${commentCount === 1 ? 'note' : 'notes'}
          </button>
        ` : ''}
        <a class="discord-link" href="${escAttr(post.jump_url)}" target="_blank" rel="noopener">
          ↗ view in discord
        </a>
      </div>
      ${renderComments(post.comments)}
    </article>
  `
}

// ── Bind card interactions after insertion ────────────────────────────────────
export function bindCardInteractions(container) {
  // Toggle comments
  container.querySelectorAll('[data-toggle-comments]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const id = btn.dataset.toggleComments
      const thread = container.querySelector(`#comments-${id}`)
      if (!thread) return
      const open = thread.classList.toggle('open')
      btn.setAttribute('aria-expanded', open)
    })
  })

  // Lightbox for images
  container.querySelectorAll('[data-lightbox]').forEach(img => {
    img.addEventListener('click', e => {
      e.stopPropagation()
      openLightbox(img.dataset.lightbox, img.alt)
    })
  })
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function openLightbox(src, alt = '') {
  const lb = document.getElementById('lightbox')
  const lbImg = document.getElementById('lightbox-img')
  lbImg.src = src
  lbImg.alt = alt
  lb.classList.remove('hidden')
  document.body.style.overflow = 'hidden'
}

export function initLightbox() {
  const lb = document.getElementById('lightbox')
  const close = () => {
    lb.classList.add('hidden')
    document.body.style.overflow = ''
  }
  document.getElementById('lightbox-close')?.addEventListener('click', close)
  document.getElementById('lightbox-backdrop')?.addEventListener('click', close)
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close() })
}

// ── Escape utils ──────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;')
}
