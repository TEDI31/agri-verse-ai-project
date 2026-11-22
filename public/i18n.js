// Language switch: English / አማርኛ (Amharic) / ትግርኛ (Tigrinya).
// Loads LAST (after lang-am.js, lang-ti.js and lang-ti-content.js). It contains no translations itself.
(function () {
  const LANGS = window.LANGS || {};
  const LIST = [['en', 'English'], ['am', 'አማርኛ'], ['ti', 'ትግርኛ'], ['om', 'Oromoo']].filter(l => l[0] === 'en' || LANGS[l[0]]);
  let lang = localStorage.getItem('lang');
  if (!LANGS[lang]) lang = 'en';
  const pack = () => LANGS[lang];

  /* ---- 1. translate one piece of text ---- */
  function tr(s) {
    const p = pack();
    if (!p) return null;
    const k = s.trim();
    if (!k) return null;
    if (Object.prototype.hasOwnProperty.call(p.ui, k)) return s.replace(k, () => p.ui[k]);
    if (!p._rules) p._rules = p.rules(x => tr(x) || x);
    for (const [re, fn] of p._rules) { const m = k.match(re); if (m) return s.replace(k, () => fn(m)); }
    if (/\bETB\b/.test(k)) return s.replace(k, () => k.replace(/\bETB\b/g, p.birr));
    return null;
  }

  /* ---- 2. translate the page and keep it translated ---- */
  const seen = new WeakMap();
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CANVAS', 'CODE']);
  function text(n) {
    const par = n.parentNode;
    if (!par || SKIP.has(par.tagName) || (par.closest && par.closest('.msg.user'))) return;
    const rec = seen.get(n);
    let cur = n.nodeValue;
    if (rec && cur === rec.out) {
      if (rec.lang === lang) return;
      cur = rec.en; n.nodeValue = cur; seen.delete(n);      // language changed: go back to English first
    } else if (rec) seen.delete(n);
    if (!pack()) return;
    const out = tr(cur);
    if (out && out !== cur) {
      if (par.tagName === 'OPTION' && !par.hasAttribute('value')) par.setAttribute('value', cur.trim()); // keep the English value
      seen.set(n, { en: cur, out, lang });
      n.nodeValue = out;
    }
  }
  function attrs(el) {
    for (const a of ['placeholder', 'title']) {
      if (!el.hasAttribute || !el.hasAttribute(a)) continue;
      const key = '_i18n_' + a, rec = el[key];
      let cur = el.getAttribute(a);
      if (rec && cur === rec.out) {
        if (rec.lang === lang) continue;
        cur = rec.en; el.setAttribute(a, cur); el[key] = null;
      } else if (rec) el[key] = null;
      if (!pack()) continue;
      const out = tr(cur);
      if (out && out !== cur) { el[key] = { en: cur, out, lang }; el.setAttribute(a, out); }
    }
  }
  function walk(node) {
    if (node.nodeType === 3) return text(node);
    if (node.nodeType !== 1 || SKIP.has(node.tagName)) return;
    attrs(node);
    node.childNodes.forEach(walk);
  }
  new MutationObserver(ms => ms.forEach(m => {
    if (m.type === 'characterData') text(m.target);
    else m.addedNodes.forEach(walk);
  })).observe(document.body, { childList: true, subtree: true, characterData: true });

  /* ---- 3. translate the data (lessons, AI answers, disease advice) ---- */
  function setupData() {
    const codes = Object.keys(LANGS);
    if (typeof KB !== 'undefined') {
      KB.forEach(e => { e.en = e.a; e.t = {}; });
      codes.forEach(c => {
        const src = LANGS[c].kb || {};
        Object.keys(src).forEach(key => {
          const e = KB.find(x => x.k[0] === key);
          if (e) { e.t[c] = src[key].a; src[key].k.forEach(w => e.k.push(w)); }
        });
      });
    }
    if (typeof DIS !== 'undefined') {
      DIS.forEach(d => { d.en = { name: d.name, fix: d.fix }; d.t = {}; });
      codes.forEach(c => {
        const src = LANGS[c].dis || {};
        Object.keys(src).forEach(name => DIS.filter(d => d.name === name).forEach(d => {
          d.t[c] = src[name]; src[name].sym.forEach(w => d.sym.push(w));
        }));
      });
    }
    if (typeof LESSONS !== 'undefined') {
      LESSONS.forEach(l => { l.en = { t: l.t, intro: l.intro, pts: l.pts, tip: l.tip, cap: l.cap, q: l.q, o: l.o }; });
    }
  }
  function applyData() {
    const p = pack();
    if (typeof KB !== 'undefined') KB.forEach(e => { e.a = p ? (e.t[lang] || e.en + '\n\n' + p.note.trim()) : e.en; });
    if (typeof DIS !== 'undefined') DIS.forEach(d => {
      const t = p && d.t[lang];
      d.name = t ? t.name : d.en.name;
      d.fix = t ? t.fix : (p ? d.en.fix + p.note : d.en.fix);
    });
    if (typeof LESSONS !== 'undefined') LESSONS.forEach((l, i) => Object.assign(l, p && p.lessons && p.lessons[i] ? p.lessons[i] : l.en));
  }

  /* ---- 4. chat matching that also understands Amharic and Tigrinya words ---- */
  const FALLBACK = 'I do not have a good answer for that yet. Try naming the crop or topic (for example "teff fertilizer", "tomato pests" or "grain storage"), or ask your local agriculture extension officer.';
  const hit = (t, w) => /^[\x20-\x7e]+$/.test(w) ? new RegExp('\\b' + w + 's?\\b').test(t) : t.includes(w);
  window.ask = function () {
    const q = $('#q').value.trim();
    if (!q) return;
    const t = q.toLowerCase();
    let best = null, top = 0;
    KB.forEach(e => { const s = e.k.reduce((n, w) => n + (hit(t, w) ? (w.length > 3 ? 2 : 1) : 0), 0); if (s > top) { top = s; best = e; } });
    chat.push(['user', q], ['bot', best ? best.a : FALLBACK]);
    $('#q').value = '';
    drawChat();
  };

  /* ---- 5. pop-up messages ---- */
  const nativeAlert = window.alert.bind(window), nativePrompt = window.prompt.bind(window);
  window.alert = m => nativeAlert(pack() ? (tr(String(m)) || m) : m);
  const nativeConfirm = window.confirm.bind(window);
  window.confirm = m => nativeConfirm(pack() ? (tr(String(m)) || m) : m);
  window.prompt = (m, d) => nativePrompt(pack() ? (tr(String(m)) || m) : m, d);

  /* ---- 6. language buttons and fonts ---- */
  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&family=Noto+Serif+Ethiopic:wght@600;700&display=swap';
  document.head.appendChild(font);
  const css = document.createElement('style');
  css.textContent = `
    html[lang="am"] body,html[lang="am"] input,html[lang="am"] select,html[lang="am"] textarea,html[lang="am"] button,
    html[lang="ti"] body,html[lang="ti"] input,html[lang="ti"] select,html[lang="ti"] textarea,html[lang="ti"] button{font-family:"Noto Sans Ethiopic","Nirmala UI","Abyssinica SIL",sans-serif}
    html[lang="am"] h1,html[lang="am"] h2,html[lang="am"] h3,html[lang="ti"] h1,html[lang="ti"] h2,html[lang="ti"] h3{font-family:"Noto Serif Ethiopic","Noto Sans Ethiopic","Nirmala UI",serif;line-height:1.35;letter-spacing:0}
    html[lang="am"] body,html[lang="ti"] body{line-height:1.8}
    .lang-btn{position:fixed;top:14px;right:14px;z-index:60;display:flex;gap:2px;padding:4px;border-radius:30px;background:rgba(6,20,11,.72);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(167,201,87,.3)}
    .lang-btn button{background:transparent;box-shadow:none;padding:.35rem .85rem;border-radius:30px;color:#9db39f;font-size:.85rem}
    .lang-btn button::after{display:none}
    .lang-btn button:hover{transform:none;box-shadow:none;color:#fff}
    .lang-btn button.on{background:linear-gradient(135deg,#3f9b57,#2e7d46);color:#fff}
    .ls-index{top:58px!important}`;
  document.head.appendChild(css);

  const box = document.createElement('div');
  box.className = 'lang-btn';
  box.innerHTML = LIST.map(l => '<button data-l="' + l[0] + '">' + l[1] + '</button>').join('');
  document.body.appendChild(box);
  box.onclick = e => { const l = e.target.dataset && e.target.dataset.l; if (l) setLang(l); };

  function setLang(l) {
    if (l !== 'en' && !LANGS[l]) return;
    lang = l;
    localStorage.setItem('lang', l);
    document.documentElement.lang = l;
    box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.l === l));
    try { applyData(); } catch (e) { console.error('Language data problem:', e); }
    walk(document.body);
    if (typeof chat !== 'undefined') chat.length = 0;
    const app = document.getElementById('app');
    if (app && !app.hidden && typeof curView === 'string' && curView && typeof go === 'function') go(curView);
  }

  try { setupData(); } catch (e) { console.error('Language setup problem:', e); }
  window.I18N = { tr, setLang };
  setLang(lang);
  console.log('AgriVerse languages ready:', LIST.map(l => l[1]).join(', '));
})();
