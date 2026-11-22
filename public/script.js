/* ===== helpers ===== */
const $ = s => document.querySelector(s);
const DB = { users: [], products: [], orders: [], apps: [], extraDis: [] };
const ls = (k, d) => DB[k] ?? d;
let token = localStorage.getItem('token') || '';
async function api(path, method = 'GET', body) {
  let r;
  try {
    r = await fetch('/api/' + path, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: body ? JSON.stringify(body) : undefined });
  } catch {
    const e = new Error(navigator.onLine === false
      ? 'You are offline. This needs an internet connection — please try again when you are back online.'
      : 'Cannot reach the server. Start it with: node server.js');
    e.offline = true; throw e;
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'Server error'); e.offline = !!j.offline; e.status = r.status; throw e; }
  return j;
}
async function refresh() { const s = await api('state'); Object.assign(DB, s); me = s.user; if (typeof calBadge === 'function') calBadge(); }
const act = async fn => { try { await fn(); } catch (e) { alert(e.message); } };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const out = h => { $('#view').innerHTML = h; };
const money = n => Number(n).toLocaleString() + ' ETB';
/* ===== built-in datasets ===== */
// Farming knowledge base: k = keywords to match, a = answer
const KB = [
  { k: ['teff'], a: 'Teff: sow June–July with the main rains on fine, level soil (about 5–10 kg seed per hectare, broadcast). Weed 3–4 weeks after sowing and again before flowering. On poor soil use about 100 kg DAP + 50 kg urea per hectare. Harvest in 3–4 months, when stalks turn yellow.' },
  { k: ['maize', 'corn'], a: 'Maize: plant at the start of the rains, 75 cm between rows and 25 cm between plants, 2 seeds per hole. Apply DAP at planting and urea when plants are knee-high. Weed twice. Harvest when husks are dry and brown (4–5 months).' },
  { k: ['wheat'], a: 'Wheat: sow in July in the highlands (or Nov–Dec with irrigation), 125–150 kg seed per hectare in rows. Use DAP at sowing and urea at tillering. Watch for rust (orange powder on leaves) and spray a fungicide early.' },
  { k: ['barley'], a: 'Barley: sow June–July in cool highlands, about 100–125 kg seed per hectare. It matures in 3–4 months and tolerates poorer soil than wheat. Rotate with pulses to keep soil healthy.' },
  { k: ['coffee'], a: 'Coffee: plant seedlings under light shade at 2 m x 2 m spacing at the start of the rains. Mulch, prune old branches yearly, and pick only ripe red cherries. Dry cherries on raised beds, turning often, to keep quality high.' },
  { k: ['tomato'], a: 'Tomato: raise seedlings 4–5 weeks, transplant 50 cm x 80 cm apart and stake the plants. Water regularly at the base (not on leaves) to avoid blight. Remove side shoots and feed with compost or NPK every 2–3 weeks.' },
  { k: ['onion'], a: 'Onion: sow in a nursery, transplant after 6–8 weeks at 10 cm x 30 cm. Needs light, regular watering and stops watering 2 weeks before harvest. Cure bulbs in shade for a week before storage.' },
  { k: ['potato'], a: 'Potato: plant healthy seed tubers 5–10 cm deep, 30 cm apart, in rows 75 cm apart. Ridge soil around plants at 3–4 weeks. Avoid planting in the same field two years in a row to prevent late blight and wilt.' },
  { k: ['bean', 'pulse', 'lentil', 'chickpea', 'faba'], a: 'Pulses (beans, lentils, chickpea, faba) fix nitrogen in the soil, so they need little fertilizer except a small amount of phosphorus. Plant them after cereals in rotation. Keep fields weed-free early and watch for aphids and rust.' },
  { k: ['soil', 'ph', 'acid'], a: 'Healthy soil: dark, crumbly and full of organic matter. Most crops like pH 6–7. For acidic soil add lime or wood ash; for poor soil add compost or manure. A soil test at your nearest agriculture office tells you exactly what to add.' },
  { k: ['fertilizer', 'fertiliser', 'dap', 'urea', 'npk'], a: 'DAP gives phosphorus and some nitrogen (use at planting). Urea gives nitrogen (use 3–5 weeks after planting). Always place fertilizer near, not touching, the roots, and apply when the soil is moist. Mix with compost to get more from every bag.' },
  { k: ['compost', 'manure', 'organic'], a: 'Compost: layer dry plant waste, green waste and animal manure in a pit, keep it damp, and turn it every 2–3 weeks. It is ready in 2–3 months when dark and earthy-smelling. Spread 2–5 tonnes per hectare before planting.' },
  { k: ['irrigation', 'water', 'drip', 'drought', 'dry'], a: 'Water early morning or evening. Drip irrigation saves 30–50% water compared with flooding. Mulch with straw to keep soil moist. In dry spells, prioritize watering at flowering and grain filling, when crops need water most.' },
  { k: ['pest', 'insect', 'worm', 'armyworm', 'aphid', 'locust'], a: 'Scout your field every week. For fall armyworm, check for holes in leaves and sawdust-like droppings in the maize whorl; apply neem extract or a registered pesticide early in the morning. Encourage natural enemies (ladybirds, birds) and rotate crops.' },
  { k: ['weed', 'weeding'], a: 'Weeds steal water and nutrients most in the first 6 weeks. Weed at 2–3 weeks and again at 5–6 weeks, or mulch to suppress them. Pull weeds before they seed.' },
  { k: ['seed', 'variety', 'certified'], a: 'Use certified, disease-free seed from a trusted supplier. Choose varieties suited to your altitude and rainfall. Test germination first: plant 20 seeds in damp cloth; 17 or more sprouting means good seed.' },
  { k: ['storage', 'store', 'weevil', 'post harvest', 'postharvest'], a: 'Dry grain to about 12–13% moisture (a grain bites hard, not dented) before storage. Use clean airtight bags (PICS bags) or sealed metal silos, store off the ground, and check monthly for weevils.' },
  { k: ['rotation', 'rotate', 'intercrop'], a: 'Rotate cereals with pulses every season: cereals use lots of nitrogen and pulses put it back. Rotation also breaks pest and disease cycles. Intercropping maize with beans is a simple way to get both.' },
  { k: ['season', 'when to plant', 'rain', 'kiremt', 'belg', 'meher'], a: 'Ethiopia has two main rainy seasons: Belg (short rains, Feb–May) and Kiremt/Meher (main rains, June–September). Plant long-season crops at the start of the rains and short-season crops (like beans) during Belg. Check your local forecast before planting.' },
  { k: ['cow', 'cattle', 'dairy', 'milk'], a: 'Dairy cows need clean water all day, good forage (Napier grass, alfalfa) plus a concentrate, and vaccination against common diseases. Clean the udder before milking and keep milk cool. Keep records of yield for each cow.' },
  { k: ['chicken', 'poultry', 'egg'], a: 'Chickens: give 4–5 birds per square metre indoors, clean water and a layer feed. Vaccinate against Newcastle disease and keep new birds separate for 2 weeks. Collect eggs daily and keep the house dry.' },
  { k: ['sell', 'price', 'market', 'profit'], a: 'To earn more: grade and clean produce, sell in groups or cooperatives, store until prices rise, and list your products on the AgriVerse Market tab with a clear price so buyers can contact you directly.' },
  { k: ['loan', 'credit', 'insurance', 'invest'], a: 'Open the Credit & Insurance tab to apply to investors for a loan and to enroll in crop insurance. Keep records of your farm size and expected harvest — investors like clear numbers.' },
  { k: ['climate', 'climate change', 'heat'], a: 'To cope with changing weather: use drought-tolerant varieties, mulch, plant on contour lines to hold water, diversify crops, and consider crop insurance for bad seasons.' },
  { k: ['hello', 'hi', 'hey'], a: 'Hello! Ask me about any crop (teff, maize, wheat, coffee, tomato…), soil, fertilizer, water, pests, storage, livestock or selling.' }
];

// Disease dataset: sym = symptom keywords matched against the farmer's description
const DIS = [
  { crop: 'Wheat', name: 'Wheat rust', sym: ['orange', 'rust', 'reddish', 'powder', 'pustule'], fix: 'Spray a registered fungicide (e.g. propiconazole) at first signs. Plant resistant varieties and destroy volunteer wheat plants.' },
  { crop: 'Wheat', name: 'Septoria leaf blotch', sym: ['brown', 'blotch', 'lesion', 'yellow', 'streak'], fix: 'Rotate crops, bury crop residue, and use fungicide at flag-leaf stage if wet weather continues.' },
  { crop: 'Maize', name: 'Fall armyworm', sym: ['holes', 'chewed', 'sawdust', 'droppings', 'whorl', 'worm'], fix: 'Scout weekly. Apply neem extract or a registered insecticide into the whorl early morning. Plant early and intercrop with beans.' },
  { crop: 'Maize', name: 'Maize lethal necrosis', sym: ['yellow', 'mottled', 'dry', 'dead heart', 'stunted'], fix: 'Remove and burn infected plants. Use certified clean seed, control insects, and avoid planting maize after maize.' },
  { crop: 'Maize', name: 'Gray leaf spot', sym: ['gray', 'grey', 'rectangular', 'spots', 'lesion'], fix: 'Rotate crops, plant resistant hybrids, and bury residue. Fungicide helps in severe seasons.' },
  { crop: 'Tomato', name: 'Late blight', sym: ['dark', 'water-soaked', 'black', 'blight', 'brown', 'white mold', 'rot'], fix: 'Remove infected leaves, avoid watering foliage, and spray copper or mancozeb fungicide. Use stakes for airflow.' },
  { crop: 'Tomato', name: 'Early blight', sym: ['rings', 'target', 'concentric', 'lower leaves', 'spots'], fix: 'Remove lower infected leaves, mulch to stop soil splash, rotate crops, and use copper fungicide.' },
  { crop: 'Tomato', name: 'Bacterial wilt', sym: ['wilt', 'wilting', 'sudden', 'droop', 'collapse'], fix: 'Pull and burn infected plants. Do not plant tomato, potato or pepper in that soil for 3 years. Use resistant rootstock.' },
  { crop: 'Potato', name: 'Potato late blight', sym: ['dark', 'blight', 'black', 'water-soaked', 'rot', 'brown'], fix: 'Spray mancozeb or copper before the rains. Hill the soil well, remove infected plants and use clean seed tubers.' },
  { crop: 'Potato', name: 'Bacterial wilt', sym: ['wilt', 'wilting', 'ooze', 'slime', 'brown ring'], fix: 'Rotate with cereals for 3+ years, use clean seed, and remove infected plants. There is no chemical cure.' },
  { crop: 'Coffee', name: 'Coffee leaf rust', sym: ['orange', 'rust', 'powder', 'yellow', 'underside'], fix: 'Prune for airflow, shade lightly, and spray copper fungicide at the start of the rains.' },
  { crop: 'Coffee', name: 'Coffee berry disease', sym: ['berry', 'dark', 'sunken', 'cherry', 'black'], fix: 'Spray copper fungicide during flowering and berry growth. Remove and bury infected cherries.' },
  { crop: 'Teff', name: 'Teff rust', sym: ['rust', 'brown', 'powder', 'orange'], fix: 'Sow early, avoid very dense stands, and use resistant varieties. Rotate with pulses.' },
  { crop: 'Onion', name: 'Downy mildew', sym: ['gray', 'grey', 'purple', 'fuzzy', 'pale', 'mildew'], fix: 'Improve spacing and drainage, avoid overhead watering, and spray mancozeb or metalaxyl at first signs.' },
  { crop: 'Beans', name: 'Bean rust', sym: ['rust', 'brown', 'pustule', 'orange', 'powder'], fix: 'Rotate crops, remove crop residue and spray fungicide if severe. Plant resistant varieties.' },
  { crop: 'Any', name: 'Aphid infestation', sym: ['sticky', 'honeydew', 'curl', 'curled', 'tiny insects', 'aphid', 'ants'], fix: 'Spray with soapy water or neem extract. Encourage ladybirds. Remove heavily infested shoots.' },
  { crop: 'Any', name: 'Nutrient deficiency', sym: ['pale', 'yellow', 'purple', 'stunted', 'thin'], fix: 'Test your soil. Add compost, DAP (phosphorus) or urea (nitrogen) as needed, and water regularly.' }
];
const allDis = () => DIS.concat(ls('extraDis', []));

/* ===== authentication (stored in this browser's localStorage) ===== */
let mode = 'login', me = null, curView = '', chat = [], openContact = null, openRate = null, viewFarmer = null;

function toggleMode() {
  mode = mode === 'login' ? 'register' : 'login';
  const reg = mode === 'register';
  $('#name').hidden = !reg;
  $('#name').required = reg;
  $('#authTitle').textContent = reg ? 'Create account' : 'Log in';
  $('#authBtn').textContent = reg ? 'Create account' : 'Log in';
  $('#authSwitch').textContent = reg ? 'Already have an account? Log in' : 'New here? Create an account';
  $('#msg').textContent = '';
  const ar = $('#adminRole'); // the Admin choice is for logging in only: nobody can register as admin
  if (ar) {
    ar.hidden = reg;
    const first = document.querySelector('input[name=role][value=farmer]');
    if (reg && ar.querySelector('input').checked && first) first.checked = true;
  }
  return false;
}
// Adds an "Admin" choice to the login page
(() => {
  const box = document.querySelector('#authForm .roles');
  if (!box || box.querySelector('[value=admin]')) return;
  const l = document.createElement('label');
  l.id = 'adminRole';
  l.innerHTML = '<input type="radio" name="role" value="admin"><span>Admin</span>';
  box.appendChild(l);
})();

/* ===== dashboard shell ===== */
const NAV = {
  farmer: [['weather', 'Weather'], ['calendar', 'Planting Calendar'], ['map', 'Satellite Map'], ['chat', 'AI Assistant'], ['disease', 'Disease Check'], ['credit', 'Credit & Insurance'], ['market', 'My Market'], ['orders', 'Orders'], ['profile', 'Profile']],
  buyer: [['shop', 'Marketplace'], ['orders', 'My Orders']],
  scientist: [['data', 'Disease Datasets']]
};

function go(v) {
  curView = v; openContact = null; openRate = null; viewFarmer = null;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  try {
    if (!V[v]) throw new Error('This page is missing. Copy the newest script.js into the public folder, then press Ctrl + Shift + R.');
    V[v]();
  } catch (e) {
    out('<div class="card"><h3>Something went wrong</h3><p>' + esc(e.message) + '</p></div>');
  }
}

/* ===== views ===== */
const V = {
  /* --- weather --- */
  weather() {
    out(`<h2>Weather forecast</h2><div id="wx" class="card">Getting your location…</div>`);
    if (!navigator.geolocation) { $('#wx').innerHTML = 'Your browser does not support location. Try a different browser.'; return; }
    navigator.geolocation.getCurrentPosition(
      pos => loadWeather(pos.coords.latitude, pos.coords.longitude),
      () => { $('#wx').innerHTML = 'Location was blocked. Allow location access in your browser and reopen this tab.'; },
      { timeout: 10000 }
    );
  },

  /* --- farmer: satellite map --- */
  map() {
    out(`<h2>Satellite map</h2>
      <p class="note">Find your farm from above. Drag to pan, scroll to zoom.</p>
      <p class="note">Outline your field on the map. Click or tap each corner of your field, one by one. Drag a corner to move it.</p>
      <div class="farmbar">
        <button id="fdDraw">Draw my farm</button>
        <button id="fdUndo" class="ghost">Undo last point</button>
        <button id="fdClear" class="ghost">Clear</button>
        <button id="fdSave">Save to my profile</button>
      </div>
      <div class="farmread card">
        <div><span class="lbl">Farm size</span><div><span id="fdHa" class="big">—</span> <span>hectares</span></div></div>
        <div><span class="lbl">Square metres</span><div><span id="fdM2">—</span> m²</div></div>
        <div id="fdState" class="state"></div>
      </div>
      <p id="fdMsg" class="note farmmsg" role="status"></p>
      <div id="mapbox" class="card" style="padding:0;overflow:hidden"><div id="leafmap" style="height:60vh;width:100%"></div></div>`);
    const f = me.farmShape;
    if (f && f.length >= 3) { // already outlined: open on the farm
      drawMap(f.reduce((a, p) => a + p[0], 0) / f.length, f.reduce((a, p) => a + p[1], 0) / f.length);
      return;
    }
    if (!navigator.geolocation) { drawMap(9.03, 38.74); return; } // fallback: Addis Ababa
    navigator.geolocation.getCurrentPosition(
      pos => drawMap(pos.coords.latitude, pos.coords.longitude),
      () => drawMap(9.03, 38.74), // fallback: Addis Ababa
      { timeout: 10000 }
    );
  },

  /* --- farmer: AI assistant --- */
  chat() {
    if (!chat.length) chat.push(['bot', 'Hello ' + me.name + '! Ask me anything about crops, soil, fertilizer, water, pests, storage, livestock or selling.']);
    out(`<h2>AgriVerse AI assistant</h2>
      <div id="log" class="log"></div>
      <div class="row"><input id="q" placeholder="e.g. How do I grow teff?" onkeydown="if(event.key==='Enter')ask()"><button onclick="ask()">Ask</button></div>
      <p class="note">Answers come from the built-in farming dataset (${KB.length} topics).</p>`);
    drawChat();
  },

  /* --- farmer: disease check --- */
  disease() {
    const crops = ['Any', ...new Set(allDis().map(d => d.crop).filter(c => c !== 'Any'))];
    out(`<h2>Plant disease check</h2>
      <div class="card">
        <label>Crop</label><select id="dc">${crops.map(c => `<option>${esc(c)}</option>`).join('')}</select>
        <label>What do you see on the plant?</label>
        <textarea id="ds" rows="3" placeholder="e.g. orange powder on leaves, yellow spots, wilting"></textarea>
        <label>Photo (optional, for your own reference)</label>
        <input type="file" accept="image/*" onchange="prev(this)"><img id="pv" alt="">
        <button onclick="detect()">Check disease</button>
      </div>
      <div id="dr"></div>
      <p class="note">Dataset: ${allDis().length} disease records (${ls('extraDis', []).length} added by data scientists).</p>`);
  },

  /* --- farmer: credit and insurance --- */
  credit() {
    const INV = [
      { n: 'GreenSeed Fund', max: 50000, r: '8%', t: '12 months' },
      { n: 'Highland Agri Investors', max: 150000, r: '10%', t: '18 months' },
      { n: 'Harvest Partners', max: 300000, r: '12%', t: '24 months' }
    ];
    const INS = [
      { n: 'Drought cover', p: '3% of crop value', d: 'Pays out if rainfall is far below normal.' },
      { n: 'Pest & disease cover', p: '4% of crop value', d: 'Covers losses from confirmed outbreaks.' },
      { n: 'Full harvest cover', p: '6% of crop value', d: 'Drought, flood, fire and pests.' }
    ];
    const mine = ls('apps', []).filter(a => a.username === me.username);
    out(`<h2>Credit & insurance</h2><h3>Investors offering credit</h3><div class="grid">${INV.map((v, i) => `
      <div class="card"><h3>${v.n}</h3><p>Up to <span class="price">${money(v.max)}</span></p><p class="note">Interest ${v.r} · ${v.t}</p>
      <input id="am${i}" type="number" min="1000" max="${v.max}" placeholder="Amount (ETB)">
      <input id="pu${i}" placeholder="What is it for?">
      <button onclick="applyCredit(${i},'${v.n}',${v.max})">Apply</button></div>`).join('')}</div>
      <h3>Crop insurance</h3><div class="grid">${INS.map(v => `
      <div class="card"><h3>${v.n}</h3><p>${v.d}</p><p class="tag">${v.p}</p><br><br><button onclick="enroll('${v.n}','${v.p}')">Enroll</button></div>`).join('')}</div>
      <h3>My applications</h3>${mine.length ? `<div class="scroll"><table><tr><th>Type</th><th>Details</th><th>Date</th><th>Status</th></tr>${mine.map(a => `<tr><td>${a.type}</td><td>${esc(a.title)}<br><span class="note">${esc(a.detail)}</span></td><td>${a.date}</td><td>${a.status}</td></tr>`).join('')}</table></div>` : '<p class="note">Nothing yet. Apply for credit or enroll in insurance above.</p>'}`);
    window._inv = INV;
  },

  /* --- farmer: market --- */
  market() {
    const prods = ls('products', []).filter(p => p.username === me.username);
    out(`<h2>My market</h2><div class="card"><h3>Upload a product</h3>
      <input id="pn" placeholder="Product (e.g. Red onions)">
      <div class="row"><input id="pq" type="number" min="1" placeholder="Quantity"><select id="pu" style="margin-bottom:0"><option>kg</option><option>quintal</option><option>crate</option><option>piece</option></select></div><br>
      <input id="pp" type="number" min="1" placeholder="Price per unit (ETB)">
      <input id="pl" value="${esc(me.location)}" placeholder="Pickup location">
      <button onclick="addProduct()">Put on market</button></div>
      <h3>My products</h3>${prods.length ? `<div class="grid">${prods.map(p => `<div class="card"><h3>${esc(p.name)}</h3><p class="price">${money(p.price)} / ${p.unit}</p><p>${p.qty} ${p.unit} left · ${esc(p.loc)}</p><button class="danger small" onclick="delProduct(${p.id})">Remove</button></div>`).join('')}</div>` : '<p class="note">No products yet.</p>'}`);
  },

  /* --- farmer: profile --- */
  profile() {
    out(`<h2>My profile</h2><div class="card">
      <label>Full name</label><input id="f1" value="${esc(me.name)}">
      <label>Farm name</label><input id="f2" value="${esc(me.farm)}">
      <label>Location</label><input id="f3" value="${esc(me.location)}">
      <label>Main crops</label><input id="f4" value="${esc(me.crops)}" placeholder="teff, maize, onion">
      <label>Farm size</label>
      <div class="farmsize">${me.farmArea ? `<b>${Number(me.farmArea).toLocaleString(undefined, { maximumFractionDigits: 2 })}</b> <span>hectares</span>` : '<span class="note">Not drawn yet</span>'}
        <button type="button" class="ghost small" onclick="go('map')">${me.farmArea ? 'Edit on the map' : 'Draw my farm on the map'}</button></div>
      <label>Status update</label><textarea id="f5" rows="3" placeholder="e.g. Harvesting onions next week, 20 quintals available">${esc(me.status)}</textarea>
      <button onclick="saveProfile()">Save profile</button><p id="pm" class="note"></p></div>`);
  },

  /* --- buyer: marketplace --- */
  shop() {
    out(`<h2>Marketplace</h2><input id="sq" placeholder="Search products or locations" oninput="drawShop()"><div id="shop" class="grid"></div>`);
    drawShop();
  },

  /* --- orders (buyer and farmer see the same orders and the same status) --- */
  orders() {
    const farmer = me.role === 'farmer';
    const list = ls('orders', []).filter(o => farmer ? o.farmer === me.username : o.buyer === me.username).slice().reverse();
    const steps = ['Pending', 'Accepted', 'Delivered'];
    const track = o => steps.includes(o.status)
      ? `<div class="track">${steps.map((t, i) => `<span class="${i <= steps.indexOf(o.status) ? 'done' : ''}">${t}</span>`).join('')}</div>`
      : `<span class="st st-${o.status.toLowerCase()}">${o.status}</span>`;
    const btns = o => farmer
      ? (o.status === 'Pending' ? `<button class="small" onclick="orderAct(${o.id},'accept')">Accept</button> <button class="danger small" onclick="orderAct(${o.id},'decline')">Decline</button>`
        : o.status === 'Accepted' ? `<button class="small" onclick="orderAct(${o.id},'deliver')">Mark delivered</button>` : '')
      : (o.status === 'Pending' ? `<button class="danger small" onclick="orderAct(${o.id},'cancel')">Cancel order</button>`
        : o.status === 'Delivered' ? (o.rating ? `<span class="stars">${stars(o.rating.stars)}</span>` : `<button class="small" onclick="toggleRate(${o.id})">Rate farmer</button>`) : '');
    const contactCell = o => {
      if (o.status !== 'Accepted' && o.status !== 'Delivered') return '';
      const theirs = farmer ? o.buyerContact : o.farmerContact, mineC = farmer ? o.farmerContact : o.buyerContact;
      const other = farmer ? 'buyer' : 'farmer';
      let h = theirs ? `<p class="cinfo"><b>Phone</b> ${esc(theirs.phone)}<br>${esc(theirs.note)}</p>`
        : `<p class="note">${farmer ? 'Waiting for the buyer to share their contact.' : 'Waiting for the farmer to share their contact.'}</p>`;
      if (o.status === 'Accepted') h += `<button class="small" onclick="toggleContact(${o.id})">${mineC ? 'Edit my contact' : 'Share my contact'}</button>`;
      else if (mineC) h += `<p class="note">You shared your contact.</p>`;
      return h;
    };
    const formRow = o => {
      const mineC = (farmer ? o.farmerContact : o.buyerContact) || {};
      const note = mineC.note || (farmer ? me.location : '') || '';
      return `<tr><td colspan="7"><div class="cform"><h3>${farmer ? 'Share your contact with the buyer' : 'Share your contact with the farmer'}</h3>
        <input id="cph" type="tel" maxlength="25" placeholder="Phone number" value="${esc(mineC.phone || '')}">
        <input id="cnt" maxlength="200" placeholder="${farmer ? 'Pickup place or note for the buyer' : 'Delivery address or note for the farmer'}" value="${esc(note)}">
        <button class="small" onclick="saveContact(${o.id})">Send contact</button> <button class="ghost small" onclick="toggleContact(null)">Close</button></div></td></tr>`;
    };
    const rateRow = o => `<tr><td colspan="7"><div class="cform"><h3>Rate this farmer</h3>
        <select id="rst"><option value="5">★★★★★</option><option value="4">★★★★☆</option><option value="3">★★★☆☆</option><option value="2">★★☆☆☆</option><option value="1">★☆☆☆☆</option></select>
        <input id="rcm" maxlength="200" placeholder="Write a short review (optional)">
        <button class="small" onclick="saveRate(${o.id})">Send rating</button> <button class="ghost small" onclick="toggleRate(null)">Close</button></div></td></tr>`;
    out(`<h2>${farmer ? 'Orders' : 'My orders'}</h2><button class="small" onclick="reloadOrders()">Refresh</button>
      ${list.length ? `<div class="scroll"><table><tr><th>Date</th><th>${farmer ? 'Buyer' : 'Farmer'}</th><th>Item</th><th>Total</th><th>Status</th><th></th><th>Contact</th></tr>${list.map(o => `<tr><td>${o.date}</td><td>${farmer ? esc(o.buyerName) : farmerLink(o.farmer, o.farmerName)}</td><td>${o.qty} ${o.unit} ${esc(o.name)}</td><td>${money(o.total)}</td><td>${track(o)}</td><td>${btns(o)}</td><td>${contactCell(o)}</td></tr>${openContact === o.id && o.status === 'Accepted' ? formRow(o) : ''}${openRate === o.id && o.status === 'Delivered' && !o.rating ? rateRow(o) : ''}`).join('')}</table></div>`
        : `<p class="note">${farmer ? 'No orders from buyers yet.' : 'No orders yet. Visit the Marketplace to buy.'}</p>`}`);
  },

  /* --- data scientist: datasets --- */
  data() {
    const extra = ls('extraDis', []);
    out(`<h2>Disease datasets</h2><div class="card"><h3>Upload a dataset (.csv)</h3>
      <p class="note">One disease per line: <b>crop,disease,symptoms,treatment</b>. Separate symptom words with semicolons.<br>Example: <code>Maize,Gray leaf spot,gray;rectangular;spots,Rotate crops and use resistant hybrids</code></p>
      <input id="csv" type="file" accept=".csv,text/csv"><button onclick="uploadCsv()">Upload to disease detection</button><p id="um" class="note"></p></div>
      <div class="card"><h3>Add one record</h3><input id="r1" placeholder="Crop"><input id="r2" placeholder="Disease name"><input id="r3" placeholder="Symptom words, separated by ;"><input id="r4" placeholder="Treatment advice"><button onclick="addRecord()">Add record</button></div>
      <h3>Records added by data scientists (${extra.length})</h3>
      ${extra.length ? `<div class="scroll"><table><tr><th>Crop</th><th>Disease</th><th>Symptoms</th><th>Treatment</th><th>By</th><th></th></tr>${extra.map((d, i) => `<tr><td>${esc(d.crop)}</td><td>${esc(d.name)}</td><td>${esc(d.sym.join(', '))}</td><td>${esc(d.fix)}</td><td>${esc(d.by)}</td><td><button class="danger small" onclick="delRecord(${i})">Delete</button></td></tr>`).join('')}</table></div>` : '<p class="note">None yet. Farmers will see your records the moment you add them.</p>'}
      <p class="note">Starter dataset: ${DIS.length} records.</p>`);
  }
};

/* ===== actions ===== */
function drawChat() {
  const l = $('#log'); if (!l) return;
  l.innerHTML = chat.map(m => `<div class="msg ${m[0]}">${esc(m[1])}</div>`).join('');
  l.scrollTop = l.scrollHeight;
}
function ask() {
  const q = $('#q').value.trim(); if (!q) return;
  const t = q.toLowerCase(); let best = null, top = 0;
  KB.forEach(e => { const s = e.k.reduce((n, w) => n + (new RegExp('\\b' + w + 's?\\b').test(t) ? (w.length > 3 ? 2 : 1) : 0), 0); if (s > top) { top = s; best = e; } });
  chat.push(['user', q], ['bot', best ? best.a : 'I do not have a good answer for that yet. Try naming the crop or topic (for example "teff fertilizer", "tomato pests" or "grain storage"), or ask your local agriculture extension officer.']);
  $('#q').value = ''; drawChat();
}
function prev(i) { const f = i.files[0]; if (f) $('#pv').src = URL.createObjectURL(f); }
function detect() {
  const crop = $('#dc').value, t = $('#ds').value.toLowerCase();
  if (!t.trim()) return $('#dr').innerHTML = '<p class="note">Describe what you see first.</p>';
  const res = allDis().filter(d => crop === 'Any' || d.crop === crop || d.crop === 'Any')
    .map(d => ({ d, s: d.sym.filter(w => t.includes(w)).length })).filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s).slice(0, 3);
  $('#dr').innerHTML = res.length ? res.map(x => `<div class="card"><h3>${esc(x.d.name)} <span class="tag">${esc(x.d.crop)}</span></h3><p>${esc(x.d.fix)}</p><p class="note">Matched ${x.s} of ${x.d.sym.length} symptoms</p></div>`).join('') + '<p class="note">This is a guide, not a lab test. If the problem spreads, visit your local agriculture office.</p>'
    : '<div class="card"><p>No match found. Try different words (color, spots, wilting, insects) or visit your local agriculture extension officer.</p></div>';
}
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
const farmerLink = (u, name) => `<a href="#" class="flink" onclick="return showFarmer('${esc(u)}')">${esc(name)}</a>`;
function prodCard(p, withFarmer) {
  const f = ls('users', []).find(u => u.username === p.username) || {};
  return `<div class="card"><h3>${esc(p.name)}</h3><p class="price">${money(p.price)} / ${p.unit}</p><p>${p.qty} ${p.unit} available${withFarmer ? `<br>Farmer: ${farmerLink(p.username, p.farmerName)}${f.status ? `<br><span class="note">“${esc(f.status)}”</span>` : ''}` : ''}<br>Pickup: ${esc(p.loc)}</p>
    <input id="b${p.id}" type="number" min="1" max="${p.qty}" value="1"><button onclick="buy(${p.id})">Buy</button></div>`;
}
function drawShop() {
  const q = ($('#sq').value || '').toLowerCase();
  const ps = ls('products', []).filter(p => p.qty > 0 && (p.name + p.loc + p.farmerName).toLowerCase().includes(q));
  $('#shop').innerHTML = ps.length ? ps.map(p => prodCard(p, true)).join('') : '<p class="note">No products match yet. Farmers will appear here as soon as they upload.</p>';
}
/* --- farmer profile page (buyers open it by clicking a farmer's name) --- */
function showFarmer(u) {
  const f = ls('users', []).find(x => x.username === u);
  if (!f) return false;
  viewFarmer = u;
  const st = (ls('farmerStats', {}) || {})[u] || { avg: 0, count: 0, delivered: 0, reviews: [] };
  const prods = ls('products', []).filter(p => p.username === u && p.qty > 0);
  const row = (label, val) => `<p><b>${label}</b><br>${val ? esc(val) : '<span class="note">Not given yet</span>'}</p>`;
  out(`<button class="ghost small" onclick="go('shop')">← Back to marketplace</button>
    <h2>${esc(f.name)}</h2>
    <div class="card">
      <div class="rate">${st.count ? `<span class="stars">${stars(Math.round(st.avg))}</span> <b>${st.avg}</b> <span class="note">(${st.count} ${st.count === 1 ? 'review' : 'reviews'})</span>` : '<span class="note">No ratings yet.</span>'}</div>
      <p class="note">Completed orders: ${st.delivered}</p>
      ${row('Farm name', f.farm)}${row('Location', f.location)}<p><b>Farm size</b><br>${f.farmArea ? `${Number(f.farmArea).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span>hectares</span>` : '<span class="note">Not given yet</span>'}</p>${row('Main crops', f.crops)}${row('Status update', f.status)}
    </div>
    <h3>Products available</h3>
    ${prods.length ? `<div class="grid">${prods.map(p => prodCard(p, false)).join('')}</div>` : '<p class="note">This farmer has no products on sale right now.</p>'}
    <h3>Customer reviews</h3>
    ${st.reviews.length ? st.reviews.map(r => `<div class="card"><span class="stars">${stars(r.stars)}</span>${r.comment ? `<p>“${esc(r.comment)}”</p>` : ''}<p class="note">${esc(r.buyerName)} · ${esc(r.item)} · ${r.date}</p></div>`).join('') : '<p class="note">No reviews yet.</p>'}`);
  return false;
}

/* ===== planting calendar and reminders (farmers) ===== */
const CAL = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  crops: {
    Teff: { plant: [6, 7, 8], days: 120, type: 'cereal' },
    Maize: { plant: [3, 4, 5, 6], days: 140, type: 'cereal' },
    Wheat: { plant: [6, 7, 11, 12], days: 130, type: 'cereal' },
    Barley: { plant: [2, 3, 6, 7], days: 120, type: 'cereal' },
    Sorghum: { plant: [4, 5, 6], days: 150, type: 'cereal' },
    Beans: { plant: [5, 6, 7], days: 100, type: 'legume' },
    Chickpea: { plant: [9, 10], days: 110, type: 'legume' },
    Onion: { plant: [10, 11, 12, 1], days: 110, type: 'veg' },
    Tomato: { plant: [10, 11, 1, 2], days: 90, type: 'veg' },
    Potato: { plant: [2, 3, 6, 7], days: 100, type: 'tuber' },
    Cabbage: { plant: [9, 10, 11, 2, 3], days: 85, type: 'veg' },
    Pepper: { plant: [10, 11, 2, 3], days: 130, type: 'veg' }
  },
  // [days after planting, task]. 'r' = a week before harvest, 'h' = harvest day, 's' = a week after harvest.
  tasks: {
    cereal: [[0, 'Sow seed'], [12, 'Check germination and re-sow gaps'], [25, 'First weeding'], [40, 'Apply top-dress fertilizer (urea)'], [50, 'Second weeding'], [60, 'Scout for pests and disease'], ['r', 'Check if the crop is ready'], ['h', 'Harvest'], ['s', 'Dry and store the harvest']],
    legume: [[0, 'Sow seed'], [10, 'Check germination and re-sow gaps'], [21, 'First weeding'], [40, 'Scout for pests and disease'], [50, 'Second weeding'], ['r', 'Check if the crop is ready'], ['h', 'Harvest'], ['s', 'Dry and store the harvest']],
    veg: [[0, 'Transplant seedlings'], [3, 'Water the field (every 3–4 days)'], [14, 'First weeding'], [28, 'Apply top-dress fertilizer (urea)'], [42, 'Second weeding'], [56, 'Scout for pests and disease'], ['r', 'Check if the crop is ready'], ['h', 'Harvest'], ['s', 'Sell or store the harvest']],
    tuber: [[0, 'Plant seed tubers'], [14, 'Check germination and re-sow gaps'], [30, 'First weeding'], [35, 'Earth up the plants'], [50, 'Scout for pests and disease'], ['r', 'Check if the crop is ready'], ['h', 'Harvest'], ['s', 'Sell or store the harvest']]
  }
};

const calToday = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const calParse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const calPlus = (dt, n) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);
const calDiff = (a, b) => Math.round((a - b) / 864e5);
const calIso = dt => dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
const calFmt = dt => `${dt.getDate()} <span>${CAL.months[dt.getMonth()]}</span> ${dt.getFullYear()}`;
const calSeason = m => m >= 2 && m <= 5 ? 'Belg (short rains)' : m >= 6 && m <= 9 ? 'Meher (main rains)' : 'Dry season';

// Every task of one planting, with its due date and how many days away it is
function calTasks(p) {
  const c = CAL.crops[p.crop];
  if (!c) return [];
  const start = calParse(p.date);
  return CAL.tasks[c.type].map(([d, text], i) => {
    const off = d === 'r' ? c.days - 7 : d === 'h' ? c.days : d === 's' ? c.days + 7 : d;
    const due = calPlus(start, off);
    return { i, text, due, done: (p.done || []).includes(i), diff: calDiff(due, calToday()) };
  });
}
// Reminders: not done, due within 3 days or overdue by up to 2 weeks
function calAlerts() {
  const list = [];
  ls('plantings', []).forEach(p => calTasks(p).forEach(t => { if (!t.done && t.diff <= 3 && t.diff >= -14) list.push({ p, t }); }));
  return list.sort((a, b) => a.t.diff - b.t.diff);
}
function calWhen(t) {
  const days = n => n + (n === 1 ? ' day' : ' days');
  if (t.done) return '<span class="ok">Done</span>';
  if (t.diff < 0) return `<span class="late">${days(-t.diff)} overdue</span>`;
  if (t.diff === 0) return '<span class="soon">Due today</span>';
  return `<span class="${t.diff <= 3 ? 'soon' : 'later'}">in ${days(t.diff)}</span>`;
}
const calRow = (p, t, showCrop) => `<li class="task ${t.done ? 'done' : ''}"><span class="td">${calFmt(t.due)}</span>
  <span class="tt">${showCrop ? `<b>${esc(p.crop)}</b><span class="sep"> · </span>` : ''}<span>${t.text}</span></span>${calWhen(t)}
  <button class="small ${t.done ? 'ghost' : ''}" onclick="calTask(${p.id},${t.i},${!t.done})">${t.done ? 'Undo' : 'Mark done'}</button></li>`;

// Red count on the "Planting Calendar" menu button
function calBadge() {
  const b = document.querySelector('#nav button[data-v="calendar"]');
  if (!b) return;
  let s = b.querySelector('.badge');
  const n = calAlerts().length;
  if (n) { if (!s) { s = document.createElement('span'); s.className = 'badge'; b.appendChild(s); } s.textContent = n; }
  else if (s) s.remove();
}
// Once per browser session, tell the farmer if tasks are waiting
function calLoginAlert() {
  if (!me || me.role !== 'farmer') return;
  try { if (sessionStorage.getItem('calAlert')) return; sessionStorage.setItem('calAlert', '1'); } catch { /* ignore */ }
  const n = calAlerts().length;
  if (n) alert('Farm tasks due: ' + n + '. Open Planting Calendar.');
}

V.calendar = function () {
  const today = calToday(), month = today.getMonth() + 1;
  const mine = (me.crops || '').toLowerCase();
  const names = Object.keys(CAL.crops);
  const nowCrops = names.filter(c => CAL.crops[c].plant.includes(month));
  const alerts = calAlerts();
  const plantings = ls('plantings', []).filter(p => CAL.crops[p.crop]).slice().sort((a, b) => b.date.localeCompare(a.date));

  const glance = names.map(c => {
    const k = CAL.crops[c], hv = new Set(k.plant.map(m => ((m - 1 + Math.round(k.days / 30)) % 12) + 1));
    return `<tr><th class="${mine && mine.includes(c.toLowerCase()) ? 'mine' : ''}">${c}</th>${CAL.months.map((_, i) => `<td class="${k.plant.includes(i + 1) ? 'pl' : hv.has(i + 1) ? 'hv' : ''} ${i + 1 === month ? 'now' : ''}"></td>`).join('')}</tr>`;
  }).join('');

  out(`<h2>Planting Calendar</h2>
    <p class="note">These dates are a general guide for the Ethiopian highlands and midlands. Planting time changes with your altitude and rainfall, so check with your local development agent.</p>
    ${alerts.length ? `<div class="card remind"><h3>Reminders (${alerts.length})</h3><ul class="tasks">${alerts.map(a => calRow(a.p, a.t, true)).join('')}</ul></div>` : ''}
    <div class="card"><h3>Good to plant now</h3>
      <p class="note">This month: <b>${calSeason(month)}</b></p>
      ${nowCrops.length ? nowCrops.map(c => `<button class="chip" onclick="calPick('${c}')">${c}</button>`).join(' ') : '<p class="note">No crops are in their main planting window this month.</p>'}
    </div>
    <div class="card"><h3>Add a planting</h3>
      <label>Crop</label><select id="pc" onchange="calSel()">${names.map(c => `<option>${c}</option>`).join('')}</select>
      <p id="cnote" class="note" hidden>Raise seedlings in a nursery for 4–6 weeks before transplanting.</p>
      <label>Planting date</label><input id="pd" type="date" value="${calIso(today)}">
      <input id="pf" maxlength="40" placeholder="Field name (optional)">
      <button onclick="calAdd()">Add planting</button>
    </div>
    <h3>My plantings</h3>
    ${plantings.length ? plantings.map(p => {
      const c = CAL.crops[p.crop], start = calParse(p.date), day = calDiff(today, start), harvest = calPlus(start, c.days);
      const pct = Math.max(0, Math.min(100, Math.round(day / c.days * 100)));
      return `<div class="card"><h3>${p.crop}</h3>${p.field ? `<p class="note">${esc(p.field)}</p>` : ''}
        <p><b>Planted</b> ${calFmt(start)} &nbsp; <b>Expected harvest</b> ${calFmt(harvest)}</p>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <p class="note">${day < 0 ? 'in ' + (-day) + (day === -1 ? ' day' : ' days') : 'Day ' + Math.min(day, c.days) + ' of ' + c.days}</p>
        <ul class="tasks">${calTasks(p).map(t => calRow(p, t, false)).join('')}</ul>
        <button class="danger small" onclick="calRemove(${p.id})">Remove planting</button></div>`;
    }).join('') : '<p class="note">No plantings yet. Add your first one above to get a reminder schedule.</p>'}
    <h3>Year at a glance</h3>
    <div class="card"><div class="scroll"><table class="glance"><tr><th>Crop</th>${CAL.months.map((m, i) => `<th class="${i + 1 === month ? 'now' : ''}">${m}</th>`).join('')}</tr>${glance}</table></div>
      <p class="note"><span class="key pl"></span> <span>Planting</span> &nbsp; <span class="key hv"></span> <span>Harvest</span></p>
      <p class="note">Your crops are shown in bold.</p></div>`);
  calSel();
};
function calSel() { const s = $('#pc'), n = $('#cnote'), k = s && CAL.crops[s.value]; if (n && k) n.hidden = k.type !== 'veg'; }
function calPick(c) { $('#pc').value = c; calSel(); $('#pc').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function calAdd() {
  act(async () => {
    await api('plantings', 'POST', { crop: $('#pc').value, date: $('#pd').value, field: $('#pf').value });
    await refresh(); V.calendar(); alert('Planting added.');
  });
}
function calTask(id, i, done) { act(async () => { await api('plantings/' + id + '/task', 'POST', { index: i, done }); await refresh(); V.calendar(); }); }
function calRemove(id) {
  if (!confirm('Remove this planting and its reminders?')) return;
  act(async () => { await api('plantings/' + id + '/remove', 'POST'); await refresh(); V.calendar(); });
}

/* ===== draw your farm: outline maths ===== */
// IMPORTANT: server.js has an identical copy of FarmGeo, so the hectares a farmer sees are the hectares that get saved.
const FarmGeo = (() => {
  const R = 6378137, D2R = Math.PI / 180;

  // Area of a polygon on the Earth's surface, in square metres.
  function areaM2(pts) {
    const n = pts.length;
    if (n < 3) return 0;
    let a = 0;
    for (let i = 0; i < n; i++) {
      const p1 = pts[i], p2 = pts[(i + 1) % n];
      a += (p2[1] - p1[1]) * D2R * (2 + Math.sin(p1[0] * D2R) + Math.sin(p2[0] * D2R));
    }
    return Math.abs(a * R * R / 2);
  }
  const toHa = m2 => m2 / 10000;

  // True if two sides of the outline cross each other (a "bow-tie" shape has no sensible size).
  function selfIntersects(pts) {
    const n = pts.length;
    if (n < 4) return false;
    const k = Math.cos(pts.reduce((s, p) => s + p[0], 0) / n * D2R);
    const q = pts.map(p => [p[1] * k, p[0]]);
    const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (j === i + 1 || (i === 0 && j === n - 1)) continue; // sides that share a corner
        const a = q[i], b = q[(i + 1) % n], c = q[j], d = q[(j + 1) % n];
        if (orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0) return true;
      }
    }
    return false;
  }

  return { areaM2, toHa, selfIntersects };
})();

/* ===== Draw your farm on the satellite map =====
   Farmers click the corners of their field. The site shows the size in hectares
   live and saves the outline + size to their profile.
   Called from drawLeafletMap() in script.js once the map exists. */
function initFarmTools(map) {
  if (!document.getElementById('fdDraw')) return; // only the farmer's map page has the drawing buttons
  const $f = id => document.getElementById(id);
  const saved = me && Array.isArray(me.farmShape) && me.farmShape.length >= 3 ? me.farmShape : null;
  let pts = saved ? saved.map(p => L.latLng(p[0], p[1])) : [];
  let drawing = false, dirty = false, busy = false, flash = '';

  const STYLE = { color: '#ffd54a', weight: 3, fillColor: '#ffd54a', fillOpacity: 0.25 };
  const poly = L.polygon([], STYLE).addTo(map);
  const guide = L.polyline([], { color: '#ffd54a', weight: 2, dashArray: '6 6', interactive: false }).addTo(map);
  const dots = L.layerGroup().addTo(map);
  let tipOn = false;

  const arr = () => pts.map(p => [p.lat, p.lng]);
  const num = (n, d = 2) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d });

  /* ---- corner handles ---- */
  function rebuildDots() {
    dots.clearLayers();
    pts.forEach((p, i) => {
      const m = L.marker(p, {
        draggable: true, keyboard: false, zIndexOffset: 1000,
        icon: L.divIcon({ className: 'farm-pt' + (i === 0 ? ' first' : ''), iconSize: [18, 18] })
      }).addTo(dots);
      m.on('drag', e => { pts[i] = e.target.getLatLng(); dirty = true; flash = ''; update(false); });
      m.on('dragend', () => update(false));
      if (i === 0) m.on('click', () => { if (drawing && pts.length >= 3) finish(); });
    });
  }

  /* ---- the live readout, messages and button states ---- */
  function update(rebuild) {
    if (rebuild) rebuildDots();
    poly.setLatLngs(pts);
    const a = arr(), enough = a.length >= 3, crossed = enough && FarmGeo.selfIntersects(a);
    const m2 = enough && !crossed ? FarmGeo.areaM2(a) : 0, ha = FarmGeo.toHa(m2);

    $f('fdHa').textContent = m2 ? num(ha) : '—';
    $f('fdM2').textContent = m2 ? num(m2, 0) : '—';

    // size label sitting on the field
    if (m2) {
      const txt = num(ha) + ' ha';
      if (tipOn) poly.setTooltipContent(txt);
      else { poly.bindTooltip(txt, { permanent: true, direction: 'center', className: 'farm-tip' }); tipOn = true; }
    } else if (tipOn) { poly.unbindTooltip(); tipOn = false; }

    let msg = flash;
    if (!msg) {
      if (drawing) msg = !pts.length ? 'Click the map to add the first corner of your field.'
        : pts.length < 3 ? 'Keep adding corners around your field.'
        : 'Click Finish shape, or click the first corner, to close the outline.';
      else if (pts.length && !enough) msg = 'Your field needs at least 3 corners.';
      else if (crossed) msg = 'The lines cross each other. Drag a corner so the lines do not cross.';
    }
    $f('fdMsg').textContent = msg;
    $f('fdState').textContent = !pts.length ? '' : (dirty ? 'Not saved yet.' : 'Saved to your profile.');

    $f('fdDraw').textContent = drawing ? 'Finish shape' : (pts.length ? 'Redraw my farm' : 'Draw my farm');
    $f('fdUndo').disabled = !pts.length;
    $f('fdClear').disabled = !pts.length;
    const removing = !pts.length && !!saved_now() && dirty;
    $f('fdSave').disabled = busy || drawing || !((enough && !crossed && dirty) || removing);
    $f('leafmap').classList.toggle('drawing', drawing);
  }
  const saved_now = () => me && Array.isArray(me.farmShape) && me.farmShape.length >= 3;

  /* ---- drawing ---- */
  function start() {
    if (drawing) return finish();
    pts = []; dirty = true; drawing = true; flash = '';
    map.doubleClickZoom.disable();
    update(true);
  }
  function finish() {
    if (pts.length < 3) { flash = 'Your field needs at least 3 corners.'; return update(false); }
    if (FarmGeo.selfIntersects(arr())) { flash = 'The lines cross each other. Drag a corner so the lines do not cross.'; return update(false); }
    drawing = false; flash = ''; guide.setLatLngs([]);
    map.doubleClickZoom.enable();
    update(false);
  }
  map.on('click', e => {
    if (!drawing) return;
    pts.push(e.latlng); dirty = true; flash = '';
    update(true);
  });
  map.on('mousemove', e => {
    if (drawing && pts.length) guide.setLatLngs([pts[pts.length - 1], e.latlng]);
  });

  $f('fdDraw').onclick = start;
  $f('fdUndo').onclick = () => { pts.pop(); dirty = true; flash = ''; if (!pts.length) guide.setLatLngs([]); update(true); };
  $f('fdClear').onclick = () => {
    pts = []; dirty = true; flash = ''; drawing = false; guide.setLatLngs([]);
    map.doubleClickZoom.enable(); update(true);
  };
  $f('fdSave').onclick = async () => {
    busy = true; update(false);
    try {
      const r = await api('farm-boundary', 'POST', { points: arr().map(p => [+p[0].toFixed(6), +p[1].toFixed(6)]) });
      await refresh();
      dirty = false;
      flash = pts.length ? '' : 'Your farm outline was removed.';
    } catch (e) { flash = e.message; }
    busy = false; update(false);
  };

  if (pts.length) map.fitBounds(poly.setLatLngs(pts).getBounds(), { padding: [40, 40], maxZoom: 18 });
  update(true);
  dirty = false; update(false);
}

/* ===== admin dashboard (platform owner) ===== */
NAV.admin = [['admin', 'Overview'], ['adminUsers', 'Users'], ['adminListings', 'Listings'], ['adminOrders', 'Orders'], ['adminActivity', 'Activity']];
let ADM = null, admQ = '', admRole = '', admStatus = '';
async function admLoad(render) {
  out('<p class="note">Loading…</p>');
  try { ADM = await api('admin/overview'); render(); }
  catch (e) { out('<div class="card"><h3>Could not load the dashboard</h3><p>' + esc(e.message) + '</p></div>'); }
}
// Download a table as a CSV file that opens in Excel (cells that start with = + - @ are neutralised)
function admCsv(name, rows) {
  const cell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const blob = new Blob(['\ufeff' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name + '-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const admStat = (label, value, sub) => `<div class="stat"><div class="lbl">${label}</div><div class="num">${value}</div>${sub ? `<div class="note">${sub}</div>` : ''}</div>`;
const admBars = (rows) => { const max = Math.max(1, ...rows.map(r => r[1])); return rows.map(([l, n]) => `<div class="adm-row"><span>${l}</span><div class="bar"><i style="width:${Math.round(n / max * 100)}%"></i></div><b>${n}</b></div>`).join(''); };
const ROLE_LABEL = { farmer: 'Farmers', buyer: 'Buyers', scientist: 'Data scientists', investor: 'Investors', admin: 'Admins' };

V.admin = () => admLoad(() => {
  const s = ADM.stats, n = (o, k) => (o && o[k]) || 0;
  out(`<h2>Platform overview</h2>
    <div class="stats">
      ${admStat('Users', s.users, s.suspended ? s.suspended + ' suspended' : 'none suspended')}
      ${admStat('Listings in stock', s.inStock, s.products + ' listings in total')}
      ${admStat('Orders', s.orders, n(s.byStatus, 'Pending') + ' waiting for a farmer')}
      ${admStat('Sales delivered', money(s.salesDelivered), money(s.openValue) + ' still open')}
      ${admStat('Average rating', s.ratings ? s.avgRating + ' ★' : '—', s.ratings + ' rating(s)')}
      ${admStat('Plantings logged', s.plantings)}
      ${admStat('Farms drawn', s.farmsDrawn, s.hectares + ' hectares in total')}
      ${admStat('Credit approved', money(s.creditApprovedTotal), n(s.creditByStatus, 'Pending') + ' request(s) waiting')}
      ${admStat('Insurance policies', s.insurancePolicies, s.claimsPending + ' claim(s) waiting')}
      ${admStat('Credit offers', s.offers)}
      ${admStat('Disease records added', s.datasetRecords)}
    </div>
    <div class="grid">
      <div class="card"><h3>Users by role</h3>${admBars(Object.keys(ROLE_LABEL).map(r => [ROLE_LABEL[r], n(s.byRole, r)]))}</div>
      <div class="card"><h3>Orders by status</h3>${admBars(['Pending', 'Accepted', 'Delivered', 'Declined', 'Cancelled'].map(k => [k, n(s.byStatus, k)]))}</div>
      <div class="card"><h3>Credit requests</h3>${admBars(['Pending', 'Approved', 'Rejected'].map(k => [k, n(s.creditByStatus, k)]))}</div>
    </div>`);
});

/* --- users --- */
V.adminUsers = () => admLoad(() => {
  out(`<h2>Users</h2>
    <div class="farmbar">
      <input id="admQ" placeholder="Search name, username or location" oninput="admQ=this.value;admUsersTable()">
      <select id="admRole" onchange="admRole=this.value;admUsersTable()"><option value="">All roles</option>${Object.keys(ROLE_LABEL).map(r => `<option value="${r}">${ROLE_LABEL[r]}</option>`).join('')}</select>
      <select id="admSt" onchange="admStatus=this.value;admUsersTable()"><option value="">Active and suspended</option><option value="active">Active only</option><option value="suspended">Suspended only</option></select>
      <button class="small" onclick="admExportUsers()">Export CSV</button>
    </div><div id="admTbl"></div>`);
  $('#admQ').value = admQ; $('#admRole').value = admRole; $('#admSt').value = admStatus;
  admUsersTable();
});
const admUserList = () => ADM.users.filter(u => (!admRole || u.role === admRole)
  && (!admStatus || (admStatus === 'suspended') === u.suspended)
  && (u.name + ' ' + u.username + ' ' + u.email + ' ' + u.location + ' ' + u.farm).toLowerCase().includes(admQ.toLowerCase()));
function admUsersTable() {
  const list = admUserList();
  $('#admTbl').innerHTML = list.length ? `<div class="scroll"><table><tr><th>Name</th><th>Username</th><th>Role</th><th>Location / farm</th><th>Farm size</th><th>Joined</th><th>Status</th><th></th></tr>${list.map(u => `<tr>
    <td>${esc(u.name)}</td><td>${u.username ? esc(u.username) : '<span class="note">' + esc(u.email || 'no username') + '</span>'}</td><td>${esc(u.role)}</td>
    <td>${esc([u.location, u.farm].filter(Boolean).join(' · ')) || '—'}</td><td>${u.farmArea ? u.farmArea + ' ha' : '—'}</td><td>${esc(u.joined) || '—'}</td>
    <td>${u.suspended ? '<span class="st st-declined">Suspended</span>' : '<span class="st">Active</span>'}</td>
    <td>${u.role === 'admin' || !u.username ? '' : u.suspended ? `<button class="small" onclick="admSuspend('${esc(u.username)}', false)">Reactivate</button>` : `<button class="danger small" onclick="admSuspend('${esc(u.username)}', true)">Suspend</button>`}</td></tr>`).join('')}</table></div><p class="note">${list.length} of ${ADM.users.length} users</p>`
    : '<p class="note">No users match.</p>';
}
function admSuspend(u, on) {
  if (on && !confirm('Suspend ' + u + '? They will be logged out, cannot log in, and their listings are hidden.')) return;
  act(async () => { await api('admin/user/' + u + '/suspend', 'POST', { suspended: on }); ADM = await api('admin/overview'); admUsersTable(); });
}
function admExportUsers() { admCsv('users', [['Name', 'Username', 'Role', 'Location', 'Farm', 'Farm size (ha)', 'Joined', 'Status']].concat(admUserList().map(u => [u.name, u.username || u.email, u.role, u.location, u.farm, u.farmArea, u.joined, u.suspended ? 'Suspended' : 'Active']))); }

/* --- marketplace listings --- */
V.adminListings = () => admLoad(() => {
  out(`<h2>Listings</h2>
    <div class="farmbar"><input id="admQ" placeholder="Search product, farmer or place" oninput="admQ=this.value;admListingsTable()"><button class="small" onclick="admExportListings()">Export CSV</button></div><div id="admTbl"></div>`);
  $('#admQ').value = admQ; admListingsTable();
});
const admListingList = () => ADM.products.filter(p => (p.name + ' ' + p.owner + ' ' + p.farmerName + ' ' + p.loc).toLowerCase().includes(admQ.toLowerCase()));
function admListingsTable() {
  const list = admListingList();
  $('#admTbl').innerHTML = list.length ? `<div class="scroll"><table><tr><th>Product</th><th>Farmer</th><th>In stock</th><th>Price</th><th>Pickup</th><th></th></tr>${list.map(p => `<tr>
    <td>${esc(p.name)}</td><td>${esc(p.farmerName)} <span class="note">(${esc(p.owner)})</span></td><td>${p.qty} ${esc(p.unit)}</td><td>${money(p.price)} / ${esc(p.unit)}</td><td>${esc(p.loc)}</td>
    <td><button class="danger small" onclick="admRemoveListing(${p.id})">Remove</button></td></tr>`).join('')}</table></div><p class="note">${list.length} of ${ADM.products.length} listings</p>` : '<p class="note">No listings match.</p>';
}
function admRemoveListing(id) {
  if (!confirm('Remove this listing from the marketplace? This cannot be undone.')) return;
  act(async () => { await api('admin/product/' + id + '/remove', 'POST'); ADM = await api('admin/overview'); admListingsTable(); });
}
function admExportListings() { admCsv('listings', [['Product', 'Farmer', 'Username', 'In stock', 'Unit', 'Price (ETB)', 'Pickup']].concat(admListingList().map(p => [p.name, p.farmerName, p.owner, p.qty, p.unit, p.price, p.loc]))); }

/* --- orders --- */
V.adminOrders = () => admLoad(() => {
  out(`<h2>Orders</h2>
    <div class="farmbar"><input id="admQ" placeholder="Search buyer, farmer or item" oninput="admQ=this.value;admOrdersTable()">
      <select id="admSt" onchange="admStatus=this.value;admOrdersTable()"><option value="">All statuses</option>${['Pending', 'Accepted', 'Delivered', 'Declined', 'Cancelled'].map(s => `<option>${s}</option>`).join('')}</select>
      <button class="small" onclick="admExportOrders()">Export CSV</button></div><div id="admTbl"></div>`);
  $('#admQ').value = admQ; $('#admSt').value = ['Pending', 'Accepted', 'Delivered', 'Declined', 'Cancelled'].includes(admStatus) ? admStatus : ''; admStatus = $('#admSt').value;
  admOrdersTable();
});
const admOrderList = () => ADM.orders.filter(o => (!admStatus || o.status === admStatus) && (o.buyer + ' ' + o.farmer + ' ' + o.item).toLowerCase().includes(admQ.toLowerCase()));
function admOrdersTable() {
  const list = admOrderList();
  $('#admTbl').innerHTML = list.length ? `<div class="scroll"><table><tr><th>Date</th><th>Buyer</th><th>Farmer</th><th>Item</th><th>Total</th><th>Status</th><th>Rating</th></tr>${list.map(o => `<tr>
    <td>${esc(o.date)}</td><td>${esc(o.buyer)}</td><td>${esc(o.farmer)}</td><td>${esc(o.item)}</td><td>${money(o.total)}</td>
    <td><span class="st st-${esc(o.status.toLowerCase())}">${esc(o.status)}</span></td><td>${o.rating ? '<span class="stars">' + '★'.repeat(o.rating) + '</span>' : '—'}</td></tr>`).join('')}</table></div><p class="note">${list.length} of ${ADM.orders.length} orders (latest 500)</p>` : '<p class="note">No orders match.</p>';
}
function admExportOrders() { admCsv('orders', [['Date', 'Buyer', 'Farmer', 'Item', 'Total (ETB)', 'Status', 'Rating']].concat(admOrderList().map(o => [o.date, o.buyer, o.farmer, o.item, o.total, o.status, o.rating || '']))); }

/* --- activity log --- */
V.adminActivity = () => admLoad(() => {
  out(`<h2>Admin activity</h2><p class="note">The latest actions taken by administrators.</p>
    ${ADM.audit.length ? `<div class="scroll"><table><tr><th>When</th><th>Admin</th><th>Action</th></tr>${ADM.audit.map(a => `<tr><td>${esc(a.date)}</td><td>${esc(a.admin)}</td><td>${esc(a.text)}</td></tr>`).join('')}</table></div>` : '<p class="note">Nothing yet. Suspending an account or removing a listing will appear here.</p>'}`);
});

/* ===== server-backed login and actions ===== */
async function doAuth(e) {
  e.preventDefault();
  const role = document.querySelector('input[name=role]:checked').value;
  try {
    const r = await api(mode === 'register' ? 'register' : 'login', 'POST', { name: $('#name').value.trim(), username: $('#username').value.trim(), password: $('#pw').value, role });
    token = r.token; localStorage.setItem('token', token);
    await enter();
  } catch (err) { $('#msg').textContent = err.message; }
}
function logout() {
  localStorage.removeItem('token');
  try { navigator.serviceWorker && navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_API' }); } catch {}
  setTimeout(() => location.reload(), 80);
}

// OPTIONAL: paste your Google Maps API key here to use Google satellite (see steps in my message).
// Leave it empty ('') and the free Leaflet map below is used instead.
const GOOGLE_MAPS_KEY = '';

let _gLoading;
function loadGoogle() {
  if (window.google && google.maps) return Promise.resolve();
  if (_gLoading) return _gLoading;
  _gLoading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://maps.googleapis.com/maps/api/js?key=' + GOOGLE_MAPS_KEY;
    s.async = true; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  return _gLoading;
}
async function drawGoogleMap(lat, lon) {
  await loadGoogle();
  if (_map) { _map.remove(); _map = null; }
  const el = $('#leafmap');
  el.innerHTML = '';
  // If Google rejects the key (wrong key, billing off), switch to the free map automatically
  window.gm_authFailure = () => drawLeafletMap(lat, lon);
  const m = new google.maps.Map(el, {
    center: { lat, lng: lon }, zoom: 17,
    mapTypeId: 'hybrid', // satellite + place names. Use 'satellite' for no labels.
    mapTypeControl: true, streetViewControl: false
  });
  new google.maps.Marker({ position: { lat, lng: lon }, map: m, title: 'Your location' });
}
function drawMap(lat, lon) {
  // The "Draw my farm" tools are built on the Leaflet map, so it is always used here.
  // (drawGoogleMap above is kept in case you want it back later.)
  drawLeafletMap(lat, lon);
}

let _map;
function drawLeafletMap(lat, lon) {
  if (_map) { _map.remove(); _map = null; }
  _map = L.map('leafmap', { maxZoom: 19 }).setView([lat, lon], 15);

  // Satellite: Esri Clarity (sharpest free photos)
  const clarity = L.tileLayer('https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community', maxNativeZoom: 16, maxZoom: 19
  });
  const street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors', maxNativeZoom: 19, maxZoom: 19
  });
  const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Labels &copy; Esri', maxNativeZoom: 15, maxZoom: 19
  });

  clarity.addTo(_map);
  labels.addTo(_map);

  // Switch box (top right): Satellite / Street map, and Place names on or off
  L.control.layers({ 'Satellite': clarity, 'Street map': street }, { 'Place names': labels }, { collapsed: false }).addTo(_map);

  // Fix the switch box look (the site's global form styles were stretching it)
  if (!document.getElementById('mapfix')) {
    const st = document.createElement('style');
    st.id = 'mapfix';
    st.textContent = `.leaflet-control-layers{padding:6px 10px}
      .leaflet-control-layers label{display:flex;align-items:center;gap:8px;margin:4px 0;color:#222;font-size:.9rem;cursor:pointer}
      .leaflet-control-layers input{width:auto;margin:0;padding:0}
      .leaflet-control-layers-separator{margin:6px -10px}`;
    document.head.appendChild(st);
  }
  const hasFarm = me && Array.isArray(me.farmShape) && me.farmShape.length >= 3;
  if (!hasFarm) L.marker([lat, lon]).addTo(_map).bindPopup('Your location').openPopup();
  initFarmTools(_map); // draw your farm
  setTimeout(() => _map.invalidateSize(), 200);
}

async function loadWeather(lat, lon) {
  try {
    const w = await api(`weather?lat=${lat}&lon=${lon}`);
    const day = (d, i) => `<div class="card"><b>${i === 0 ? 'Today' : new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}</b><br>${esc(d.cond)}<br>${Math.round(d.max)}° / ${Math.round(d.min)}°C<br>Rain: ${d.rain}%</div>`;
    $('#wx').outerHTML = `
      <div class="card">
        <h3>Right now</h3>
        <p style="font-size:1.6rem;margin:.2rem 0">${Math.round(w.now.temp)}°C — ${esc(w.now.cond)}</p>
        <p class="note">Wind ${Math.round(w.now.wind)} km/h · Humidity ${w.now.humidity}%</p>
      </div>
      <div class="grid">${w.days.map(day).join('')}</div>`;
  } catch (e) {
    $('#wx').innerHTML = 'Could not load weather: ' + esc(e.message);
  }
}
async function enter() {
  if (!token) return;
  try { await refresh(); } catch (e) {
    // Offline or server unreachable: keep the login so the farmer is not signed out just because there is no signal.
    if (e.offline || e.status === 502 || e.status === 503 || e.status >= 500) {
      const m = $('#msg'); if (m) m.textContent = 'You are offline and no saved data was found yet. Connect once and log in to save your data for offline use.';
      return;
    }
    localStorage.removeItem('token'); token = ''; return;
  }
  $('#auth').hidden = true;
  $('#app').hidden = false;
  $('#who').textContent = me.name + ' · ' + me.role;
  $('#nav').innerHTML = NAV[me.role].map(n => `<button data-v="${n[0]}" onclick="go('${n[0]}')">${n[1]}</button>`).join('');
  go(NAV[me.role][0][0]);
  if (typeof calBadge === 'function') { calBadge(); calLoginAlert(); }
}
function applyCredit(i, name, max) {
  const a = Number($('#am' + i).value), p = $('#pu' + i).value.trim();
  if (!a || a < 1000 || a > max || !p) return alert('Enter an amount between 1,000 and ' + max + ' ETB and what it is for.');
  act(async () => { await api('apps', 'POST', { type: 'Credit', title: name, detail: money(a) + ' for ' + p }); await refresh(); V.credit(); });
}
function enroll(n, p) {
  act(async () => { await api('apps', 'POST', { type: 'Insurance', title: n, detail: 'Premium: ' + p }); await refresh(); V.credit(); });
}
function addProduct() {
  const name = $('#pn').value.trim(), qty = Number($('#pq').value), price = Number($('#pp').value);
  if (!name || qty < 1 || price < 1) return alert('Enter the product name, quantity and price.');
  act(async () => { await api('products', 'POST', { name, qty, price, unit: $('#pu').value, loc: $('#pl').value.trim() }); await refresh(); V.market(); });
}
function delProduct(id) { act(async () => { await api('products/' + id, 'DELETE'); await refresh(); V.market(); }); }
function saveProfile() {
  act(async () => {
    await api('profile', 'POST', { name: $('#f1').value, farm: $('#f2').value, location: $('#f3').value, crops: $('#f4').value, status: $('#f5').value });
    await refresh(); $('#who').textContent = me.name + ' · ' + me.role; $('#pm').textContent = 'Saved.';
  });
}
function buy(id) {
  const n = Number($('#b' + id).value);
  act(async () => {
    const r = await api('buy', 'POST', { id, qty: n });
    await refresh(); alert('Order placed: ' + money(r.total) + '. The farmer will review it. Track it in My Orders.'); viewFarmer ? showFarmer(viewFarmer) : drawShop();
  });
}
function orderAct(id, a) {
  if (a === 'decline' && !confirm('Decline this order? The stock will go back on the market.')) return;
  if (a === 'cancel' && !confirm('Cancel this order?')) return;
  act(async () => { await api('orders/' + id + '/' + a, 'POST'); await refresh(); V.orders(); });
}
function toggleRate(id) { openRate = id; V.orders(); }
function saveRate(id) {
  act(async () => {
    await api('orders/' + id + '/rate', 'POST', { stars: Number($('#rst').value), comment: $('#rcm').value });
    openRate = null; await refresh(); V.orders(); alert('Rating sent.');
  });
}
function toggleContact(id) { openContact = id; V.orders(); }
function saveContact(id) {
  act(async () => {
    await api('orders/' + id + '/contact', 'POST', { phone: $('#cph').value, note: $('#cnt').value });
    openContact = null; await refresh(); V.orders(); alert('Contact sent.');
  });
}
function reloadOrders() { act(async () => { await refresh(); V.orders(); }); }
// keep order status fresh while the Orders tab is open
if (!window._ordPoll) window._ordPoll = setInterval(async () => {
  if (!token || document.hidden || curView !== 'orders' || openContact !== null || openRate !== null) return;
  try { await refresh(); V.orders(); } catch { /* ignore, try again next time */ }
}, 15000);
function uploadCsv() {
  const f = $('#csv').files[0]; if (!f) return $('#um').textContent = 'Choose a .csv file first.';
  const r = new FileReader();
  r.onload = () => {
    const records = [];
    r.result.split(/\r?\n/).forEach((line, i) => {
      const p = line.split(','); if (p.length < 4) return;
      if (i === 0 && p[0].trim().toLowerCase() === 'crop') return;
      const sym = p[2].split(';').map(x => x.trim().toLowerCase()).filter(Boolean);
      if (sym.length) records.push({ crop: p[0].trim(), name: p[1].trim(), sym, fix: p.slice(3).join(',').trim() });
    });
    act(async () => { await api('dis', 'POST', { records }); await refresh(); V.data(); $('#um').textContent = records.length + ' records added.'; });
  };
  r.readAsText(f);
}
function addRecord() {
  const v = [1, 2, 3, 4].map(i => $('#r' + i).value.trim());
  const sym = v[2].split(';').map(x => x.trim().toLowerCase()).filter(Boolean);
  if (!v[0] || !v[1] || !sym.length || !v[3]) return alert('Fill in all four fields.');
  act(async () => { await api('dis', 'POST', { records: [{ crop: v[0], name: v[1], sym, fix: v[3] }] }); await refresh(); V.data(); });
}
function delRecord(i) { act(async () => { await api('dis/' + i, 'DELETE'); await refresh(); V.data(); }); }

/* ===== start ===== */
enter();