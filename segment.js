/* ═══════════════════════════════════════════════════════════
   KVD-4400 — segment configuration

   What the operator decides the guest gets. Written from the SEGMENT
   panel in overdrive.js, read by win98.js as the guest desktop is
   built. Same storage bargain as journal.js: localStorage on this
   machine, never transmitted, gone with the browser's site data.

   Kept in its own file rather than inside either shell because both
   need it and neither should own it.
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const KEY = 'kvd-segment';

  const BLANK = {
    hide: [],          // app ids kept off the guest desktop
    arcade: true,      // false seals the games
    note: '',          // left for the next guest to find
  };

  let state = null;

  function get() {
    if (state) return state;
    try {
      state = Object.assign({}, BLANK, JSON.parse(localStorage.getItem(KEY)) || {});
    } catch (_) {
      state = Object.assign({}, BLANK);
    }
    if (!Array.isArray(state.hide)) state.hide = [];
    return state;
  }

  function set(patch) {
    state = Object.assign(get(), patch || {});
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
    return state;
  }

  function toggleHidden(id) {
    const s = get();
    const i = s.hide.indexOf(id);
    if (i < 0) s.hide.push(id); else s.hide.splice(i, 1);
    return set({ hide: s.hide });
  }

  function reset() {
    state = Object.assign({}, BLANK, { hide: [] });
    try { localStorage.removeItem(KEY); } catch (_) {}
    return state;
  }

  window.SEGMENT = {
    get, set, reset, toggleHidden,
    isHidden: id => get().hide.includes(id),
    arcadeOpen: () => get().arcade !== false,
    note: () => get().note || '',
  };
})();
