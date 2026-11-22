// Credit & Insurance (investor) dashboard.
// This file loads AFTER script.js and adds to it, so script.js does not need to change.
DB.offers = DB.offers || [];
NAV.investor = [['inv', 'Credit Requests'], ['claims', 'Insurance & Claims'], ['offers', 'My Offers']];

Object.assign(V, {
  /* --- farmer: credit and insurance (now uses real investor offers) --- */
  credit() {
    const INS = [
      { n: 'Drought cover', p: '3% of crop value', d: 'Pays out if rainfall is far below normal.' },
      { n: 'Pest & disease cover', p: '4% of crop value', d: 'Covers losses from confirmed outbreaks.' },
      { n: 'Full harvest cover', p: '6% of crop value', d: 'Drought, flood, fire and pests.' }
    ];
    const mine = ls('apps', []).slice().sort((x, y) => y.id - x.id);
    out(`<h2>Credit & insurance</h2><h3>Investors offering credit</h3><div class="grid">${ls('offers', []).map(v => `
      <div class="card"><h3>${esc(v.name)}</h3><p>Up to <span class="price">${money(v.max)}</span></p><p class="note">Interest ${esc(v.rate)} · ${esc(v.term)}</p>
      <input id="am${v.id}" type="number" min="1000" max="${v.max}" placeholder="Amount (ETB)">
      <input id="pu${v.id}" placeholder="What is it for?">
      <button onclick="applyCredit(${v.id})">Apply</button></div>`).join('')}</div>
      <h3>Crop insurance</h3><div class="grid">${INS.map(v => `
      <div class="card"><h3>${v.n}</h3><p>${v.d}</p><p class="tag">${v.p}</p><br><br><button onclick="enroll('${v.n}','${v.p}')">Enroll</button></div>`).join('')}</div>
      <h3>My applications</h3>${mine.length ? `<div class="scroll"><table><tr><th>Type</th><th>Details</th><th>Date</th><th>Status</th></tr>${mine.map(a => `<tr><td>${a.type}</td><td>${esc(a.title)}<br><span class="note">${esc(a.detail)}${a.claim ? '<br>Claim: ' + esc(a.claim.reason) : ''}${a.note ? '<br>Reply: ' + esc(a.note) : ''}</span></td><td>${a.date}</td><td><span class="tag">${esc(a.status)}</span>${a.type === 'Insurance' && !a.claim ? `<br><button class="small" onclick="fileClaim(${a.id})">File claim</button>` : ''}</td></tr>`).join('')}</table></div>` : '<p class="note">Nothing yet. Apply for credit or enroll in insurance above.</p>'}`);
  },

  /* --- investor: credit requests --- */
  inv() {
    const all = ls('apps', []).filter(a => a.type === 'Credit').sort((x, y) => (x.status === 'Pending' ? 0 : 1) - (y.status === 'Pending' ? 0 : 1) || y.id - x.id);
    const by = s => all.filter(a => a.status === s);
    const funded = by('Approved').reduce((n, a) => n + (a.amount || 0), 0);
    out(`<h2>Credit requests</h2><div class="grid">
      <div class="card"><p class="note">Waiting for you</p><p class="price">${by('Pending').length}</p></div>
      <div class="card"><p class="note">Approved</p><p class="price">${by('Approved').length}</p></div>
      <div class="card"><p class="note">Total approved</p><p class="price">${money(funded)}</p></div></div>
      <h3>All requests</h3>${all.length ? `<div class="scroll"><table><tr><th>Farmer</th><th>Offer</th><th>Request</th><th>Date</th><th>Status</th></tr>${all.map(a => `<tr><td>${esc(a.farmerName)}</td><td>${esc(a.title)}</td><td>${esc(a.detail)}</td><td>${a.date}</td><td><span class="tag">${esc(a.status)}</span>${a.status === 'Pending' ? `<br><button class="small" onclick="decide(${a.id},'approve')">Approve</button> <button class="small danger" onclick="decide(${a.id},'reject')">Reject</button>` : a.note ? `<br><span class="note">${esc(a.note)}</span>` : ''}</td></tr>`).join('')}</table></div>` : '<p class="note">No requests yet. They appear here when farmers apply.</p>'}`);
  },

  /* --- investor: insurance policies and claims --- */
  claims() {
    const pol = ls('apps', []).filter(a => a.type === 'Insurance').sort((x, y) => (x.status === 'Claim pending' ? 0 : 1) - (y.status === 'Claim pending' ? 0 : 1) || y.id - x.id);
    out(`<h2>Insurance & claims</h2><div class="grid">
      <div class="card"><p class="note">Policies</p><p class="price">${pol.length}</p></div>
      <div class="card"><p class="note">Claims to review</p><p class="price">${pol.filter(a => a.status === 'Claim pending').length}</p></div></div>
      <h3>Policies</h3>${pol.length ? `<div class="scroll"><table><tr><th>Farmer</th><th>Plan</th><th>Enrolled</th><th>Status / claim</th></tr>${pol.map(a => `<tr><td>${esc(a.farmerName)}</td><td>${esc(a.title)}<br><span class="note">${esc(a.detail)}</span></td><td>${a.date}</td><td><span class="tag">${esc(a.status)}</span>${a.claim ? `<br><span class="note">${a.claim.date}: ${esc(a.claim.reason)}</span>` : ''}${a.status === 'Claim pending' ? `<br><button class="small" onclick="claimDecide(${a.id},'approve')">Approve claim</button> <button class="small danger" onclick="claimDecide(${a.id},'reject')">Reject</button>` : a.note ? `<br><span class="note">${esc(a.note)}</span>` : ''}</td></tr>`).join('')}</table></div>` : '<p class="note">No policies yet. They appear here when farmers enroll.</p>'}`);
  },

  /* --- investor: my credit offers --- */
  offers() {
    const o = ls('offers', []);
    out(`<h2>My credit offers</h2><div class="card"><h3>Post a new offer</h3>
      <input id="o1" placeholder="Offer name (e.g. Green Harvest Loan)">
      <input id="o2" type="number" min="1000" placeholder="Maximum amount (ETB)">
      <div class="row"><input id="o3" placeholder="Interest (e.g. 9%)"><input id="o4" placeholder="Term (e.g. 12 months)"></div><br>
      <button onclick="addOffer()">Publish offer</button></div>
      <h3>All offers farmers can see</h3><div class="grid">${o.map(v => `<div class="card"><h3>${esc(v.name)}</h3><p class="price">${money(v.max)}</p><p class="note">${esc(v.rate)} · ${esc(v.term)}</p>${v.username === me.username ? `<button class="danger small" onclick="delOffer(${v.id})">Remove</button>` : '<p class="note">Default AgriVerse offer</p>'}</div>`).join('')}</div>`);
  }
});

/* ===== actions ===== */
function applyCredit(id) {
  const a = Number($('#am' + id).value), p = $('#pu' + id).value.trim();
  if (!a || a < 1000 || !p) return alert('Enter an amount (1,000 ETB or more) and what it is for.');
  act(async () => { await api('apps', 'POST', { type: 'Credit', offerId: id, amount: a, purpose: p }); await refresh(); V.credit(); });
}
function fileClaim(id) {
  const r = prompt('Describe what happened (for example: drought destroyed half of my teff).');
  if (!r) return;
  act(async () => { await api('apps/' + id + '/claim', 'POST', { reason: r }); await refresh(); V.credit(); });
}
function decide(id, d) {
  const n = prompt('Add a short note for the farmer (optional):');
  if (n === null) return;
  act(async () => { await api('apps/' + id + '/decide', 'POST', { decision: d, note: n }); await refresh(); V.inv(); });
}
function claimDecide(id, d) {
  const n = prompt('Add a short note for the farmer (optional):');
  if (n === null) return;
  act(async () => { await api('apps/' + id + '/claim-decide', 'POST', { decision: d, note: n }); await refresh(); V.claims(); });
}
function addOffer() {
  const name = $('#o1').value.trim(), max = Number($('#o2').value);
  if (!name || max < 1000) return alert('Enter a name and a maximum amount of at least 1,000 ETB.');
  act(async () => { await api('offers', 'POST', { name, max, rate: $('#o3').value, term: $('#o4').value }); await refresh(); V.offers(); });
}
function delOffer(id) { act(async () => { await api('offers/' + id, 'DELETE'); await refresh(); V.offers(); }); }