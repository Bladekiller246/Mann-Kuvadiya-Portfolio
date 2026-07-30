/* ═══════════════════════════════════════════════════════════
   KVD-4400 — live mission manifest

   Pulls the project list off the GitHub API so CH3 WORK and the
   Windows 98 Projects folder stop being two hand-maintained copies
   of the same thing.

   Opt-in, per repo. Only repos carrying the TOPIC below are listed,
   because "every public repo" is the wrong list for anybody who has
   ever pushed a class exercise. Tag a repo on GitHub — Settings ▸
   About ▸ Topics — and it appears here on the next load.

   Every failure path is the same: leave the authored markup alone.
   No network, rate limited, no matching repos, malformed JSON — the
   hand-written dossiers in index.html and the APPS entries in
   win98.js are the fallback, and they are already correct.
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  /* ── ✎ CONFIG ───────────────────────────────────────────── */

  const USER  = 'Bladekiller246';
  const TOPIC = 'portfolio';   // tag a repo with this to list it here
  const MAX   = 6;             // dossiers are long; more than this scrolls badly

  // The API allows 60 unauthenticated calls an hour per IP. One visitor
  // reloading a few times should not spend them, so answers are cached.
  const TTL = 30 * 60 * 1000;

  // A repo nobody has touched in this long reads as finished, not active.
  const DORMANT_DAYS = 365;

  /* ── PLUMBING ───────────────────────────────────────────── */

  const CACHE_KEY = 'kvd-gh-' + USER + '-' + TOPIC;
  const API = `https://api.github.com/users/${encodeURIComponent(USER)}/repos`
            + '?per_page=100&sort=pushed';

  const esc = t => String(t).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const note = document.querySelector('#ghNote');
  const list = document.querySelector('.dossiers');

  function say(text, live) {
    if (!note) return;
    note.hidden = false;
    note.innerHTML = text;
    note.classList.toggle('footnote--live', !!live);
  }

  /* ── FETCH, WITH A CACHE IN FRONT ───────────────────────── */

  function cached() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const box = JSON.parse(raw);
      if (Date.now() - box.t > TTL) return null;
      return box.repos;
    } catch (_) { return null; }
  }

  function store(repos) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), repos }));
    } catch (_) { /* private mode, quota — the page works without it */ }
  }

  async function load() {
    const hit = cached();
    if (hit) return hit;

    const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const all = await res.json();
    if (!Array.isArray(all)) throw new Error('unexpected payload');

    // Cache the trimmed shape, not the 100-field API objects — this goes
    // into a 5 MB localStorage budget shared with everything else.
    const repos = all
      .filter(r => !r.fork && !r.archived_placeholder)
      .map(r => ({
        name: r.name,
        desc: r.description || '',
        topics: r.topics || [],
        lang: r.language || '',
        url: r.html_url,
        home: r.homepage || '',
        archived: !!r.archived,
        pushed: r.pushed_at || '',
      }));

    store(repos);
    return repos;
  }

  /* ── PICK AND SHAPE ─────────────────────────────────────── */

  const dormantBefore = Date.now() - DORMANT_DAYS * 864e5;

  function state(r) {
    // Honest three-way, in priority order: a repo GitHub calls archived is
    // archived; one with a deployment is live; one nobody has touched in a
    // year is finished; anything else is still moving.
    if (r.archived) return ['ARCHIVE', 'is-arch'];
    if (r.home) return ['LIVE', 'is-live'];
    if (Date.parse(r.pushed) < dormantBefore) return ['ARCHIVE', 'is-arch'];
    return ['BUILD', 'is-build'];
  }

  function shape(r, i) {
    const [label, cls] = state(r);
    const tags = [r.lang, ...r.topics.filter(t => t !== TOPIC)]
      .filter(Boolean).slice(0, 4);

    return {
      desig: 'MSN‑' + String(i + 1).padStart(2, '0'),
      year: (r.pushed || '').slice(0, 4),
      // trailing dashes are a real thing people leave in repo names
      name: r.name.replace(/[-_]+$/, '').replace(/[-_]+/g, '-'),
      desc: r.desc || 'No description on the repo yet.',
      tags,
      url: r.home || r.url,
      label, cls,
    };
  }

  function pick(repos) {
    return repos
      .filter(r => r.topics.includes(TOPIC))
      .sort((a, b) => Date.parse(b.pushed) - Date.parse(a.pushed))
      .slice(0, MAX)
      .map(shape);
  }

  /* ── RENDER: CH3 WORK ───────────────────────────────────── */

  function render(items) {
    list.innerHTML = items.map(m => `
      <li class="dossier">
        <div class="dossier__id">
          <span class="dossier__desig">${m.desig}</span>
          <span class="dossier__year">${esc(m.year)}</span>
        </div>
        <div class="dossier__body">
          <h3 class="dossier__name">${esc(m.name)}</h3>
          <p class="dossier__desc">${esc(m.desc)}</p>
          <ul class="tags">${m.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          <a class="dossier__link" href="${esc(m.url)}" target="_blank" rel="noopener">
            OPEN CHANNEL <span aria-hidden="true">&rarr;</span></a>
        </div>
        <span class="dossier__state ${m.cls}">${m.label}</span>
      </li>`).join('');
  }

  /* ── GO ─────────────────────────────────────────────────── */

  if (!list) return;

  load().then(repos => {
    const items = pick(repos);

    if (!items.length) {
      // Not an error — it means nothing is tagged yet. Say which topic,
      // so the fix is one click on GitHub rather than a guess.
      say(`Manifest is hand-written. Tag a repo <b>${esc(TOPIC)}</b> on
           github.com/${esc(USER)} and it lists itself here.`);
      return;
    }

    render(items);
    document.dispatchEvent(new CustomEvent('kvd:projects', { detail: items }));
    say(`${items.length} mission${items.length > 1 ? 's' : ''} read live from
         <b>github.com/${esc(USER)}</b>.`, true);
  }).catch(err => {
    // The authored list is still on screen; this only explains why it is.
    say(`Live manifest unavailable (${esc(err.message)}) — showing the
         hand-written list.`);
  });
})();
