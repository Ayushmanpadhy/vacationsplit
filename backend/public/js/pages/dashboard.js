/**
 * VacationSplit — Dashboard Page
 * Shows trip overview: header, summary cards, expenses, balances, activity
 */

async function renderDashboard(tripCode) {
  showLoading();

  try {
    // Fetch all data in parallel
    const trip = await API.getTripByCode(tripCode);
    const me   = await Session.getMember(tripCode);

    const [members, expenses, balances, activity] = await Promise.all([
      API.getMembersByTrip(trip.id),
      API.getExpensesByTrip(trip.id),
      API.getBalances(trip.id),
      API.getActivity(trip.id)
    ]);

    // Calculate stats
    const myBalance  = balances.find(b => b.member_id === me?.id);
    const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.total_amount), 0);
    const myShare    = myBalance ? myBalance.total_owed : 0;
    const myNet      = myBalance ? myBalance.net_balance : 0;

    const app = document.getElementById('app');
    app.innerHTML = `
    ${renderBottomNav(tripCode, 'dashboard')}

    <div class="top-bar">
      <div class="top-bar-side profile-trigger" onclick="showProfileMenu()">
        ${me ? avatar(me.name, me.color_index, 'avatar-sm') : avatar('Guest', 0, 'avatar-sm')}
        <span style="font-size:13px;font-weight:700;color:var(--text);white-space:nowrap">${me ? me.name.split(' ')[0] : 'Profile'}</span>
      </div>
      <div class="top-bar-title">Dashboard</div>
      <div class="top-bar-side-right">
        <span class="trip-code-pill" onclick="copyToClipboard('${tripCode}','Code copied!')">${tripCode} 📋</span>
      </div>
    </div>

    <div class="page-inner" style="padding-top:16px">

      <!-- Trip Header -->
      <div class="trip-header">
        <div class="trip-name">${trip.name}</div>
        <div class="trip-dest">📍 ${trip.destination || 'Trip'}</div>
        ${trip.start_date ? `<div class="trip-dates-badge">📅 ${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}</div>` : ''}
      </div>

      <!-- Members Strip -->
      <div class="members-strip">
        ${members.map(m => `
          <div class="member-strip-item">
            ${avatar(m.name, m.color_index)}
            <div class="mname">${m.name.split(' ')[0]}</div>
          </div>`).join('')}
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="sum-card">
          <div class="s-label">Total Spent</div>
          <div class="s-value">₹${formatAmount(totalSpent)}</div>
        </div>
        <div class="sum-card">
          <div class="s-label">Your Share</div>
          <div class="s-value">₹${formatAmount(myShare)}</div>
        </div>
        <div class="sum-card">
          <div class="s-label">Balance</div>
          <div class="s-value ${myNet > 0 ? 'amount-positive' : myNet < 0 ? 'amount-negative' : 'amount-zero'}">
            ${myNet >= 0 ? '+' : ''}₹${formatAmount(Math.abs(myNet))}
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Expenses Section -->
      <div class="section-heading">
        <h3>Expenses</h3>
        <button class="btn btn-primary btn-sm" onclick="Router.navigate('/trip/${tripCode}/add-expense')">+ Add</button>
      </div>

      <div id="expenses-list">
        ${expenses.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🧾</div>
            <h3>No expenses yet</h3>
            <p>Add your first expense and start tracking!</p>
            <button class="btn btn-primary" onclick="Router.navigate('/trip/${tripCode}/add-expense')">+ Add Expense</button>
          </div>` :
          expenses.map(e => renderExpenseCard(e, me, members, tripCode)).join('')
        }
      </div>

      <div class="divider"></div>

      <!-- Balances Section -->
      <div class="section-heading"><h3>Balances</h3></div>
      <div class="card" style="margin-bottom:16px">
        ${balances.map(b => {
          const isMe = me && b.member_id === me.id;
          return `
          <div class="balance-row">
            <div class="flex-center gap-8">
              ${avatar(b.member_name, b.color_index, 'avatar-sm')}
              <div class="balance-info">
                <div class="balance-name">${b.member_name}${isMe ? ' <span class="badge badge-primary" style="font-size:10px">You</span>' : ''}</div>
                <div class="balance-sub">Paid ₹${formatAmount(b.total_paid)}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="balance-amount ${b.net_balance > 0 ? 'amount-positive' : b.net_balance < 0 ? 'amount-negative' : 'amount-zero'}">
                ${b.net_balance >= 0 ? '+' : ''}₹${formatAmount(Math.abs(b.net_balance))}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <!-- Activity Section -->
      ${activity.length > 0 ? `
      <div class="section-heading"><h3>Recent Activity</h3></div>
      <div class="card">
        ${activity.map(a => `
          <div class="activity-item">
            <div class="activity-dot"></div>
            <div>
              <div class="activity-text">${a.description}</div>
              <div class="activity-time">${timeAgo(a.created_at)}</div>
            </div>
          </div>`).join('')}
      </div>` : ''}

      <div style="height:32px"></div>
    </div>`;

  } catch (err) {
    console.error('Dashboard error:', err);
    showToast('Failed to load dashboard', 'error');
    Router.navigate('/');
  }
}

/** Show the profile menu modal with history */
async function showProfileMenu() {
  const tripCode = getCurrentTripCode();
  const trip = await API.getTripByCode(tripCode);
  const me = await Session.getMember(tripCode);
  const history = History.getAll();

  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="menu-header">
        ${avatar(me?.name || 'Guest', me?.color_index || 0, 'avatar-lg')}
        <div class="name">${me?.name || 'Trip Member'}</div>
        <div class="trip-info">📍 ${trip.name}<br><span class="tiny">Code: ${trip.code}</span></div>
      </div>

      <div class="menu-actions">
        <button class="btn btn-ghost" onclick="goToHome()">➕ Add Another Trip</button>
        <button class="btn btn-primary" onclick="copyToClipboard('${tripCode}', 'Code copied!')">📋 Share Code</button>
      </div>

      <div class="history-section">
        <h4>Recent Trips</h4>
        <div class="history-list">
          ${history.length <= 1 ? '<p class="tiny" style="text-align:center;padding:20px;color:var(--text-muted)">No other trips in history</p>' : 
            history.filter(h => h.code !== tripCode).map(h => `
              <div class="history-item" onclick="switchTrip('${h.code}')">
                ${avatar(h.member, h.color, 'avatar-sm')}
                <div class="h-body">
                  <div class="h-name">${h.name}</div>
                  <div class="h-meta">${h.member} · ${h.code}</div>
                </div>
                <div class="h-arrow">→</div>
              </div>`).join('')
          }
        </div>
      </div>

      <button class="btn btn-ghost btn-full mt-24" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Close</button>
    </div>`;
  
  overlay.classList.remove('hidden');
}

/** Switch to a different trip from history */
function switchTrip(code) {
  document.getElementById('modal-overlay').classList.add('hidden');
  Session.restoreFromHistory(code);
  Router.navigate('/trip/' + code + '/dashboard');
}

/** Go back home to add another trip without clearing session */
function goToHome() {
  document.getElementById('modal-overlay').classList.add('hidden');
  Router.navigate('/');
}

/** Render a single expense card */
function renderExpenseCard(exp, me, members, tripCode) {
  const cat = CATEGORIES.find(c => c.id === exp.category_id) || CATEGORIES[4];
  const paidByMember = members.find(m => m.id === exp.paid_by);
  const canEdit = me && exp.added_by === me.id;

  return `<div class="expense-card">
    <div class="exp-cat-icon" style="background:${cat.bg}">${cat.emoji}</div>
    <div class="exp-body">
      <div class="exp-title">${exp.title}</div>
      <div class="exp-meta">Paid by ${paidByMember?.name || '?'} · ${cat.name}</div>
    </div>
    <div class="exp-right">
      <div class="exp-amount">₹${formatAmount(exp.total_amount)}</div>
      <div class="exp-added">${timeAgo(exp.created_at)}</div>
    </div>
    ${canEdit ? `<button class="edit-btn" onclick="event.stopPropagation();Router.navigate('/trip/${tripCode}/edit-expense/${exp.id}')">✏️</button>` : ''}
  </div>`;
}
