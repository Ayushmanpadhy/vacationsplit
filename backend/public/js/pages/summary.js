/**
 * VacationSplit — Summary Page
 * Trip cost overview, category breakdown, who paid what, expense list
 */

async function renderSummary(tripCode) {
  showLoading();

  try {
    const trip = await API.getTripByCode(tripCode);
    const [members, expenses, balances] = await Promise.all([
      API.getMembersByTrip(trip.id),
      API.getExpensesByTrip(trip.id),
      API.getBalances(trip.id)
    ]);

    const total     = expenses.reduce((s, e) => s + parseFloat(e.total_amount), 0);
    const perPerson = members.length > 0 ? Math.round((total / members.length) * 100) / 100 : 0;

    // Category breakdown
    const catTotals = CATEGORIES.map(c => ({
      ...c,
      total: expenses.filter(e => e.category_id === c.id).reduce((s, e) => s + parseFloat(e.total_amount), 0)
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

    const barColors = { 1: '#FF8C5A', 2: '#378ADD', 3: '#2D9B6F', 4: '#A855F7', 5: '#888780' };

    const app = document.getElementById('app');
    app.innerHTML = `
    ${renderBottomNav(tripCode, 'summary')}

    <div class="top-bar">
      <div class="top-bar-side">
        <button class="back-btn" onclick="Router.navigate('/trip/${tripCode}/dashboard')">←</button>
      </div>
      <div class="top-bar-title">Trip Summary</div>
      <div class="top-bar-side-right"></div>
    </div>

    <div class="page-inner" style="padding-top:20px">

      <!-- Total Cost Hero -->
      <div class="card" style="text-align:center;margin-bottom:16px;background:var(--surface-alt);border-color:#FFD4C0">
        <div class="label" style="margin-bottom:6px">Total Trip Cost</div>
        <div style="font-size:40px;font-weight:800;color:var(--primary)">₹${formatAmount(total)}</div>
        <div class="label" style="margin-top:6px">₹${formatAmount(perPerson)} fair share per person · ${members.length} members</div>
      </div>

      <!-- Category Breakdown -->
      <div class="section-heading"><h3>Spending by Category</h3></div>
      <div class="card" style="margin-bottom:16px">
        ${catTotals.length === 0
          ? '<p class="tiny" style="text-align:center;padding:16px">No expenses yet</p>'
          : catTotals.map(c => {
              const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
              return `<div class="cat-bar-row">
                <div class="cat-bar-label">${c.emoji} ${c.name}</div>
                <div class="cat-bar-track">
                  <div class="cat-bar-fill" style="width:${pct}%;background:${barColors[c.id]}"></div>
                </div>
                <div class="cat-bar-val">₹${formatAmount(c.total)}</div>
              </div>`;
            }).join('')
        }
      </div>

      <!-- Who Paid What -->
      <div class="section-heading"><h3>Who Paid What</h3></div>
      <div class="card" style="margin-bottom:16px">
        ${balances.map(b => {
          const pct  = total > 0 ? Math.round((b.total_paid / total) * 100) : 0;
          const diff = Math.round((b.total_paid - perPerson) * 100) / 100;
          return `<div style="margin-bottom:16px">
            <div class="flex-between mb-8">
              <div class="flex-center gap-8">
                ${avatar(b.member_name, b.color_index, 'avatar-sm')}
                <span style="font-size:14px;font-weight:600">${b.member_name}</span>
              </div>
              <div class="text-right">
                <div style="font-size:14px;font-weight:700">₹${formatAmount(b.total_paid)}</div>
                <div class="tiny ${diff > 0 ? 'amount-positive' : diff < 0 ? 'amount-negative' : ''}" style="font-size:11px">
                  ${diff > 0 ? `+₹${formatAmount(diff)} extra` : diff < 0 ? `-₹${formatAmount(Math.abs(diff))} less` : 'Fair share'}
                </div>
              </div>
            </div>
            <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:var(--primary);border-radius:3px;transition:width 0.6s ease"></div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <!-- All Expenses List -->
      <div class="section-heading"><h3>All Expenses (${expenses.length})</h3></div>
      <div class="card" style="margin-bottom:16px">
        ${expenses.length === 0
          ? '<p class="tiny" style="text-align:center;padding:16px">No expenses</p>'
          : expenses.map(e => {
              const cat = CATEGORIES.find(c => c.id === e.category_id) || CATEGORIES[4];
              const paidBy = members.find(m => m.id === e.paid_by);
              return `<div class="flex-between" style="padding:10px 0;border-bottom:1px solid var(--border)">
                <div class="flex-center gap-8">
                  <span style="font-size:18px">${cat.emoji}</span>
                  <div>
                    <div style="font-size:13px;font-weight:600">${e.title}</div>
                    <div class="tiny">${paidBy?.name || '?'} · ${formatDate(e.created_at)}</div>
                  </div>
                </div>
                <div style="font-size:14px;font-weight:700">₹${formatAmount(e.total_amount)}</div>
              </div>`;
            }).join('')
        }
      </div>

      <!-- Share Button -->
      <div class="share-actions">
        <button class="btn btn-primary btn-full" onclick="shareSummary('${tripCode}', true)">🚀 Share to WhatsApp</button>
        <button class="btn btn-ghost btn-full mt-12" onclick="shareSummary('${tripCode}', false)">📋 Copy Summary Text</button>
      </div>

      <div style="height:32px"></div>
    </div>`;

  } catch (err) {
    console.error('Summary error:', err);
    showToast('Failed to load summary', 'error');
    Router.navigate('/trip/' + tripCode + '/dashboard');
  }
}

/** Format and share trip summary */
async function shareSummary(tripCode, openWhatsApp) {
  try {
    const trip = await API.getTripByCode(tripCode);
    const [members, expenses, balances, settlements] = await Promise.all([
      API.getMembersByTrip(trip.id),
      API.getExpensesByTrip(trip.id),
      API.getBalances(trip.id),
      API.getSettlements(trip.id)
    ]);

    const total = expenses.reduce((s, e) => s + parseFloat(e.total_amount), 0);
    const perPerson = total / members.length;

    let msg = `✈️ *${trip.name.toUpperCase()}*\n`;
    msg += `📍 _${trip.destination || 'Vacation'}_ \n\n`;
    msg += `💰 *TOTAL COST:* ₹${formatAmount(total)}\n`;
    msg += `👥 *PER PERSON:* ₹${formatAmount(perPerson)}\n\n`;
    
    msg += `*PAID BY:*\n`;
    balances.forEach(b => {
      msg += `• ${b.member_name}: ₹${formatAmount(b.total_paid)}\n`;
    });

    msg += `\n*SETTLEMENTS:*\n`;
    if (settlements.length === 0) {
      msg += `✅ Everyone is settled up! 🎉\n`;
    } else {
      settlements.forEach(s => {
        msg += `👉 ${s.payer} ➔ ${s.receiver}: *₹${formatAmount(s.amount)}*\n`;
      });
    }

    msg += `\n_Generated by VacationSplit_ ✈️`;

    if (openWhatsApp) {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      copyToClipboard(msg, 'Summary copied! 🎉');
    }
  } catch (err) {
    showToast('Failed to generate summary', 'error');
  }
}
