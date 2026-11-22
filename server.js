// AgriVerse AI backend — plain Node.js, no packages to install.
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), crypto = require('crypto');

// Farm-outline maths. IMPORTANT: script.js has an identical copy (FarmGeo), so sizes match on screen and when saved.
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

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');
const PUBLIC = path.join(__dirname, 'public');

// The "database" is one JSON file next to this script.
let db = { users: [], sessions: {}, products: [], orders: [], apps: [], extraDis: [] };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch { /* first run */ }
// Default credit offers, and tidy up records saved by older versions
if (!db.offers || !db.offers.length) db.offers = [
  { id: 1, username: '', name: 'GreenSeed Fund', max: 50000, rate: '8%', term: '12 months' },
  { id: 2, username: '', name: 'Highland Agri Investors', max: 150000, rate: '10%', term: '18 months' },
  { id: 3, username: '', name: 'Harvest Partners', max: 300000, rate: '12%', term: '24 months' }
];
db.apps.forEach((a, i) => {
  if (!a.id) a.id = Date.now() + i;
  if (!a.farmerName) { const u = db.users.find(x => x.username === a.username); a.farmerName = u ? u.name : a.username; }
  if (a.investor === undefined) a.investor = '';
  if (a.status === 'Sent to investor') a.status = 'Pending';
});

// Orders saved by older versions had no id or status: give them both
db.plantings = db.plantings || [];
db.audit = db.audit || []; // admin actions
db.orders.forEach((o, i) => { if (!o.id) o.id = Date.now() + i; if (!o.status) o.status = 'Pending'; if (!o.history) o.history = { Pending: o.date || '' }; });

const persist = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 1));

// ----- login/register rate limiting -----
const fails = new Map(); // ip -> { n: count, t: last attempt time }

function checkRateLimit(ip) {
  const f = fails.get(ip) || { n: 0, t: 0 };
  if (Date.now() - f.t > 60000) f.n = 0; // reset after 1 minute of no attempts
  if (f.n >= 5) fail(429, 'Too many attempts. Wait 1 minute and try again.');
  return f;
}
function recordFail(ip, f) {
  fails.set(ip, { n: f.n + 1, t: Date.now() });
}
function recordSuccess(ip) {
  fails.delete(ip);
}

// ----- weather (Open-Meteo, no API key needed) -----
const WCODE = { 0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm' };

function fetchWeather(lat, lon) {
  return new Promise((resolve, reject) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=auto&forecast_days=5`;
    https.get(url, r => {
      let raw = '';
      r.on('data', c => raw += c);
      r.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('Bad response from weather service.')); }
      });
    }).on('error', () => reject(new Error('Could not reach the weather service.')));
  });
}

const ROLES = ['farmer', 'buyer', 'scientist', 'investor'];
// Public trust numbers for each farmer, worked out from delivered and rated orders
function farmerStats() {
  const out = {};
  db.users.filter(u => u.role === 'farmer').forEach(u => {
    const mine = db.orders.filter(o => o.farmer === u.username);
    const rated = mine.filter(o => o.rating);
    out[u.username] = {
      delivered: mine.filter(o => o.status === 'Delivered').length,
      count: rated.length,
      avg: rated.length ? Math.round(rated.reduce((t, o) => t + o.rating.stars, 0) / rated.length * 10) / 10 : 0,
      reviews: rated.slice(-10).reverse().map(o => ({ buyerName: o.buyerName, item: o.name, stars: o.rating.stars, comment: o.rating.comment, date: o.rating.date }))
    };
  });
  return out;
}
// farmArea (hectares) is shown to everyone; the exact outline is private to its owner.
const pub = u => ({ username: u.username, name: u.name, role: u.role, farm: u.farm, location: u.location, crops: u.crops, status: u.status, farmArea: u.farmArea || 0 });
const pubMe = u => Object.assign(pub(u), { farmShape: u.farmShape || null });
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
const clean = (v, n = 200) => String(v ?? '').trim().slice(0, n);
const fail = (code, error) => { const e = new Error(error); e.code = code; throw e; };

function newSession(username) {
  const t = crypto.randomBytes(24).toString('hex');
  db.sessions[t] = username;
  return t;
}
function authUser(req, roles) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  const name = t && db.sessions[t]; // no token, or an unknown token, means not logged in
  const u = name && db.users.find(x => x.username === name);
  if (!u) fail(401, 'Please log in again.');
  if (u.suspended) fail(403, 'This account has been suspended.');
  if (roles && !roles.includes(u.role)) fail(403, 'Your account type cannot do this.');
  return u;
}

const suspendedNames = () => new Set(db.users.filter(u => u.suspended).map(u => u.username));

// Everything the admin dashboard shows (never includes passwords or hashes)
function adminOverview() {
  const sum = (arr, f) => arr.reduce((t, x) => t + (Number(f(x)) || 0), 0);
  const count = (arr, f) => arr.reduce((o, x) => { const k = f(x); o[k] = (o[k] || 0) + 1; return o; }, {});
  const delivered = db.orders.filter(o => o.status === 'Delivered');
  const open = db.orders.filter(o => o.status === 'Pending' || o.status === 'Accepted');
  const rated = db.orders.filter(o => o.rating);
  const farms = db.users.filter(u => u.farmArea > 0);
  const credit = db.apps.filter(a => a.type === 'Credit'), ins = db.apps.filter(a => a.type === 'Insurance');
  return {
    stats: {
      users: db.users.length, byRole: count(db.users, u => u.role), suspended: db.users.filter(u => u.suspended).length,
      products: db.products.length, inStock: db.products.filter(p => p.qty > 0).length,
      orders: db.orders.length, byStatus: count(db.orders, o => o.status),
      salesDelivered: sum(delivered, o => o.total), openValue: sum(open, o => o.total),
      ratings: rated.length, avgRating: rated.length ? Math.round(sum(rated, o => o.rating.stars) / rated.length * 10) / 10 : 0,
      plantings: db.plantings.length, farmsDrawn: farms.length, hectares: Math.round(sum(farms, u => u.farmArea) * 100) / 100,
      creditByStatus: count(credit, a => a.status), creditApprovedTotal: sum(credit.filter(a => a.status === 'Approved'), a => a.amount),
      insurancePolicies: ins.length, claimsPending: ins.filter(a => a.status === 'Claim pending').length,
      offers: db.offers.length, datasetRecords: db.extraDis.length
    },
    users: db.users.map(u => ({ username: u.username || '', email: u.email || '', name: u.name || '', role: u.role, farm: u.farm || '', location: u.location || '', farmArea: u.farmArea || 0, joined: u.joined || '', suspended: !!u.suspended })),
    products: db.products.map(p => ({ id: p.id, name: p.name, owner: p.username, farmerName: p.farmerName, qty: p.qty, unit: p.unit, price: p.price, loc: p.loc })),
    orders: db.orders.slice(-500).reverse().map(o => ({ id: o.id, date: o.date, buyer: o.buyer, farmer: o.farmer, item: o.qty + ' ' + o.unit + ' ' + o.name, total: o.total, status: o.status, rating: o.rating ? o.rating.stars : 0 })),
    audit: db.audit.slice(-30).reverse()
  };
}

// ----- API routes -----
function route(req, url, body) {
  const m = req.method, p = url.pathname;

  if (m === 'POST' && p === '/api/register') {
    const ip = req.socket.remoteAddress;
    const f = checkRateLimit(ip);
    const username = clean(body.username).toLowerCase(), name = clean(body.name, 80);
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { recordFail(ip, f); fail(400, 'Choose a username: 3-20 letters, numbers or underscores, no spaces.'); }
    if (!name) { recordFail(ip, f); fail(400, 'Enter your name.'); }
    if (String(body.password || '').length < 6) { recordFail(ip, f); fail(400, 'Password needs 6 or more characters.'); }
    if (!ROLES.includes(body.role)) { recordFail(ip, f); fail(400, 'Choose an account type.'); }
    if (db.users.find(u => u.username === username)) { recordFail(ip, f); fail(409, 'This username is already taken. Log in instead.'); }
    recordSuccess(ip);
    const salt = crypto.randomBytes(16).toString('hex');
    db.users.push({ username, name, role: body.role, salt, hash: hashPw(body.password, salt), farm: '', location: '', crops: '', status: '', joined: new Date().toISOString().slice(0, 10) });
    const token = newSession(username); persist();
    return { token };
  }

  if (m === 'POST' && p === '/api/login') {
    const ip = req.socket.remoteAddress;
    const f = checkRateLimit(ip);
    const username = clean(body.username).toLowerCase();
    const u = db.users.find(x => x.username === username);
    if (!u || hashPw(String(body.password || ''), u.salt) !== u.hash) {
      recordFail(ip, f);
      fail(401, 'Wrong username or password.');
    }
    if (u.suspended) fail(403, 'This account has been suspended. Please contact the administrator.');
    if (u.role !== body.role) { recordFail(ip, f); fail(400, 'This is a ' + u.role + ' account. Select "' + u.role + '" above.'); }
    recordSuccess(ip);
    const token = newSession(username); persist();
    return { token };
  }

  const me = authUser(req);

  // ----- Admin (platform owner only): overview, suspend accounts, remove listings -----
  if (p.startsWith('/api/admin/')) {
    authUser(req, ['admin']);
    const logAction = text => { db.audit.push({ date: new Date().toISOString().slice(0, 16).replace('T', ' '), admin: me.username, text }); db.audit = db.audit.slice(-300); };
    if (m === 'GET' && p === '/api/admin/overview') return adminOverview();
    const au = p.match(/^\/api\/admin\/user\/([a-z0-9_]{3,20})\/suspend$/);
    if (m === 'POST' && au) {
      const u = db.users.find(q => q.username === au[1]);
      if (!u) fail(404, 'User not found.');
      if (u.role === 'admin') fail(400, 'Admin accounts cannot be suspended here.');
      u.suspended = !!body.suspended;
      if (u.suspended) Object.keys(db.sessions).forEach(t => { if (db.sessions[t] === u.username) delete db.sessions[t]; });
      logAction((u.suspended ? 'Suspended ' : 'Reactivated ') + u.username);
      persist(); return { ok: true };
    }
    const ap = p.match(/^\/api\/admin\/product\/(\d+)\/remove$/);
    if (m === 'POST' && ap) {
      const pr = db.products.find(q => q.id === Number(ap[1]));
      if (!pr) fail(404, 'Listing not found.');
      db.products = db.products.filter(q => q !== pr);
      logAction('Removed listing "' + pr.name + '" by ' + pr.username);
      persist(); return { ok: true };
    }
    fail(404, 'Unknown admin action.');
  }

  if (m === 'GET' && p === '/api/state') {
    return {
      user: pubMe(me),
      users: db.users.filter(u => u.role === 'farmer' && u.username && !u.suspended).map(pub),
      farmerStats: farmerStats(),
      products: db.products.filter(p => !suspendedNames().has(p.username)),
      orders: db.orders.filter(o => o.buyer === me.username || o.farmer === me.username),
      plantings: db.plantings.filter(p => p.username === me.username),
      apps: db.apps.filter(a => me.role === 'investor' ? (a.type === 'Insurance' || a.investor === '' || a.investor === me.username) : a.username === me.username),
      offers: db.offers,
      extraDis: db.extraDis
    };
  }

  if (m === 'POST' && p === '/api/farm-boundary') {
    authUser(req, ['farmer']);
    const raw = body.points;
    if (Array.isArray(raw) && raw.length === 0) { // empty list = remove the saved outline
      delete me.farmShape; me.farmArea = 0;
      persist(); return { ok: true, farmArea: 0 };
    }
    if (!Array.isArray(raw) || raw.length < 3 || raw.length > 200) fail(400, 'Outline your field with 3 to 200 corners.');
    const shape = raw.map(pt => {
      const lat = Array.isArray(pt) ? Number(pt[0]) : NaN, lng = Array.isArray(pt) ? Number(pt[1]) : NaN;
      if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) fail(400, 'One of the corners is not a real map position.');
      return [Math.round(lat * 1e6) / 1e6, Math.round(lng * 1e6) / 1e6];
    });
    if (FarmGeo.selfIntersects(shape)) fail(400, 'The lines of your outline cross each other. Fix the corners and try again.');
    const ha = FarmGeo.toHa(FarmGeo.areaM2(shape));
    if (!(ha > 0)) fail(400, 'That outline has no area. Spread the corners out.');
    if (ha > 100000) fail(400, 'That area is too large to be one farm. Check the corners.');
    me.farmShape = shape; me.farmArea = Math.round(ha * 100) / 100; // hectares, 2 decimals
    persist(); return { ok: true, farmArea: me.farmArea };
  }

  if (m === 'POST' && p === '/api/profile') {
    me.name = clean(body.name, 80) || me.name;
    me.farm = clean(body.farm); me.location = clean(body.location); me.crops = clean(body.crops); me.status = clean(body.status, 300);
    persist(); return { ok: true };
  }

  if (m === 'POST' && p === '/api/products') {
    authUser(req, ['farmer']);
    const qty = Number(body.qty), price = Number(body.price), name = clean(body.name, 80);
    if (!name || !(qty >= 1) || !(price >= 1)) fail(400, 'Enter the product name, quantity and price.');
    db.products.push({ id: Date.now(), username: me.username, farmerName: me.name, name, qty, unit: clean(body.unit, 20) || 'kg', price, loc: clean(body.loc) || 'Not given' });
    persist(); return { ok: true };
  }
  let x = p.match(/^\/api\/products\/(\d+)$/);
  if (m === 'DELETE' && x) {
    authUser(req, ['farmer']);
    db.products = db.products.filter(pr => !(pr.id === Number(x[1]) && pr.username === me.username));
    persist(); return { ok: true };
  }

  if (m === 'POST' && p === '/api/buy') {
    authUser(req, ['buyer']);
    const pr = db.products.find(q => q.id === Number(body.id)), n = Number(body.qty);
    if (!pr || suspendedNames().has(pr.username)) fail(404, 'That product is no longer available.');
    if (!(n >= 1) || n > pr.qty) fail(400, 'Choose a quantity between 1 and ' + pr.qty + '.');
    pr.qty -= n;
    const total = n * pr.price;
    const date = new Date().toLocaleDateString();
    db.orders.push({ id: Date.now(), productId: pr.id, buyer: me.username, buyerName: me.name, farmer: pr.username, farmerName: pr.farmerName, name: pr.name, unit: pr.unit, qty: n, total, date, status: 'Pending', history: { Pending: date } });
    persist(); return { total };
  }

  // Planting calendar: each farmer keeps a list of plantings; the browser works out the task dates and reminders.
  const CROPS = ['Teff', 'Maize', 'Wheat', 'Barley', 'Sorghum', 'Beans', 'Chickpea', 'Onion', 'Tomato', 'Potato', 'Cabbage', 'Pepper'];
  if (m === 'POST' && p === '/api/plantings') {
    authUser(req, ['farmer']);
    const crop = clean(body.crop, 40), d = String(body.date || ''), dt = new Date(d + 'T00:00:00');
    const real = dt.toDateString() !== 'Invalid Date' && d === dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); // rejects 31 Feb etc.
    if (!CROPS.includes(crop)) fail(400, 'Choose a crop from the list.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !real || Math.abs(dt - Date.now()) > 400 * 864e5) fail(400, 'Choose a valid planting date (within one year of today).');
    if (db.plantings.filter(q => q.username === me.username).length >= 60) fail(400, 'You have too many plantings. Remove old ones first.');
    db.plantings.push({ id: Date.now(), username: me.username, crop, date: d, field: clean(body.field, 40), done: [] });
    persist(); return { ok: true };
  }
  x = p.match(/^\/api\/plantings\/(\d+)\/(task|remove)$/);
  if (m === 'POST' && x) {
    authUser(req, ['farmer']);
    const pl = db.plantings.find(q => q.id === Number(x[1]));
    if (!pl || pl.username !== me.username) fail(404, 'Planting not found.');
    if (x[2] === 'remove') db.plantings = db.plantings.filter(q => q !== pl);
    else {
      const i = Number(body.index);
      if (!Number.isInteger(i) || i < 0 || i > 20) fail(400, 'Unknown task.');
      pl.done = (pl.done || []).filter(n => n !== i);
      if (body.done) pl.done.push(i);
    }
    persist(); return { ok: true };
  }

  // A buyer can rate the farmer once, after the order is delivered.
  x = p.match(/^\/api\/orders\/(\d+)\/rate$/);
  if (m === 'POST' && x) {
    authUser(req, ['buyer']);
    const o = db.orders.find(q => q.id === Number(x[1]));
    if (!o || o.buyer !== me.username) fail(403, 'This is not your order.');
    if (o.status !== 'Delivered') fail(400, 'You can rate the farmer after the order is delivered.');
    if (o.rating) fail(400, 'You already rated this order.');
    const stars = Number(body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) fail(400, 'Choose 1 to 5 stars.');
    o.rating = { stars, comment: clean(body.comment, 200), date: new Date().toLocaleDateString() };
    persist(); return { ok: true };
  }

  // After an order is accepted, the buyer and the farmer can each share contact details with the other.
  x = p.match(/^\/api\/orders\/(\d+)\/contact$/);
  if (m === 'POST' && x) {
    const o = db.orders.find(q => q.id === Number(x[1]));
    if (!o) fail(404, 'Order not found.');
    const isBuyer = o.buyer === me.username, isFarmer = o.farmer === me.username;
    if (!isBuyer && !isFarmer) fail(403, 'This is not your order.');
    if (o.status !== 'Accepted') fail(400, 'You can share contact details only while the order is accepted and not yet delivered.');
    const phone = clean(body.phone, 25), note = clean(body.note, 200);
    if (!/^[0-9+\-() ]{6,25}$/.test(phone)) fail(400, 'Enter a valid phone number (digits, +, - and spaces only).');
    if (!note) fail(400, isBuyer ? 'Enter your delivery address or a note for the farmer.' : 'Enter the pickup place or a note for the buyer.');
    o[isBuyer ? 'buyerContact' : 'farmerContact'] = { phone, note, date: new Date().toLocaleDateString() };
    persist(); return { ok: true };
  }

  // Order status flow: Pending -> Accepted -> Delivered. Pending orders can also be Declined (farmer) or Cancelled (buyer).
  x = p.match(/^\/api\/orders\/(\d+)\/(accept|decline|deliver|cancel)$/);
  if (m === 'POST' && x) {
    const o = db.orders.find(q => q.id === Number(x[1]));
    if (!o) fail(404, 'Order not found.');
    const act = x[2], byFarmer = act !== 'cancel';
    authUser(req, [byFarmer ? 'farmer' : 'buyer']);
    if ((byFarmer ? o.farmer : o.buyer) !== me.username) fail(403, 'This is not your order.');
    const from = act === 'deliver' ? 'Accepted' : 'Pending';
    if (o.status !== from) fail(400, 'This order is already ' + o.status.toLowerCase() + '.');
    o.status = { accept: 'Accepted', decline: 'Declined', deliver: 'Delivered', cancel: 'Cancelled' }[act];
    o.history = o.history || {}; o.history[o.status] = new Date().toLocaleDateString();
    if (o.status === 'Declined' || o.status === 'Cancelled') { // put the stock back on the market
      const pr = db.products.find(q => q.id === o.productId);
      if (pr) pr.qty += o.qty;
    }
    persist(); return { ok: true, status: o.status };
  }

  if (m === 'POST' && p === '/api/apps') {
    authUser(req, ['farmer']);
    const date = new Date().toLocaleDateString();
    if (body.type === 'Insurance') {
      db.apps.push({ id: Date.now(), type: 'Insurance', username: me.username, farmerName: me.name, investor: '', title: clean(body.title, 80), detail: clean(body.detail, 200), date, status: 'Active' });
    } else {
      const o = db.offers.find(q => q.id === Number(body.offerId)), amount = Number(body.amount), purpose = clean(body.purpose);
      if (!o) fail(404, 'That offer no longer exists.');
      if (!(amount >= 1000) || amount > o.max || !purpose) fail(400, 'Enter an amount between 1,000 and ' + o.max + ' ETB and what it is for.');
      db.apps.push({ id: Date.now(), type: 'Credit', username: me.username, farmerName: me.name, investor: o.username, title: o.name, detail: amount.toLocaleString() + ' ETB for ' + purpose, amount, date, status: 'Pending' });
    }
    persist(); return { ok: true };
  }
  x = p.match(/^\/api\/apps\/(\d+)\/(claim|decide|claim-decide)$/);
  if (m === 'POST' && x) {
    const a = db.apps.find(q => q.id === Number(x[1]));
    if (!a) fail(404, 'Not found.');
    if (x[2] === 'claim') {
      authUser(req, ['farmer']);
      if (a.username !== me.username || a.type !== 'Insurance' || a.claim) fail(400, 'You cannot file a claim on this policy.');
      if (!clean(body.reason)) fail(400, 'Describe what happened.');
      a.claim = { reason: clean(body.reason, 300), date: new Date().toLocaleDateString() };
      a.status = 'Claim pending';
    } else {
      authUser(req, ['investor']);
      const ok = body.decision === 'approve';
      if (x[2] === 'decide') {
        if (a.type !== 'Credit' || a.status !== 'Pending' || (a.investor && a.investor !== me.username)) fail(400, 'You cannot decide this request.');
        a.status = ok ? 'Approved' : 'Rejected';
      } else {
        if (a.type !== 'Insurance' || a.status !== 'Claim pending') fail(400, 'There is no pending claim here.');
        a.status = ok ? 'Claim approved' : 'Claim rejected';
      }
      a.note = clean(body.note, 200); a.decidedBy = me.name;
    }
    persist(); return { ok: true };
  }
  if (m === 'POST' && p === '/api/offers') {
    authUser(req, ['investor']);
    const max = Number(body.max), name = clean(body.name, 60);
    if (!name || !(max >= 1000)) fail(400, 'Enter a name and a maximum amount of at least 1,000 ETB.');
    db.offers.push({ id: Date.now(), username: me.username, name, max, rate: clean(body.rate, 20) || '10%', term: clean(body.term, 30) || '12 months' });
    persist(); return { ok: true };
  }
  x = p.match(/^\/api\/offers\/(\d+)$/);
  if (m === 'DELETE' && x) {
    authUser(req, ['investor']);
    db.offers = db.offers.filter(o => !(o.id === Number(x[1]) && o.username === me.username));
    persist(); return { ok: true };
  }

  if (m === 'POST' && p === '/api/dis') {
    authUser(req, ['scientist']);
    const recs = (Array.isArray(body.records) ? body.records : []).slice(0, 2000);
    for (const r of recs) {
      const sym = (Array.isArray(r.sym) ? r.sym : []).map(s => clean(s, 40).toLowerCase()).filter(Boolean);
      if (clean(r.crop) && clean(r.name) && sym.length && clean(r.fix, 500)) db.extraDis.push({ crop: clean(r.crop, 40), name: clean(r.name, 80), sym, fix: clean(r.fix, 500), by: me.name });
    }
    persist(); return { ok: true };
  }
  x = p.match(/^\/api\/dis\/(\d+)$/);
  if (m === 'DELETE' && x) {
    authUser(req, ['scientist']);
    db.extraDis.splice(Number(x[1]), 1);
    persist(); return { ok: true };
  }

  fail(404, 'Not found');
}

// ----- web server -----
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/api/weather') {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    if (!db.sessions[t]) { res.writeHead(401, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'Please log in again.' })); }
    const lat = Number(url.searchParams.get('lat')), lon = Number(url.searchParams.get('lon'));
    if (!isFinite(lat) || !isFinite(lon)) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'Missing location.' })); }
    fetchWeather(lat, lon).then(w => {
      const out = {
        now: { temp: w.current.temperature_2m, wind: w.current.wind_speed_10m, humidity: w.current.relative_humidity_2m, cond: WCODE[w.current.weathercode] || 'Unknown' },
        days: w.daily.time.map((d, i) => ({ date: d, max: w.daily.temperature_2m_max[i], min: w.daily.temperature_2m_min[i], rain: w.daily.precipitation_probability_max[i], cond: WCODE[w.daily.weathercode[i]] || 'Unknown' }))
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
    }).catch(e => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 3e6) req.destroy(); });
    req.on('end', () => {
      let out, code = 200;
      try { out = route(req, url, raw ? JSON.parse(raw) : {}); }
      catch (e) { code = e.code || 500; out = { error: e.code ? e.message : 'Server error' }; if (!e.code) console.error(e); }
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
    });
    return;
  }
  const file = path.join(PUBLIC, url.pathname === '/' ? 'index.html' : path.normalize(url.pathname));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    // no-cache = the browser always asks the server first (cheap 304s), so updates to the app and sw.js are picked up
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => console.log('AgriVerse AI is running. Open http://localhost:' + PORT));