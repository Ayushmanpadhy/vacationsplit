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

// ── Session Management ───────────────────────────────────
// Stores member tokens per trip code in sessionStorage
const Session = {
  /** Save a member token for a trip */
  setMember(tripCode, token) {
    sessionStorage.setItem('vs_token_' + tripCode, token);
  },

  /** Get the stored token for a trip */
  getToken(tripCode) {
    return sessionStorage.getItem('vs_token_' + tripCode);
  },

  /** Get the current member's data from the API using their stored token */
  async getMember(tripCode) {
    const token = this.getToken(tripCode);
    if (!token) return null;
    try {
      return await API.getMemberByToken(token);
    } catch {
      return null;
    }
  }
};
