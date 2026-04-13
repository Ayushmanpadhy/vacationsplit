/**
 * VacationSplit — App Router & Bootstrap
 * Hash-based SPA routing
 */

const Router = {
  routes: {},

  /** Register a route pattern with a handler */
  register(path, handler) {
    this.routes[path] = handler;
  },

  /** Navigate to a new route */
  navigate(path) {
    window.location.hash = path;
  },

  /** Get the current route path */
  current() {
    return window.location.hash.slice(1) || '/';
  },

  /** Initialize the router and listen for hash changes */
  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  /** Match the current hash to a registered route and call its handler */
  resolve() {
    const hash = this.current();

    for (const [pattern, handler] of Object.entries(this.routes)) {
      const params = matchRoute(pattern, hash);
      if (params !== null) {
        handler(params);
        return;
      }
    }

    // Fallback to home
    if (this.routes['/']) this.routes['/']({});
  }
};

/**
 * Match a route pattern (e.g. "/trip/:code/dashboard") against a path.
 * Returns an object of matched params, or null if no match.
 */
function matchRoute(pattern, path) {
  const pp = pattern.split('/');
  const hp = path.split('/');
  if (pp.length !== hp.length) return null;

  const params = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) {
      params[pp[i].slice(1)] = decodeURIComponent(hp[i]);
    } else if (pp[i] !== hp[i]) {
      return null;
    }
  }
  return params;
}

// ── Register All Routes ──────────────────────────────────

Router.register('/', () => renderHome());

Router.register('/trip/:code/dashboard', ({ code }) => renderDashboard(code));

Router.register('/trip/:code/add-expense', ({ code }) => renderAddExpense(code));

Router.register('/trip/:code/edit-expense/:id', ({ code, id }) => renderAddExpense(code, id));

Router.register('/trip/:code/balances', ({ code }) => renderBalances(code));

Router.register('/trip/:code/summary', ({ code }) => renderSummary(code));

// ── Boot ─────────────────────────────────────────────────
Router.init();
