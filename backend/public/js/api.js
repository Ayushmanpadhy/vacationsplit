/**
 * VacationSplit — API Service
 * Handles all HTTP requests to the backend and session management
 */

const API_BASE = '/api';

const API = {
  // ── Generic request helper ─────────────────────────────
  async request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(API_BASE + path, opts);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      return data;
    } catch (err) {
      console.error(`API ${method} ${path}:`, err);
      throw err;
    }
  },

  // ── Trips ──────────────────────────────────────────────
  createTrip(data)     { return this.request('POST', '/trips', data); },
  getTripByCode(code)  { return this.request('GET', `/trips/${code.toUpperCase()}`); },
  deleteTrip(code, tkn) { return this.request('DELETE', `/trips/${code.toUpperCase()}?member_token=${tkn}`); },

  // ── Members ────────────────────────────────────────────
  getMembersByTrip(tripId)   { return this.request('GET', `/members/trip/${tripId}`); },
  addMember(tripId, name)    { return this.request('POST', `/members/trip/${tripId}`, { name }); },
  getMemberByToken(token)    { return this.request('GET', `/members/token/${token}`); },

  // ── Expenses ───────────────────────────────────────────
  getExpensesByTrip(tripId)  { return this.request('GET', `/expenses/trip/${tripId}`); },
  getSplitsByExpense(expId)  { return this.request('GET', `/expenses/${expId}/splits`); },
  addExpense(data)           { return this.request('POST', '/expenses', data); },
  updateExpense(id, data)    { return this.request('PUT', `/expenses/${id}`, data); },
  deleteExpense(id, token)   { return this.request('DELETE', `/expenses/${id}?member_token=${token}`); },

  // ── Balances ───────────────────────────────────────────
  getBalances(tripId)        { return this.request('GET', `/balances/trip/${tripId}`); },
  getSettlements(tripId)     { return this.request('GET', `/balances/trip/${tripId}/settlements`); },

  // ── Activity ───────────────────────────────────────────
  getActivity(tripId)        { return this.request('GET', `/activity/trip/${tripId}`); }
};

// ── Session & History Management ─────────────────────────

const History = {
  /** Save a trip to the local storage history */
  add(tripCode, tripName, memberName, token, colorIdx) {
    let history = this.getAll();
    // Remove if already exists to move to top
    history = history.filter(h => h.code !== tripCode);
    history.unshift({ code: tripCode, name: tripName, member: memberName, token, color: colorIdx, date: new Date().toISOString() });
    // Limit to 10 trips
    localStorage.setItem('vs_history', JSON.stringify(history.slice(0, 10)));
  },

  /** Get all trips from history */
  getAll() {
    try {
      return JSON.parse(localStorage.getItem('vs_history')) || [];
    } catch {
      return [];
    }
  },

  /** Remove a trip from history */
  remove(tripCode) {
    const history = this.getAll().filter(h => h.code !== tripCode);
    localStorage.setItem('vs_history', JSON.stringify(history));
  }
};

const Session = {
  /** Save a member token for a trip and add to history */
  setMember(tripCode, token, tripName = '', memberName = '', colorIdx = 0) {
    sessionStorage.setItem('vs_token_' + tripCode, token);
    if (tripName && memberName) {
      History.add(tripCode, tripName, memberName, token, colorIdx);
    }
  },

  /** Get the stored token for a trip */
  getToken(tripCode) {
    let token = sessionStorage.getItem('vs_token_' + tripCode);
    if (!token) {
      // Try to recover from history if session is lost
      const history = History.getAll();
      const item = history.find(h => h.code === tripCode);
      if (item) {
        token = item.token;
        sessionStorage.setItem('vs_token_' + tripCode, token);
      }
    }
    return token;
  },

  /** Restore a token from history to session storage */
  restoreFromHistory(tripCode) {
    const history = History.getAll();
    const item = history.find(h => h.code === tripCode);
    if (item) {
      sessionStorage.setItem('vs_token_' + tripCode, item.token);
      return true;
    }
    return false;
  },

  /** Clear the current session for a trip (unused now, keep for safety) */
  clearSession(tripCode) {
    sessionStorage.removeItem('vs_token_' + tripCode);
  },

  /** Get the current member's data from the API using their stored token */
  async getMember(tripCode) {
    const token = this.getToken(tripCode);
    if (!token) return null;
    try {
      const me = await API.getMemberByToken(token);
      return me;
    } catch {
      return null;
    }
  }
};
