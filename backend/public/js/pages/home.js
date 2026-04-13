/**
 * VacationSplit — Home Page
 * Create trip or join with code
 */

// Track members added in the create form
let _homeMembers = [];

function renderHome() {
  _homeMembers = [];

  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="home-page">
    <div class="home-logo">✈️ VacationSplit</div>
    <p class="home-sub">Split trip expenses with your group.<br>No signups. No confusion.</p>

    <div class="home-cards">
      <div class="home-card" id="hc-create" onclick="selectHomeCard('create')">
        <div class="hc-icon">🗺️</div>
        <div class="hc-title">Create a Trip</div>
        <div class="hc-sub">Start a new group</div>
      </div>
      <div class="home-card" id="hc-join" onclick="selectHomeCard('join')">
        <div class="hc-icon">🔑</div>
        <div class="hc-title">Join with Code</div>
        <div class="hc-sub">Enter trip code</div>
      </div>
    </div>

    <!-- Recent Trips (History) -->
    <div id="home-history" class="recent-trips-home hidden"></div>

    <!-- Create Trip Form -->
    <div class="home-form hidden" id="form-create">
      <h3 style="margin-bottom:16px">Create Your Trip</h3>

      <div class="input-group">
        <label for="trip-name">Trip name</label>
        <input type="text" id="trip-name" placeholder="e.g. Goa Trip 2025" maxlength="60"/>
      </div>

      <div class="input-group">
        <label for="trip-dest">Destination</label>
        <input type="text" id="trip-dest" placeholder="e.g. Goa, India" maxlength="80"/>
      </div>

      <div class="input-row">
        <div class="input-group" style="margin-bottom:0">
          <label for="trip-start">Start date</label>
          <input type="date" id="trip-start"/>
        </div>
        <div class="input-group" style="margin-bottom:0">
          <label for="trip-end">End date</label>
          <input type="date" id="trip-end"/>
        </div>
      </div>

      <div style="margin-top:16px" class="input-group">
        <label for="creator-name">Your name</label>
        <input type="text" id="creator-name" placeholder="What do your friends call you?" maxlength="30"/>
      </div>

      <div style="margin-top:4px">
        <label class="label" style="display:block;margin-bottom:8px">
          Add members <span class="tiny">(min 1 more, max 19)</span>
        </label>
        <div class="add-member-row">
          <input type="text" id="member-input" placeholder="Friend's name" maxlength="30"
            onkeydown="if(event.key==='Enter'){event.preventDefault();addHomeMember()}"/>
          <button class="btn btn-outline btn-sm" onclick="addHomeMember()">Add</button>
        </div>
        <div class="member-pills" id="member-pills"></div>
        <div id="members-error" class="field-error hidden">Add at least 1 more member</div>
      </div>

      <button class="btn btn-primary btn-full" style="margin-top:24px" id="create-btn" onclick="submitCreate()">
        Create Trip 🚀
      </button>
    </div>

    <!-- Join Trip Form -->
    <div class="home-form hidden" id="form-join">
      <h3 style="margin-bottom:16px">Join a Trip</h3>

      <div class="input-group">
        <label for="join-code">Trip code</label>
        <input type="text" id="join-code" placeholder="e.g. GOA25X" maxlength="6"
          oninput="this.value=this.value.toUpperCase();lookupTrip()"/>
      </div>

      <div id="join-trip-info" class="hidden" style="margin-bottom:12px">
        <div class="card card-sm" style="background:var(--primary-faint);border-color:#FFD4C0">
          <div style="font-size:14px;font-weight:700" id="join-trip-name"></div>
          <div class="tiny" id="join-trip-dest"></div>
        </div>
      </div>

      <div id="join-members-wrap" class="hidden">
        <div class="input-group">
          <label for="join-member-select">Select your name</label>
          <select id="join-member-select"></select>
        </div>
      </div>

      <div id="join-error" class="field-error hidden">Trip not found. Check the code.</div>

      <button class="btn btn-primary btn-full" style="margin-top:16px" onclick="submitJoin()">
        Join Trip
      </button>
    </div>
  </div>`;

  renderRecentTrips();
}

/** Render recent trips from history */
function renderRecentTrips() {
  const history = History.getAll();
  const container = document.getElementById('home-history');
  if (!container || history.length === 0) return;

  container.innerHTML = `
    <div class="recent-trips-home-title flex-between">
      <span>Recent Trips</span>
      <button class="link-btn-muted" style="font-size:10px" onclick="forgetAllHistory()">Forget All</button>
    </div>
    <div class="history-list">
      ${history.map(h => `
        <div class="history-item" onclick="Session.restoreFromHistory('${h.code}'); Router.navigate('/trip/${h.code}/dashboard')">
          ${avatar(h.member, h.color, 'avatar-sm')}
          <div class="h-body">
            <div class="h-name">${h.name}</div>
            <div class="h-meta">${h.member} · ${h.code}</div>
          </div>
          <div class="h-arrow">→</div>
        </div>`).join('')}
    </div>`;
  container.classList.remove('hidden');
}

/** Wipe all trip history from this device */
function forgetAllHistory() {
  showModal(
    'Forget All History?',
    'This will remove all recent trips from this device. You will need the trip codes to join them again.',
    'Yes, Forget All',
    () => {
      localStorage.removeItem('vs_history');
      renderRecentTrips();
      showToast('History cleared', '');
    },
    true
  );
}

/** Toggle between Create and Join forms */
function selectHomeCard(type) {
  document.getElementById('hc-create').classList.toggle('selected', type === 'create');
  document.getElementById('hc-join').classList.toggle('selected', type === 'join');
  document.getElementById('form-create').classList.toggle('hidden', type !== 'create');
  document.getElementById('form-join').classList.toggle('hidden', type !== 'join');
}

/** Add a member pill to the create form */
function addHomeMember() {
  const inp = document.getElementById('member-input');
  const name = inp.value.trim();
  if (!name || _homeMembers.includes(name)) { inp.focus(); return; }
  if (_homeMembers.length >= 19) { showToast('Max 20 members allowed', 'error'); return; }
  _homeMembers.push(name);
  inp.value = '';
  renderHomePills();
  inp.focus();
  document.getElementById('members-error').classList.add('hidden');
}

/** Remove a member pill */
function removeHomeMember(name) {
  _homeMembers = _homeMembers.filter(m => m !== name);
  renderHomePills();
}

/** Render all member pills */
function renderHomePills() {
  document.getElementById('member-pills').innerHTML = _homeMembers.map(m => `
    <div class="member-pill">
      ${m}
      <button class="remove" onclick="removeHomeMember('${m.replace(/'/g, "\\'")}')">✕</button>
    </div>`).join('');
}

/** Submit the create trip form */
async function submitCreate() {
  const name    = document.getElementById('trip-name').value.trim();
  const dest    = document.getElementById('trip-dest').value.trim();
  const start   = document.getElementById('trip-start').value;
  const end     = document.getElementById('trip-end').value;
  const creator = document.getElementById('creator-name').value.trim();

  // Validate
  if (!name) { showToast('Enter a trip name', 'error'); return; }
  if (!creator) { showToast('Enter your name', 'error'); return; }
  if (_homeMembers.length < 1) {
    document.getElementById('members-error').classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('create-btn');
  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    const result = await API.createTrip({
      name,
      destination: dest,
      start_date: start || null,
      end_date: end || null,
      creator_name: creator,
      members: _homeMembers
    });

    // Save session
    Session.setMember(result.trip_code, result.member_token, name, creator, result.color_index || 0);
    showToast('Trip created! 🎉', 'success');
    Router.navigate('/trip/' + result.trip_code + '/dashboard');
  } catch (err) {
    showToast(err.message || 'Failed to create trip', 'error');
    btn.disabled = false;
    btn.textContent = 'Create Trip 🚀';
  }
}

/** Lookup a trip by code and show members */
async function lookupTrip() {
  const code = document.getElementById('join-code').value.trim();
  const err  = document.getElementById('join-error');
  const wrap = document.getElementById('join-members-wrap');
  const info = document.getElementById('join-trip-info');

  if (code.length < 6) {
    wrap.classList.add('hidden');
    err.classList.add('hidden');
    info.classList.add('hidden');
    return;
  }

  try {
    const trip = await API.getTripByCode(code);
    err.classList.add('hidden');

    // Show trip info
    document.getElementById('join-trip-name').textContent = trip.name;
    document.getElementById('join-trip-dest').textContent = trip.destination ? `📍 ${trip.destination}` : '';
    info.classList.remove('hidden');

    // Load members
    const members = await API.getMembersByTrip(trip.id);
    const sel = document.getElementById('join-member-select');
    sel.innerHTML = '<option value="">-- Select your name --</option>' +
      members.map(m => `<option value="${m.token}">${m.name}</option>`).join('');
    wrap.classList.remove('hidden');
  } catch {
    err.classList.remove('hidden');
    wrap.classList.add('hidden');
    info.classList.add('hidden');
  }
}

/** Submit the join trip form */
async function submitJoin() {
  const code  = document.getElementById('join-code').value.trim();
  const token = document.getElementById('join-member-select')?.value;

  if (!token) { showToast('Select your name', 'error'); return; }

  try {
    const trip = await API.getTripByCode(code);
    const members = await API.getMembersByTrip(trip.id);
    const me = members.find(m => m.token === token);

    Session.setMember(trip.code, token, trip.name, me?.name || 'Member', me?.color_index || 0);
    showToast('Welcome to the trip! 🏖️', 'success');
    Router.navigate('/trip/' + trip.code + '/dashboard');
  } catch {
    showToast('Trip not found', 'error');
  }
}
