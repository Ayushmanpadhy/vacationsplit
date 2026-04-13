/**
 * VacationSplit — Utility Functions
 * Shared helpers used across all pages
 */

// ── Constants ────────────────────────────────────────────

const CATEGORIES = [
  { id: 1, name: 'Food',     emoji: '🍽️', bg: '#FFF0E0', color: '#C05A00' },
  { id: 2, name: 'Hotel',    emoji: '🏨', bg: '#E0F0FF', color: '#005AB0' },
  { id: 3, name: 'Travel',   emoji: '🚗', bg: '#E0F5EC', color: '#006B3D' },
  { id: 4, name: 'Shopping', emoji: '🛍️', bg: '#F5E0FF', color: '#7A00B0' },
  { id: 5, name: 'Other',    emoji: '📦', bg: '#F0EDE8', color: '#5A5550' }
];

const MEMBER_COLORS = [
  { bg: '#FFE4D6', text: '#C04A00' },
  { bg: '#D6F0FF', text: '#006B99' },
  { bg: '#D6FFE8', text: '#007A3D' },
  { bg: '#F0D6FF', text: '#6B00A8' },
  { bg: '#FFD6D6', text: '#A80000' },
  { bg: '#FFF3D6', text: '#A86B00' },
  { bg: '#D6FFFA', text: '#007A6B' },
  { bg: '#FFD6F5', text: '#A8006B' },
  { bg: '#E8FFD6', text: '#4A7A00' },
  { bg: '#D6D6FF', text: '#00006B' }
];

// ── Formatting ───────────────────────────────────────────

/** Format a number as Indian currency (₹) */
function formatAmount(n) {
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

/** Format an ISO date string to "DD Mon" */
function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

/** Return a relative time string like "5m ago" */
function timeAgo(str) {
  const diff = Date.now() - new Date(str).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1)  return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(str);
}

// ── Avatar ───────────────────────────────────────────────

/** Generate an avatar HTML element */
function avatar(name, colorIdx, sizeClass = '') {
  const c = MEMBER_COLORS[(colorIdx || 0) % MEMBER_COLORS.length];
  const letter = (name || '?')[0].toUpperCase();
  return `<div class="avatar ${sizeClass}" style="background:${c.bg};color:${c.text}">${letter}</div>`;
}

// ── Toast Notifications ──────────────────────────────────

/** Show a toast notification at the bottom of the screen */
function showToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' toast-' + type : '');
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add('hide');
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

// ── Modal ────────────────────────────────────────────────

/** Show a confirmation modal with title, body, and action button */
function showModal(title, body, confirmLabel, onConfirm, danger = false) {
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      <p>${body}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm">${confirmLabel}</button>
      </div>
    </div>`;
  overlay.classList.remove('hidden');
  overlay.querySelector('#modal-cancel').onclick = () => overlay.classList.add('hidden');
  overlay.querySelector('#modal-confirm').onclick = () => {
    overlay.classList.add('hidden');
    onConfirm();
  };
  // Close on overlay click (outside modal)
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.classList.add('hidden');
  };
}

// ── Clipboard ────────────────────────────────────────────

/** Copy text to clipboard and show a toast */
function copyToClipboard(text, msg = 'Copied!') {
  navigator.clipboard.writeText(text).then(() => {
    showToast(msg, 'success');
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast(msg, 'success');
  });
}

// ── Loading State ────────────────────────────────────────

/** Show a loading spinner in the app container */
function showLoading() {
  document.getElementById('app').innerHTML = `
    <div class="loading-wrap">
      <div class="spinner"></div>
      <p class="label">Loading...</p>
    </div>`;
}

// ── Bottom Navigation ────────────────────────────────────

/** Render the bottom navigation bar for trip pages */
function renderBottomNav(tripCode, active) {
  return `<div class="bottom-nav">
    <button class="nav-item ${active === 'dashboard' ? 'active' : ''}" onclick="Router.navigate('/trip/${tripCode}/dashboard')">
      <svg class="nav-icon-svg" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      <span class="nav-label">Home</span>
    </button>
    <button class="nav-item ${active === 'add' ? 'active' : ''}" onclick="Router.navigate('/trip/${tripCode}/add-expense')">
      <svg class="nav-icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      <span class="nav-label">Add</span>
    </button>
    <button class="nav-item ${active === 'balances' ? 'active' : ''}" onclick="Router.navigate('/trip/${tripCode}/balances')">
      <svg class="nav-icon-svg" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
      <span class="nav-label">Balances</span>
    </button>
    <button class="nav-item ${active === 'summary' ? 'active' : ''}" onclick="Router.navigate('/trip/${tripCode}/summary')">
      <svg class="nav-icon-svg" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      <span class="nav-label">Summary</span>
    </button>
  </div>`;
}

/** Extract the current trip code from the URL hash */
function getCurrentTripCode() {
  const h = window.location.hash.slice(1);
  const m = h.match(/\/trip\/([^/]+)/);
  return m ? m[1] : '';
}
