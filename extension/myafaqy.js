// AFAQY Jeddah portal — sync (ADR-0062). Runs on myafaqy.com: when a pull is due it asks the page's pull (pull.js) to run with the
// recipe the portal left here, and keeps the result in this browser for the portal. It sends no code and reads nothing it stores elsewhere.
(() => {
  const S = chrome.storage.local, DAY = 'T00:00:00Z';
  const ok = (R) => R && R.DEL === 'ext' && R.PORTAL === '' && /^\d{4}-\d{2}-\d{2}$/.test(R.FROM) && /^\d{4}-\d{2}-\d{2}$/.test(R.TO) && R.FROM <= R.TO
    && /^[0-9A-Za-z_-]{1,12}$/.test(String(R.BR)) && Array.isArray(R.MMS) && R.MMS.length <= 24 && Array.isArray(R.M) && R.M.length <= 12 && typeof R.PACKET === 'string';
  const today = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
  const born = Date.now(); let started = false;
  const attempt = async () => {
    if (started) return;
    const st = await S.get(['recipe', 'lastAt', 'want', 'runningAt']);
    const R = st.recipe;
    if (!R) return;                                                     // the portal has not been opened with the extension yet
    if (!ok(R)) { await S.set({ status: 'bad-recipe', want: false }); return; }
    if (today() > R.TO) { await S.set({ status: 'needs-portal' }); return; }   // a new month: opening the portal once renews the recipe
    if (!localStorage.getItem('token')) return;                         // not signed in to myafaqy
    const due = !!st.want || !st.lastAt || Date.now() - st.lastAt > 12 * 3600e3;
    if (!due || (st.runningAt && Date.now() - st.runningAt < 10 * 60e3)) return;
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
  chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch.want && ch.want.newValue && Date.now() - born < 20000) attempt(); });
})();
