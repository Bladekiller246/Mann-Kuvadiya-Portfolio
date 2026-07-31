/* ═══════════════════════════════════════════════════════════
   KVD-4400 — the journal

   What the guest segment did, kept for the operator to read. Sessions,
   applications and how long each was up, addresses typed into Internet
   Explorer, and every attempt on the admin door.

   ── where it goes ──────────────────────────────────────────
   localStorage on the visitor's own machine, and nowhere else. There is
   no server on the other end of this site to send it to, and nothing
   here opens a socket. It survives a reload — which is the point, since
   an operator arriving after the fact should find something waiting —
   and dies with the browser's own site data. CLEAR on the WATCH panel
   erases it outright.

   Kept deliberately dumb: a flat array of events, capped, aggregated
   only at read time. Anything cleverer would need migrating the day the
   shape changes, and this is a portfolio easter egg.
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const KEY = 'kvd-journal';
  const CAP = 500;              // oldest fall off the front

  let log = [];
  try { log = JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { log = []; }
  if (!Array.isArray(log)) log = [];

  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(log)); } catch (_) { /* full or private */ }
  };

  function mark(kind, label, extra) {
    log.push(Object.assign({ t: Date.now(), kind, label: String(label ?? '') }, extra || {}));
    if (log.length > CAP) log = log.slice(-CAP);
    save();
  }

  /* ── durations ──────────────────────────────────────────
     enter/leave pair up by id. A window closed by shutdown never gets
     its leave, so sweep() is called at session end to close the books
     on anything still open — otherwise a session that ended by power
     switch would report every window as zero seconds. */
  const running = new Map();

  function enter(id, label) {
    if (running.has(id)) return;          // reopening an open window is not a new visit
    running.set(id, Date.now());
    mark('open', label, { id });
  }

  function leave(id, label) {
    const t0 = running.get(id);
    if (t0 == null) return;
    running.delete(id);
    mark('shut', label, { id, ms: Date.now() - t0 });
  }

  function sweep() {
    [...running.keys()].forEach(id => leave(id, id));
  }

  /* ── sessions ─────────────────────────────────────────── */

  let sessionAt = null;

  function sessionStart(kind) {
    if (sessionAt) return;
    sessionAt = Date.now();
    mark('in', kind || 'guest');
  }

  function sessionEnd() {
    if (!sessionAt) return;
    sweep();
    mark('out', 'guest', { ms: Date.now() - sessionAt });
    sessionAt = null;
  }

  // a visitor who closes the tab never fires sessionEnd, so take the
  // last chance the browser reliably gives
  addEventListener('pagehide', () => { if (sessionAt) sessionEnd(); });

  /* ── read side ──────────────────────────────────────────
     Aggregated fresh on every call. The log is a few hundred entries at
     most, so there is nothing here worth caching and a stale panel
     would be worse than a slow one. */
  function summary() {
    const apps = new Map();
    const seen = [];
    let visits = 0, totalMs = 0, lastMs = 0;
    let denied = 0, granted = 0, lastTry = null;

    log.forEach(e => {
      switch (e.kind) {
        case 'in':
          visits++;
          break;
        case 'out':
          totalMs += e.ms || 0;
          lastMs = e.ms || 0;
          break;
        case 'shut': {
          const a = apps.get(e.label) || { label: e.label, count: 0, ms: 0 };
          a.count++; a.ms += e.ms || 0;
          apps.set(e.label, a);
          break;
        }
        case 'open': {
          const a = apps.get(e.label) || { label: e.label, count: 0, ms: 0 };
          if (!a.count) apps.set(e.label, a);   // opened, never closed
          break;
        }
        case 'seek':
          seen.push({ label: e.label, t: e.t, local: !!e.local });
          break;
        case 'deny':
          denied++; lastTry = e.t;
          break;
        case 'grant':
          granted++; lastTry = e.t;
          break;
      }
    });

    return {
      visits, totalMs, lastMs,
      live: sessionAt ? Date.now() - sessionAt : 0,
      apps: [...apps.values()].sort((a, b) => b.ms - a.ms),
      seen: seen.slice(-40).reverse(),
      admin: { denied, granted, attempts: denied + granted, lastTry },
      events: log.length,
    };
  }

  function clear() {
    log = [];
    running.clear();
    sessionAt = null;
    try { localStorage.removeItem(KEY); } catch (_) {}
  }

  window.JOURNAL = {
    mark, enter, leave, sweep,
    sessionStart, sessionEnd,
    summary, clear,
    seek: (url, local) => mark('seek', url, { local: !!local }),
    deny: () => mark('deny', 'admin'),
    grant: () => mark('grant', 'admin'),
  };
})();
