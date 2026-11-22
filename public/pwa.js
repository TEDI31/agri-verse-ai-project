/* AgriVerse AI — offline mode helpers: registers the service worker,
   shows an offline banner and an "Install app" button. */
(function () {
  // ---- offline banner ----
  const css = document.createElement('style');
  css.textContent = `
  #offlineBar{position:fixed;left:0;right:0;top:0;z-index:9999;padding:.45rem 1rem;text-align:center;font-size:.85rem;
    background:#c8503b;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.35);transform:translateY(-110%);transition:transform .25s}
  #offlineBar.show{transform:none}
  #offlineBar.back{background:#2e7d46}
  #installBtn{position:fixed;right:14px;bottom:14px;z-index:9998;padding:.6rem 1rem;border:0;border-radius:999px;cursor:pointer;
    background:#a7c957;color:#06140b;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.4)}
  #installBtn[hidden]{display:none}
  body.is-offline{padding-top:2rem}`;
  document.head.appendChild(css);

  const bar = document.createElement('div');
  bar.id = 'offlineBar'; bar.setAttribute('role', 'status'); bar.setAttribute('aria-live', 'polite');
  document.body.appendChild(bar);

  let hideTimer;
  function setOnline(isOnline, first) {
    clearTimeout(hideTimer);
    document.body.classList.toggle('is-offline', !isOnline);
    if (!isOnline) {
      bar.className = 'show';
      bar.textContent = 'You are offline — showing your saved data. Lessons, calendar and saved info still work.';
    } else if (!first) {
      bar.className = 'show back';
      bar.textContent = 'Back online.';
      hideTimer = setTimeout(() => { bar.className = ''; }, 2500);
    } else {
      bar.className = '';
    }
  }
  addEventListener('online', () => { setOnline(true); if (typeof refresh === 'function' && typeof token !== 'undefined' && token) refresh().catch(() => {}); });
  addEventListener('offline', () => setOnline(false));
  setOnline(navigator.onLine, true);

  // ---- install button ----
  const btn = document.createElement('button');
  btn.id = 'installBtn'; btn.hidden = true; btn.textContent = '⬇ Install app';
  document.body.appendChild(btn);
  let deferred;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; btn.hidden = false; });
  btn.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    deferred = null; btn.hidden = true;
  });
  addEventListener('appinstalled', () => { btn.hidden = true; });

  // ---- service worker ----
  if ('serviceWorker' in navigator) {
    addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => console.warn('Offline mode unavailable:', err));
    });
  }
})();
