/**
 * VacationSplit — Add/Edit Expense Page
 * Full expense form with category picker, payer selector,
 * member split grid, even/custom split, and validation
 */

// Form state
let _expState = {};

async function renderAddExpense(tripCode, expenseId = null) {
  showLoading();

  try {
    const trip = await API.getTripByCode(tripCode);
    const me   = await Session.getMember(tripCode);
    const members = await API.getMembersByTrip(trip.id);

    // If editing, load existing expense data
    let editing = null;
    let existingSplits = [];
    if (expenseId) {
      const expenses = await API.getExpensesByTrip(trip.id);
      editing = expenses.find(e => e.id == expenseId);
      if (!editing || !me || editing.added_by !== me.id) {
        showToast('You can only edit your own expenses', 'error');
        Router.navigate('/trip/' + tripCode + '/dashboard');
        return;
      }
      existingSplits = await API.getSplitsByExpense(editing.id);
    }

    // Initialize form state
    _expState = {
      tripCode,
      trip,
      me,
      members,
      selectedCategory: editing?.category_id || null,
      selectedPayer: editing?.paid_by || me?.id || null,
      selectedSplit: existingSplits.length > 0
        ? existingSplits.map(s => s.member_id)
        : members.map(m => m.id),
      splitType: editing?.split_type || 'even',
      editing,
      existingSplits
    };

    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="top-bar">
      <div class="top-bar-side">
        <button class="back-btn" onclick="Router.navigate('/trip/${tripCode}/dashboard')">←</button>
      </div>
      <div class="top-bar-title">${editing ? 'Edit Expense' : 'Add Expense'}</div>
      <div class="top-bar-side-right"></div>
    </div>

    <div class="page-inner-sm" style="padding-top:20px">
      ${editing ? '<div class="warning-banner">⚠️ Editing this will update everyone\'s balances</div>' : ''}

      <!-- Title -->
      <div class="input-group">
        <label for="exp-title">What was it for?</label>
        <input type="text" id="exp-title" placeholder="e.g. Beach dinner, Hotel booking" maxlength="100"
          value="${editing?.title || ''}" oninput="validateExpForm()"/>
      </div>

      <!-- Category -->
      <div class="input-group">
        <label>Category</label>
        <div class="cat-pills" id="cat-pills">
          ${CATEGORIES.map(c => `
            <div class="cat-pill ${_expState.selectedCategory === c.id ? 'selected' : ''}"
              onclick="selectCat(${c.id})" id="cat-${c.id}">
              ${c.emoji} ${c.name}
            </div>`).join('')}
        </div>
      </div>

      <!-- Amount -->
      <div class="input-group">
        <label for="exp-amount">Total amount</label>
        <div class="input-prefix-wrap">
          <span class="prefix">₹</span>
          <input type="number" id="exp-amount" placeholder="0" min="1" step="0.01"
            value="${editing?.total_amount || ''}" oninput="validateExpForm();updateEvenPreview()"/>
        </div>
      </div>

      <!-- Paid By -->
      <div class="input-group">
        <label>Paid by</label>
        <div class="paid-by-row" id="paid-by-row">
          ${members.map(m => `
            <div class="payer-pill ${_expState.selectedPayer === m.id ? 'selected' : ''}"
              id="payer-${m.id}" onclick="selectPayer(${m.id})">
              ${avatar(m.name, m.color_index)}
              <div class="pname">${m.name.split(' ')[0]}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Split Members -->
      <div class="input-group">
        <div class="flex-between mb-8">
          <label style="margin:0">Who is splitting this?</label>
          <div style="display:flex;gap:8px">
            <button class="link-btn" onclick="selectAllMembers()">All</button>
            <button class="link-btn-muted" onclick="clearMembers()">Clear</button>
          </div>
        </div>
        <div class="member-grid" id="split-grid">
          ${members.map(m => `
            <div class="member-card ${_expState.selectedSplit.includes(m.id) ? 'selected' : ''}"
              id="mc-${m.id}" onclick="toggleSplitMember(${m.id})">
              ${avatar(m.name, m.color_index, 'avatar-sm')}
              <div class="name">${m.name}</div>
              <div class="check"></div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Split Type -->
      <div class="input-group">
        <label>Split type</label>
        <div class="split-toggle">
          <button class="split-toggle-btn ${_expState.splitType === 'even' ? 'active' : ''}"
            id="st-even" onclick="setSplitType('even')">⚖️ Even Split</button>
          <button class="split-toggle-btn ${_expState.splitType === 'custom' ? 'active' : ''}"
            id="st-custom" onclick="setSplitType('custom')">✏️ Custom Split</button>
        </div>

        <div id="even-preview" class="${_expState.splitType === 'even' ? '' : 'hidden'}">
          <div class="even-preview" id="even-preview-text">Select members and enter amount</div>
        </div>

        <div id="custom-split-section" class="${_expState.splitType === 'custom' ? '' : 'hidden'}">
          <div id="custom-amounts"></div>
          <div class="split-bar-wrap"><div class="split-bar partial" id="split-bar" style="width:0%"></div></div>
          <div class="flex-between">
            <div class="split-status partial" id="split-status-text">₹0 of ₹0 assigned</div>
          </div>
        </div>
      </div>

      <!-- Note -->
      <div class="input-group">
        <label for="exp-note">Note <span class="tiny">(optional)</span></label>
        <input type="text" id="exp-note" placeholder="Add a note..." value="${editing?.note || ''}"/>
      </div>

      <!-- Save Button -->
      <button class="btn btn-primary btn-full" id="save-btn" disabled onclick="saveExpense()">
        ${editing ? 'Save Changes' : 'Save Expense'}
      </button>

      ${editing ? `
      <div style="text-align:center;margin-top:16px">
        <button class="link-btn-muted" onclick="deleteExpenseConfirm()">🗑️ Delete this expense</button>
      </div>` : ''}

      <div style="height:32px"></div>
    </div>`;

    // Initialize previews
    updateEvenPreview();
    if (_expState.splitType === 'custom') renderCustomAmounts();
    validateExpForm();

  } catch (err) {
    console.error('Add expense error:', err);
    showToast('Failed to load form', 'error');
    Router.navigate('/trip/' + tripCode + '/dashboard');
  }
}

// ── Category Selection ───────────────────────────────────

function selectCat(id) {
  _expState.selectedCategory = id;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('selected'));
  document.getElementById('cat-' + id)?.classList.add('selected');
  validateExpForm();
}

// ── Payer Selection ──────────────────────────────────────

function selectPayer(id) {
  _expState.selectedPayer = id;
  document.querySelectorAll('.payer-pill').forEach(p => p.classList.remove('selected'));
  document.getElementById('payer-' + id)?.classList.add('selected');
  validateExpForm();
}

// ── Split Member Selection ───────────────────────────────

function toggleSplitMember(id) {
  if (_expState.selectedSplit.includes(id)) {
    if (_expState.selectedSplit.length === 1) return; // Keep at least 1
    _expState.selectedSplit = _expState.selectedSplit.filter(x => x !== id);
  } else {
    _expState.selectedSplit.push(id);
  }
  document.getElementById('mc-' + id)?.classList.toggle('selected', _expState.selectedSplit.includes(id));
  updateEvenPreview();
  if (_expState.splitType === 'custom') renderCustomAmounts();
  validateExpForm();
}

function selectAllMembers() {
  _expState.selectedSplit = _expState.members.map(m => m.id);
  _expState.members.forEach(m => document.getElementById('mc-' + m.id)?.classList.add('selected'));
  updateEvenPreview();
  if (_expState.splitType === 'custom') renderCustomAmounts();
  validateExpForm();
}

function clearMembers() {
  const defaultId = _expState.me?.id || _expState.members[0]?.id;
  _expState.selectedSplit = defaultId ? [defaultId] : [];
  _expState.members.forEach(m => {
    document.getElementById('mc-' + m.id)?.classList.toggle('selected', _expState.selectedSplit.includes(m.id));
  });
  updateEvenPreview();
  if (_expState.splitType === 'custom') renderCustomAmounts();
  validateExpForm();
}

// ── Split Type Toggle ────────────────────────────────────

function setSplitType(type) {
  _expState.splitType = type;
  document.getElementById('st-even').classList.toggle('active', type === 'even');
  document.getElementById('st-custom').classList.toggle('active', type === 'custom');
  document.getElementById('even-preview').classList.toggle('hidden', type !== 'even');
  document.getElementById('custom-split-section').classList.toggle('hidden', type !== 'custom');
  if (type === 'even') updateEvenPreview();
  else renderCustomAmounts();
  validateExpForm();
}

// ── Even Split Preview ───────────────────────────────────

function updateEvenPreview() {
  const amt  = parseFloat(document.getElementById('exp-amount')?.value) || 0;
  const cnt  = _expState.selectedSplit.length;
  const prev = document.getElementById('even-preview-text');
  if (!prev) return;

  if (amt > 0 && cnt > 0) {
    const each = Math.round((amt / cnt) * 100) / 100;
    prev.textContent = `✓ Each person owes ₹${formatAmount(each)} (${cnt} people)`;
    prev.style.background = 'var(--success-light)';
    prev.style.color = 'var(--success)';
  } else {
    prev.textContent = 'Enter amount and select members';
    prev.style.background = 'var(--primary-faint)';
    prev.style.color = 'var(--primary)';
  }
}

// ── Custom Split Amounts ─────────────────────────────────

function renderCustomAmounts() {
  const section = document.getElementById('custom-amounts');
  if (!section) return;

  section.innerHTML = _expState.selectedSplit.map(id => {
    const m   = _expState.members.find(x => x.id === id);
    const old = _expState.existingSplits.find(s => s.member_id === id);
    if (!m) return '';
    return `<div class="custom-amount-row">
      <div class="flex-center gap-8" style="flex:1">
        ${avatar(m.name, m.color_index, 'avatar-sm')}
        <span style="font-size:13px;font-weight:600">${m.name}</span>
      </div>
      <div class="input-prefix-wrap" style="width:110px">
        <span class="prefix" style="font-size:13px">₹</span>
        <input type="number" style="padding:8px 10px 8px 22px;font-size:13px;font-weight:600;text-align:right"
          min="0" step="0.01" placeholder="0"
          value="${old ? old.amount_owed : ''}"
          data-member-id="${id}" oninput="updateCustomBar()"/>
      </div>
    </div>`;
  }).join('');

  updateCustomBar();
}

function updateCustomBar() {
  const inputs = document.querySelectorAll('#custom-amounts input[data-member-id]');
  let assigned = 0;
  inputs.forEach(inp => { assigned += parseFloat(inp.value) || 0; });
  assigned = Math.round(assigned * 100) / 100;
  const total = parseFloat(document.getElementById('exp-amount')?.value) || 0;

  const pct  = total > 0 ? Math.min((assigned / total) * 100, 100) : 0;
  const bar  = document.getElementById('split-bar');
  const stat = document.getElementById('split-status-text');
  if (!bar || !stat) return;

  bar.style.width = pct + '%';
  const diff = Math.round((total - assigned) * 100) / 100;

  if (Math.abs(diff) < 0.01) {
    bar.className = 'split-bar ok';
    stat.className = 'split-status ok';
    stat.textContent = `✓ Amounts match ₹${formatAmount(total)}`;
  } else if (assigned > total) {
    bar.className = 'split-bar over';
    stat.className = 'split-status over';
    stat.textContent = `Over by ₹${formatAmount(assigned - total)}`;
  } else {
    bar.className = 'split-bar partial';
    stat.className = 'split-status partial';
    stat.textContent = `₹${formatAmount(assigned)} of ₹${formatAmount(total)} assigned`;
  }
  validateExpForm();
}

// ── Form Validation ──────────────────────────────────────

function validateExpForm() {
  const title  = document.getElementById('exp-title')?.value.trim();
  const amount = parseFloat(document.getElementById('exp-amount')?.value);
  const btn    = document.getElementById('save-btn');
  if (!btn) return;

  let valid = title && amount > 0 && _expState.selectedPayer && _expState.selectedSplit.length > 0;

  if (valid && _expState.splitType === 'custom') {
    const inputs = document.querySelectorAll('#custom-amounts input[data-member-id]');
    let assigned = 0;
    inputs.forEach(inp => assigned += parseFloat(inp.value) || 0);
    assigned = Math.round(assigned * 100) / 100;
    const total = Math.round(amount * 100) / 100;
    valid = Math.abs(total - assigned) < 0.01;
  }

  btn.disabled = !valid;
}

// ── Build Splits from Form ───────────────────────────────

function getSplitsFromForm() {
  const total = parseFloat(document.getElementById('exp-amount').value);
  const cnt   = _expState.selectedSplit.length;

  if (_expState.splitType === 'even') {
    const each = Math.round((total / cnt) * 100) / 100;
    return _expState.selectedSplit.map(id => ({ member_id: id, amount_owed: each }));
  } else {
    const inputs = document.querySelectorAll('#custom-amounts input[data-member-id]');
    return Array.from(inputs).map(inp => ({
      member_id: parseInt(inp.dataset.memberId),
      amount_owed: parseFloat(inp.value) || 0
    }));
  }
}

// ── Save Expense ─────────────────────────────────────────

async function saveExpense() {
  const title  = document.getElementById('exp-title').value.trim();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const note   = document.getElementById('exp-note').value.trim();
  const splits = getSplitsFromForm();

  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const data = {
    trip_id:     _expState.trip.id,
    title,
    total_amount: amount,
    paid_by:     _expState.selectedPayer,
    added_by:    _expState.me?.id,
    category_id: _expState.selectedCategory || 5,
    split_type:  _expState.splitType,
    note,
    splits
  };

  try {
    if (_expState.editing) {
      data.member_token = Session.getToken(_expState.tripCode);
      await API.updateExpense(_expState.editing.id, data);
      showToast('Expense updated ✓', 'success');
    } else {
      await API.addExpense(data);
      showToast('Expense added ✓', 'success');
    }
    Router.navigate('/trip/' + _expState.tripCode + '/dashboard');
  } catch (err) {
    showToast(err.message || 'Failed to save expense', 'error');
    btn.disabled = false;
    btn.textContent = _expState.editing ? 'Save Changes' : 'Save Expense';
  }
}

// ── Delete Expense ───────────────────────────────────────

function deleteExpenseConfirm() {
  showModal(
    'Delete Expense',
    'This will remove the expense and recalculate all balances for everyone.',
    'Delete',
    async () => {
      try {
        await API.deleteExpense(_expState.editing.id, Session.getToken(_expState.tripCode));
        showToast('Expense deleted', '');
        Router.navigate('/trip/' + _expState.tripCode + '/dashboard');
      } catch (err) {
        showToast(err.message || 'Failed to delete', 'error');
      }
    },
    true
  );
}
