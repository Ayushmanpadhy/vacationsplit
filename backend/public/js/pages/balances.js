/**
 * VacationSplit — Balances / Settle Up Page
 * Shows net balance, who owes whom, smart settlement plan
 */

async function renderBalances(tripCode) {
  showLoading();

  try {
    const trip = await API.getTripByCode(tripCode);
    const me   = await Session.getMember(tripCode);

    const [balances, settlements] = await Promise.all([
      API.getBalances(trip.id),
      API.getSettlements(trip.id)
    ]);

    const myBalance = balances.find(b => b.member_id === me?.id);
    const net = myBalance?.net_balance || 0;

    // Who I owe / Who owes me
    const iOwe    = settlements.filter(s => me && s.payer_id === me.id);
    const owedToMe = settlements.filter(s => me && s.receiver_id === me.id);

    const app = document.getElementById('app');
    app.innerHTML = `
    ${renderBottomNav(tripCode, 'balances')}

    <div class="top-bar">
      <div class="top-bar-side">
        <button class="back-btn" onclick="Router.navigate('/trip/${tripCode}/dashboard')">←</button>
      </div>
      <div class="top-bar-title">Settle Up</div>
      <div class="top-bar-side-right"></div>
    </div>

    <div class="page-inner-sm" style="padding-top:20px">

      <!-- Net Balance Card -->
      <div class="net-balance-card" style="background:${net > 0 ? 'var(--success-light)' : net < 0 ? 'var(--danger-light)' : '#F0EDE8'}">
        <div class="nb-label" style="color:${net > 0 ? 'var(--success)' : net < 0 ? 'var(--danger)' : 'var(--text-muted)'}">
          ${net > 0 ? 'You are owed' : net < 0 ? 'You owe in total' : 'You are all settled'}
        </div>
        <div class="nb-amount" style="color:${net > 0 ? 'var(--success)' : net < 0 ? 'var(--danger)' : 'var(--text-muted)'}">
          ₹${formatAmount(Math.abs(net))}
        </div>
        <div class="nb-sub" style="color:${net > 0 ? 'var(--success)' : net < 0 ? 'var(--danger)' : 'var(--text-muted)'}">
          ${net > 0 ? 'People owe you money' : net < 0 ? 'You need to pay people' : 'Nothing to settle 🎉'}
        </div>
      </div>

      <!-- You Owe Section -->
      ${iOwe.length > 0 ? `
      <div class="section-heading"><h3>You owe</h3></div>
      <div class="card" style="margin-bottom:16px">
        ${iOwe.map(s => `
          <div class="balance-row">
            <div class="flex-center gap-8">
              ${avatar(s.receiver, s.receiver_color, 'avatar-sm')}
              <div class="balance-info">
                <div class="balance-name">${s.receiver}</div>
                <div class="balance-sub">You need to pay</div>
              </div>
            </div>
            <div class="flex-center gap-8">
              <div class="balance-amount amount-negative">₹${formatAmount(s.amount)}</div>
              <button class="btn-settle" onclick="markPaid('${tripCode}', ${s.payer_id}, ${s.receiver_id}, ${s.amount}, '${s.payer.replace(/'/g, "\\'")}', '${s.receiver.replace(/'/g, "\\'")}')">Paid ✓</button>
            </div>
          </div>`).join('')}
      </div>` : ''}

      <!-- Owed to You Section -->
      ${owedToMe.length > 0 ? `
      <div class="section-heading"><h3>Owed to you</h3></div>
      <div class="card" style="margin-bottom:16px">
        ${owedToMe.map(s => {
          const msg = `Hey ${s.payer}, you owe me ₹${formatAmount(s.amount)} from ${trip.name}! Please settle up 🙏`;
          return `
          <div class="balance-row">
            <div class="flex-center gap-8">
              ${avatar(s.payer, s.payer_color, 'avatar-sm')}
              <div class="balance-info">
                <div class="balance-name">${s.payer}</div>
                <div class="balance-sub">Owes you</div>
              </div>
            </div>
            <div class="flex-center gap-8">
              <div class="balance-amount amount-positive">₹${formatAmount(s.amount)}</div>
              <div style="display:flex;gap:4px">
                <button class="btn-remind" onclick="copyToClipboard(\`${msg}\`,'Reminder copied!')">Remind 📋</button>
                <button class="btn-settle" onclick="markPaid('${tripCode}', ${s.payer_id}, ${s.receiver_id}, ${s.amount}, '${s.payer.replace(/'/g, "\\'")}', '${s.receiver.replace(/'/g, "\\'")}')">Paid ✓</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>` : ''}

      <!-- Smart Settlement Plan -->
      ${settlements.length > 0 ? `
      <div class="section-heading"><h3>Smart Settlement Plan</h3></div>
      <p class="label" style="margin-bottom:12px;color:var(--text-muted)">Minimum transactions for everyone to settle up</p>
      <div class="card" style="margin-bottom:16px">
        ${settlements.map(s => `
          <div class="settlement-row">
            <div class="flex-center gap-8">
              ${avatar(s.payer, s.payer_color, 'avatar-xs')}
              <div class="s-from">${s.payer}</div>
            </div>
            <div class="s-arrow">→</div>
            <div class="flex-center gap-8">
              ${avatar(s.receiver, s.receiver_color, 'avatar-xs')}
              <div class="s-to">${s.receiver}</div>
            </div>
            <div class="s-amount">₹${formatAmount(s.amount)}</div>
          </div>`).join('')}
      </div>` : `
      <div class="empty-state">
        <div class="empty-icon">🎉</div>
        <h3>All settled!</h3>
        <p>No outstanding balances in this trip</p>
      </div>`}

      <!-- All Balances -->
      <div class="section-heading"><h3>All Balances</h3></div>
      <div class="card">
        ${balances.map(b => `
          <div class="balance-row">
            <div class="flex-center gap-8">
              ${avatar(b.member_name, b.color_index, 'avatar-sm')}
              <div class="balance-info">
                <div class="balance-name">${b.member_name}${me && b.member_id === me.id ? ' <span class="badge badge-primary" style="font-size:10px">You</span>' : ''}</div>
                <div class="balance-sub">Paid ₹${formatAmount(b.total_paid)} · Owes ₹${formatAmount(b.total_owed)}</div>
              </div>
            </div>
            <div class="balance-amount ${b.net_balance > 0.01 ? 'amount-positive' : b.net_balance < -0.01 ? 'amount-negative' : 'amount-zero'}">
              ${b.net_balance >= 0 ? '+' : ''}₹${formatAmount(Math.abs(b.net_balance))}
            </div>
          </div>`).join('')}
      </div>

      <div style="height:32px"></div>
    </div>`;

  } catch (err) {
    console.error('Balances error:', err);
    showToast('Failed to load balances', 'error');
    Router.navigate('/trip/' + tripCode + '/dashboard');
  }
}

/** Mark a payment as settled (records a real transaction) */
async function markPaid(tripCode, payerId, receiverId, amount, payerName, receiverName) {
  const trip = await API.getTripByCode(tripCode);
  const me = await Session.getMember(tripCode);

  showLoading();
  try {
    await API.addExpense({
      trip_id: trip.id,
      title: `Settlement: ${payerName} paid ${receiverName}`,
      total_amount: amount,
      paid_by: payerId,
      added_by: me?.id,
      category_id: 6, // Settlement
      split_type: 'even',
      note: 'Automatic settlement payment',
      splits: [{ member_id: receiverId, amount_owed: amount }]
    });

    showToast(`Settlement recorded! ✓`, 'success');
    renderBalances(tripCode);
  } catch (err) {
    showToast('Failed to record settlement', 'error');
    renderBalances(tripCode);
  }
}
