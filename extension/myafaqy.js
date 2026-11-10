// AFAQY Jeddah portal — sync (ADR-0062). Runs on myafaqy.com: when a pull is due it asks the page's pull (pull.js) to run with the
// recipe the portal left here, and keeps the result in this browser for the portal. It sends no code and reads nothing it stores elsewhere.
(() => {
  const S = chrome.storage.local, DAY = 'T00:00:00Z';
  const ok = (R) => R && R.DEL === 'ext' && R.PORTAL === '' && /^\d{4}-\d{2}-\d{2}$/.test(R.FROM) && /^\d{4}-\d{2}-\d{2}$/.test(R.TO) && R.FROM <= R.TO
    && /^[0-9A-Za-z_-]{1,12}$/.test(String(R.BR)) && Array.isArray(R.MMS) && R.MMS.length <= 24 && Array.isArray(R.M) && R.M.length <= 12 && typeof R.PACKET === 'string';
  const today = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
  const born = Date.now(); let started = false, waiting = false;
  const attempt = async () => {
    if (started) return;
    const st = await S.get(['recipe', 'lastAt', 'want', 'runningAt']);
    const R = st.recipe;
    if (!R) return;                                                     // the portal has not been opened with the extension yet
    if (!ok(R)) { await S.set({ status: 'bad-recipe', want: false }); return; }
    if (today() > R.TO) { await S.set({ status: 'needs-portal' }); return; }   // a new month: opening the portal once renews the recipe
    const due = !!st.want || !st.lastAt || Date.now() - st.lastAt > 12 * 3600e3;
    if (!due) return;
    const jwtExp = (t) => { try { const p = JSON.parse(atob(String(t).split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return p && p.exp ? p.exp * 1000 : 0; } catch { return 0; } };
    const tokOk = (t) => !!t && (!jwtExp(t) || jwtExp(t) - Date.now() > 60000);   // 1.0.2: a key that has expired (it lives 8 h) is not a sign-in
    if (!tokOk(localStorage.getItem('token'))) {                        // not signed in, or the key is being renewed: say so, start by itself once it is valid (1.0.1, 1.0.2)
      await S.set({ status: 'needs-signin' });
      if (!waiting) { waiting = true; const t0 = Date.now(); const tick = setInterval(() => { if (tokOk(localStorage.getItem('token'))) { clearInterval(tick); waiting = false; attempt(); } else if (Date.now() - t0 > 5 * 60e3) { clearInterval(tick); waiting = false; S.set({ status: 'signin-timeout' }); } }, 2000); }
      return;
    }
    if (st.runningAt && Date.now() - st.runningAt < 10 * 60e3) { if (st.want) await S.set({ status: 'busy' }); return; }   // a pull already running: say so (1.0.1)
    if (started) return;
    started = true;
    const close = st.want === 'close';
    await S.set({ runningAt: Date.now(), status: 'pulling', error: '' });
    let sent = false;
    window.addEventListener('message', async (e) => {
      if (e.source !== window || e.origin !== location.origin || !e.data) return;
      if (e.data.type === 'afaqy-ext-pull-ready' && !sent) run();
      if (e.data.type === R.PACKET && e.data.ext === true && e.data.tasks && e.data.reports) {
        await S.set({ packet: { tasks: e.data.tasks, reports: e.data.reports }, packetAt: Date.now(), lastAt: Date.now(), runningAt: 0, want: false, status: 'ok' });
        if (close) setTimeout(() => window.close(), 2500);
      }
      if (e.data.type === 'afaqy-ext-failed') await S.set({ runningAt: 0, want: false, status: 'failed', error: String(e.data.message || '').slice(0, 200) });
    });
    function run() { sent = true; window.postMessage({ type: 'afaqy-ext-run', recipe: R }, location.origin); }
    if (document.documentElement.dataset.afaqyPull) run();
  };
  attempt();
  // «Update now» stores its request while this tab is opening; a request that lands in the tab's first 20 seconds still counts.
  chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch.want && ch.want.newValue && Date.now() - born < 5 * 60e3) attempt(); });
})();
