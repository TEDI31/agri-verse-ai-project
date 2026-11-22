// New Farmer Lessons — adds a tab to the farmer dashboard.
// This file loads AFTER script.js, so script.js does not need to change.
NAV.farmer.splice(1, 0, ['lessons', 'New Farmer Lessons']);

/* ===== lesson content (edit the words here) ===== */
const LESSONS = [
  { s: 'seasons', t: 'Know your seasons',
    intro: 'Farming is about timing. In Ethiopia the year has four seasons, and planting at the right time matters more than almost anything else.',
    pts: ['Kiremt (June to September): the main rainy season. Sow teff, maize, sorghum and wheat at the start of the rains, in June or July.',
      'Tsedey / Meher (October to November): harvest time. Cut, dry and thresh your crops while the weather is dry.',
      'Bega (December to February): the dry season. Prepare land, repair terraces and grow vegetables with irrigation.',
      'Belg (March to May): the short rains. Sow quick crops such as barley, beans and peas, and maize in places that get Belg rain.'],
    tip: 'Timing is different in each region and altitude. Ask your local agriculture office and check the weather forecast before you sow.',
    cap: 'The sun travels around the four seasons. The blue part is the main rain.',
    q: 'Which season brings the main rains?', o: ['Bega', 'Kiremt', 'Tsedey'], a: 1 },

  { s: 'soil', t: 'Understand your soil',
    intro: 'Soil is alive. Healthy soil grows healthy crops, so learn what is under your feet before you plant.',
    pts: ['Topsoil is the dark top layer. It holds most nutrients and almost all roots. Protect it from erosion.',
      'Feel test: rub moist soil between your fingers. Sandy soil feels gritty and drains fast, clay feels sticky and holds water, and loam (the best) feels soft and crumbles.',
      'Most crops like a soil pH of 6 to 7. Test your soil every 2 to 3 years at your agriculture office.',
      'Add compost or manure every season to feed the soil and help it hold water.'],
    tip: 'Never leave soil bare. Cover it with crops, mulch or crop residue.',
    cap: 'A cross-section of soil. Roots feed in the dark topsoil.',
    q: 'Which layer holds most of the nutrients?', o: ['Topsoil', 'Bedrock', 'Subsoil'], a: 0 },

  { s: 'seed', t: 'Choose and plant good seed',
    intro: 'Good seed is the cheapest way to increase your harvest.',
    pts: ['Buy certified seed from a trusted supplier and choose a variety that suits your altitude and rainfall.',
      'Test germination first: sprout 20 seeds in a damp cloth for a few days. If 17 or more sprout, the seed is good.',
      'Plant at a depth of about 2 to 3 times the size of the seed. If it is too deep it cannot reach the surface.',
      'Plant in rows with the right spacing. It makes weeding and spraying easy and gives every plant room to grow.',
      'Sow when the soil is wet 10 to 15 cm deep after the first good rains.'],
    tip: 'Keep seed dry and cool before planting. Never plant seed that smells mouldy.',
    cap: 'A seed grows a root first, then a shoot, then leaves.',
    q: 'Out of 20 test seeds, how many should sprout?', o: ['At least 17', 'About 10', 'Only 5'], a: 0 },

  { s: 'water', t: 'Water your crops the right way',
    intro: 'Too little water stunts crops and too much drowns the roots. Learn to give the right amount at the right time.',
    pts: ['Water early in the morning or in the evening, so less water evaporates.',
      'Water the soil at the base of the plant, not the leaves. Wet leaves invite disease.',
      'Water deeply and less often, so the roots grow deep and strong.',
      'Mulch with straw or dry grass to keep the soil moist and cool.',
      'Crops need the most water at flowering and when the grain or fruit is filling.',
      'Drip irrigation saves 30 to 50 percent of the water compared with flooding the field.'],
    tip: 'Too little water: leaves droop and curl. Too much water: leaves turn yellow and the soil smells sour.',
    cap: 'Drops fall near the roots and the soil darkens as it gets moist.',
    q: 'When is the best time to water?', o: ['In the midday sun', 'Early morning or evening', 'Any time, it is the same'], a: 1 },

  { s: 'npk', t: 'Feed your crops (N, P and K)',
    intro: 'Plants eat too. The three main foods are nitrogen, phosphorus and potassium.',
    pts: ['Nitrogen (N) makes green leaves and fast growth. Sources: urea, manure, compost, and beans grown in rotation.',
      'Phosphorus (P) builds strong roots and helps early growth. Sources: DAP and bone meal. Apply at planting.',
      'Potassium (K) helps plants resist disease and drought. Sources: potash, wood ash and compost.',
      'Pale yellow older leaves usually mean a lack of nitrogen. Purple leaves mean a lack of phosphorus. Brown, scorched leaf edges mean a lack of potassium.',
      'Apply DAP at planting and urea 3 to 5 weeks later, when the soil is moist.'],
    tip: 'More is not better. Too much fertilizer burns plants and wastes money. Compost is always safe.',
    cap: 'Green N, orange P and purple K circle the plant.',
    q: 'Purple leaves usually mean a lack of what?', o: ['Nitrogen', 'Phosphorus', 'Water'], a: 1 },

  { s: 'disease', t: 'Signs of sick crops',
    intro: 'Catching a sick plant early can save your whole field. Walk through your field every week and look closely.',
    pts: ['Leaf color: yellow, pale, purple or bronze leaves are a warning.',
      'Spots and patches: brown, black or ringed spots can be fungus or bacteria.',
      'Powder or mould: white powder is mildew, orange powder is rust, fuzzy grey growth is mould.',
      'Holes and chewing: caterpillars, beetles or grasshoppers. Look under the leaves too.',
      'Sticky leaves, curling or tiny insects: aphids or whiteflies.',
      'Wilting in wet soil, stunted plants or rotting stems: root or stem disease.',
      'What to do: remove badly sick plants, keep tools clean, do not walk through wet fields, and treat early.'],
    tip: 'Take a close photo, write down what you see, then use the Disease Check tab in this dashboard. One sick plant is a signal. Many sick plants mean act now.',
    cap: 'Watch one plant go from healthy to wilting, stage by stage.',
    q: 'White powder on leaves is most likely what?', o: ['Powdery mildew', 'A water shortage', 'Extra fertilizer'], a: 0 },

  { s: 'pests', t: 'Control weeds and pests',
    intro: 'Weeds and insects compete with your crop. A little attention every week prevents big losses.',
    pts: ['Weeds steal water and food, mostly in the first 6 weeks. Weed at 2 to 3 weeks and again at 5 to 6 weeks.',
      'Pull weeds before they make seed. Mulch stops many weeds from growing.',
      'Scout weekly: check under leaves and inside the maize whorl for eggs and caterpillars.',
      'Try natural control first: neem spray, soapy water for aphids, traps and crop rotation.',
      'If you use chemicals, wear gloves and a mask, follow the dose on the label, spray in calm weather, and keep them away from children and water.',
      'Rotate crops every season to break pest and disease cycles.'],
    tip: 'Healthy, well-fed plants resist pests better.',
    cap: 'The magnifier scouts the plant. Small colonies grow fast if nobody looks.',
    q: 'How often should you scout your field?', o: ['Once a year', 'Every week', 'Only at harvest'], a: 1 },

  { s: 'harvest', t: 'Harvest and store safely',
    intro: 'You grew it, now protect it. Many farmers lose 10 to 30 percent of the harvest after cutting.',
    pts: ['Harvest when the crop is mature: grain is hard, stalks are yellow, onion tops fall over, potato vines die back.',
      'Harvest on a dry morning and handle produce gently to avoid bruises.',
      'Dry grain on a tarp or raised mat until it is 12 to 13 percent moisture. A dry grain cracks when bitten instead of denting.',
      'Store in clean, airtight bags or sealed containers, off the ground and away from rats.',
      'Check every month for weevils and damp. Remove mouldy grain, and never eat it or feed it to animals.',
      'Keep seed for next season in a separate, dry, labelled bag.'],
    tip: 'Airtight storage bags (such as PICS bags) can protect grain for many months without chemicals.',
    cap: 'Sacks stack on a pallet: dry, clean and off the ground.',
    q: 'What moisture level is safe for storing most grain?', o: ['About 12 to 13 percent', 'About 25 percent', 'It does not matter'], a: 0 },

  { s: 'market', t: 'Sell smart and keep records',
    intro: 'A good harvest only pays when you sell it well. Think like a business owner.',
    pts: ['Grade and clean your produce. Better quality gets a better price.',
      'Sell with a group or cooperative to get higher prices and share transport costs.',
      'List your products on the My Market tab with a clear quantity and price, so buyers can find you.',
      'If you need money for seed or fertilizer, look at the Credit & Insurance tab.',
      'Insure your crop against drought, pests and floods, so one bad season does not end your farm.',
      'Keep simple records of costs, yields and sales. After one season you will know which crop earns the most.'],
    tip: 'If you have safe storage, sell some at harvest and keep some for later, when prices usually rise.',
    cap: 'Income grows when you grade, sell in groups and keep records.',
    q: 'What helps you earn a better price?', o: ['Selling dirty, ungraded produce', 'Grading and cleaning your produce', 'Selling only after rain'], a: 1 }
];

/* ===== 3D scenes (one per lesson, built with Three.js) ===== */
const SCENES = {};
const M = (T, c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .75 }, o || {}));
const clamp01 = v => Math.max(0, Math.min(1, v));
function ground(T, g, col, r) {
  const m = new T.Mesh(new T.CylinderGeometry(r || 3, r || 3, .4, 48), M(T, col || 0x5a3b22));
  m.position.y = -.2; g.add(m); return m;
}
function plant(T, g, h, col) {
  h = h || 1.6;
  const stem = new T.Mesh(new T.CylinderGeometry(.05, .07, h, 8), M(T, 0x3f8f3a));
  stem.position.y = h / 2; g.add(stem);
  const leaves = [];
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05, l = new T.Mesh(new T.SphereGeometry(.4, 16, 10), M(T, col || 0x4caf50));
    l.scale.set(1, .12, .45);
    l.position.set(Math.cos(a) * .45, h * .3 + i * h * .1, Math.sin(a) * .45);
    l.rotation.y = -a; l.rotation.z = .2;
    g.add(l); leaves.push(l);
  }
  return { stem, leaves };
}

SCENES.seasons = (T, g, say) => {
  const cols = [0x3b82c4, 0xe0b040, 0xc98a4a, 0x7cc36e];
  const names = ['Kiremt: the main rains (June to September)', 'Tsedey: harvest time (October to November)', 'Bega: the dry season (December to February)', 'Belg: the short rains (March to May)'];
  cols.forEach((c, i) => g.add(new T.Mesh(new T.CylinderGeometry(2.4, 2.4, .5, 32, 1, false, i * Math.PI / 2 + .03, Math.PI / 2 - .06), M(T, c, { side: T.DoubleSide }))));
  const sun = new T.Mesh(new T.SphereGeometry(.35, 20, 16), M(T, 0xffd54a, { emissive: 0xffb300, emissiveIntensity: .8 }));
  g.add(sun);
  const drops = [];
  for (let i = 0; i < 40; i++) {
    const d = new T.Mesh(new T.SphereGeometry(.05, 8, 6), M(T, 0x9ad0ff)), th = Math.random() * Math.PI / 2, r = .4 + Math.random() * 1.9;
    d._p = [Math.sin(th) * r, Math.random() * 2.2, Math.cos(th) * r]; g.add(d); drops.push(d);
  }
  return t => {
    const a = t * .7;
    sun.position.set(Math.sin(a) * 3.1, 1.6, Math.cos(a) * 3.1);
    drops.forEach(d => { d._p[1] -= .03; if (d._p[1] < .3) d._p[1] = 2.2; d.position.set(d._p[0], d._p[1], d._p[2]); });
    say(names[Math.floor(a / (Math.PI / 2)) % 4]);
  };
};

SCENES.soil = (T, g, say) => {
  g.position.y = 1.2;
  const L = [[0x3b2616, .7, 'Topsoil: dark and full of nutrients. Roots feed here.'], [0x8a5a35, .9, 'Subsoil: stores water deeper down.'], [0x8e8e8e, .7, 'Bedrock and stones: very few nutrients.']];
  let y = 0;
  L.forEach(l => {
    const b = new T.Mesh(new T.BoxGeometry(4, l[1], 2.4), M(T, l[0], { transparent: true, opacity: .62 }));
    y -= l[1] / 2; b.position.y = y; y -= l[1] / 2; g.add(b);
  });
  plant(T, g, 1.5);
  const roots = [];
  for (let i = 0; i < 7; i++) {
    const r = new T.Mesh(new T.CylinderGeometry(.012, .03, 1.3, 5), M(T, 0xe8dcc0));
    r.position.set((i - 3) * .22, -.6, 0); r.rotation.z = (i - 3) * .14; g.add(r); roots.push(r);
  }
  return t => {
    roots.forEach((r, i) => { r.scale.y = .85 + Math.sin(t * 1.2 + i) * .08; });
    say(L[Math.floor(t / 2.5) % 3][2]);
  };
};

SCENES.seed = (T, g, say) => {
  ground(T, g, 0x5a3b22, 2.6);
  const seed = new T.Mesh(new T.SphereGeometry(.16, 14, 10), M(T, 0xe9c46a));
  seed.scale.set(1, .7, .7); seed.position.y = .05; g.add(seed);
  const root = new T.Mesh(new T.CylinderGeometry(.015, .03, 1, 6), M(T, 0xf1e6c8)); g.add(root);
  const stem = new T.Mesh(new T.CylinderGeometry(.04, .06, 1, 8), M(T, 0x3f8f3a)); g.add(stem);
  const leaf = [0, 1].map(() => { const l = new T.Mesh(new T.SphereGeometry(.4, 14, 10), M(T, 0x5cc060)); g.add(l); return l; });
  return t => {
    const s = (t % 8) / 8, rg = clamp01(s / .3), sg = clamp01((s - .25) / .45), lf = clamp01((s - .7) / .25);
    root.scale.y = Math.max(.01, rg * 1.1); root.position.y = -root.scale.y / 2;
    stem.scale.y = Math.max(.01, sg * 1.5); stem.position.y = stem.scale.y / 2;
    leaf.forEach((l, i) => {
      l.scale.set(Math.max(.01, lf), .1 * Math.max(.1, lf), Math.max(.01, lf * .45));
      l.position.set((i ? -1 : 1) * .4 * lf, stem.scale.y, 0);
      l.rotation.z = (i ? -1 : 1) * .35;
    });
    say(s < .25 ? '1. The seed rests in moist soil' : s < .45 ? '2. The root grows down first' : s < .7 ? '3. The shoot pushes up toward the light' : '4. The first leaves open');
  };
};

SCENES.water = (T, g, say) => {
  ground(T, g, 0x5a3b22, 2.8);
  const p = plant(T, g, 1.3);
  const wet = new T.Mesh(new T.CircleGeometry(1.3, 32), M(T, 0x1f130a, { transparent: true, opacity: 0 }));
  wet.rotation.x = -Math.PI / 2; wet.position.y = .01; g.add(wet);
  const pipe = new T.Mesh(new T.CylinderGeometry(.06, .06, 4.6, 10), M(T, 0x777777));
  pipe.rotation.z = Math.PI / 2; pipe.position.y = 2.6; g.add(pipe);
  const drops = [];
  for (let i = 0; i < 14; i++) {
    const d = new T.Mesh(new T.SphereGeometry(.07, 8, 6), M(T, 0x6bb8ff, { emissive: 0x2a6fb0 }));
    d.position.x = (i - 6.5) * .3; d.position.z = ((i * 7) % 3 - 1) * .3; g.add(d); drops.push(d);
  }
  const tips = ['Water slowly at the base of the plant', 'Mulch keeps the soil moist for longer', 'Water in the early morning or evening'];
  return t => {
    drops.forEach((d, i) => { d.position.y = 2.5 - ((t * 1.3 + i * .37) % 1) * 2.4; });
    wet.material.opacity = .3 + .2 * Math.sin(t);
    p.leaves.forEach((l, i) => { l.rotation.z = .2 + .08 * Math.sin(t * 2 + i); });
    say(tips[Math.floor(t / 3) % 3]);
  };
};

SCENES.npk = (T, g, say) => {
  ground(T, g, 0x5a3b22, 2.6); plant(T, g, 1.5);
  const defs = [[0x4caf50, 1.6, 1.0, 'N, Nitrogen: green leaves and fast growth'], [0xff9800, 2.1, .8, 'P, Phosphorus: strong roots and early growth'], [0xb06be0, 2.6, .6, 'K, Potassium: resists disease and drought']];
  const orbs = defs.map(d => {
    const o = new T.Mesh(new T.SphereGeometry(.2, 18, 14), M(T, d[0], { emissive: d[0], emissiveIntensity: .45 })); g.add(o);
    const ring = new T.Mesh(new T.TorusGeometry(d[1], .012, 6, 64), M(T, d[0]));
    ring.rotation.x = Math.PI / 2; ring.position.y = 1.1; g.add(ring); return o;
  });
  return t => {
    orbs.forEach((o, i) => {
      const a = t * defs[i][2] + i * 2.1;
      o.position.set(Math.cos(a) * defs[i][1], 1.1 + Math.sin(t * 1.5 + i) * .25, Math.sin(a) * defs[i][1]);
    });
    say(defs[Math.floor(t / 3) % 3][3]);
  };
};

SCENES.disease = (T, g, say) => {
  ground(T, g, 0x5a3b22, 2.6);
  const p = plant(T, g, 1.7);
  const green = new T.Color(0x4caf50), yellow = new T.Color(0xd9c43c), brown = new T.Color(0x7a5a2a);
  const spots = p.leaves.map(l => {
    const s = new T.Mesh(new T.SphereGeometry(.16, 8, 6), M(T, 0x3a2410));
    s.position.set(.2, .32, .05); s.scale.set(0, 0, 0); l.add(s); return s;
  });
  return t => {
    const s = (t % 14) / 14, y = clamp01((s - .2) / .25), sp = clamp01((s - .45) / .2), w = clamp01((s - .7) / .25);
    p.leaves.forEach((l, i) => {
      l.material.color.copy(green).lerp(yellow, y).lerp(brown, w);
      l.rotation.z = .2 - w;
      spots[i].scale.setScalar(sp);
    });
    say(s < .2 ? 'Healthy: even green leaves, standing upright' : s < .45 ? 'Warning: the leaves turn yellow' : s < .7 ? 'Danger: spots, holes or powder appear' : 'Late: the plant wilts and droops');
  };
};

SCENES.pests = (T, g, say) => {
  ground(T, g, 0x5a3b22, 2.6);
  const p = plant(T, g, 1.7), bugs = [];
  for (let i = 0; i < 16; i++) {
    const b = new T.Mesh(new T.SphereGeometry(.06, 8, 6), M(T, 0xc0392b)), l = p.leaves[i % 6], k = .8 + (i % 3) * .15;
    b.position.set(l.position.x * k, l.position.y + .08, l.position.z * k); b.scale.setScalar(0); g.add(b); bugs.push(b);
  }
  const lens = new T.Mesh(new T.TorusGeometry(.35, .045, 10, 32), M(T, 0xe9c46a, { emissive: 0x6b4e00, emissiveIntensity: .4 }));
  const handle = new T.Mesh(new T.CylinderGeometry(.04, .04, .6, 8), M(T, 0xe9c46a));
  handle.position.set(.25, -.4, 0); handle.rotation.z = .6; lens.add(handle); g.add(lens);
  return t => {
    const k = clamp01((t % 10) / 6), a = t * .9;
    bugs.forEach((b, i) => b.scale.setScalar(i < k * 16 ? 1 : 0));
    lens.position.set(Math.cos(a) * .9, 1.1 + Math.sin(a * 1.3) * .35, Math.sin(a) * .9);
    say(k < .3 ? 'A few bugs: easy to stop if you find them now' : k < .7 ? 'The colony is growing fast' : 'A heavy attack. Weekly scouting prevents this');
  };
};

SCENES.harvest = (T, g, say) => {
  const pallet = new T.Mesh(new T.BoxGeometry(4, .2, 2.2), M(T, 0x8b5a2b)); pallet.position.y = .1; g.add(pallet);
  const pos = [[-1.2, 0], [0, 0], [1.2, 0], [-.6, 1], [.6, 1], [0, 2]], sacks = [];
  pos.forEach(q => {
    const s = new T.Mesh(new T.BoxGeometry(1.05, .75, 1.5), M(T, 0xd9b77e));
    s._y = .575 + q[1] * .76; s.position.set(q[0], s._y, 0); g.add(s); sacks.push(s);
  });
  return t => {
    const u = t % 10;
    sacks.forEach((s, i) => { s.visible = u > i * .9; s.position.y = s._y + (1 - clamp01((u - i * .9) / .5)) * 3; });
    say(u < 2.5 ? 'Dry grain to 12 to 13 percent moisture' : u < 5 ? 'Use clean, airtight bags' : u < 7.5 ? 'Stack on a pallet, off the ground' : 'Check for weevils every month');
  };
};

SCENES.market = (T, g, say) => {
  ground(T, g, 0x2e5d38, 3.4);
  const bars = [.8, 1.2, 1.7, 2.1, 2.7].map((h, i) => {
    const b = new T.Mesh(new T.BoxGeometry(.6, 1, .6), M(T, new T.Color().setHSL(.33 - i * .04, .55, .5)));
    b._h = h; b.position.x = (i - 2) * .85; g.add(b); return b;
  });
  const coin = new T.Group(), disk = new T.Mesh(new T.CylinderGeometry(.38, .38, .08, 32), M(T, 0xffc83d, { emissive: 0x8a6500, emissiveIntensity: .5, metalness: .6 }));
  disk.rotation.x = Math.PI / 2; coin.add(disk); g.add(coin);
  const tips = ['Grade and clean your produce', 'Sell in a group for better prices', 'List your harvest on My Market', 'Keep records to see your profit'];
  return t => {
    const u = t % 8;
    bars.forEach((b, i) => { const k = clamp01(u / 1.2 - i * .2); b.scale.y = Math.max(.01, b._h * k); b.position.y = b.scale.y / 2; });
    coin.position.set(1.7, 3.3 + Math.sin(t * 2) * .15, 0); coin.rotation.y = t * 3;
    say(tips[Math.floor(t / 2) % 4]);
  };
};

/* ===== 3D engine: starts a scene only while it is on screen ===== */
function lsStart(c) {
  const label = c.parentNode.querySelector('.ls-say');
  if (!window.THREE) { label.textContent = 'The 3D view needs an internet connection the first time.'; return; }
  const T = THREE, r = new T.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  const s = new T.Scene(), cam = new T.PerspectiveCamera(45, 1, .1, 100);
  cam.position.set(0, 2.6, 8); cam.lookAt(0, .7, 0);
  s.add(new T.AmbientLight(0xffffff, .75));
  const d = new T.DirectionalLight(0xffffff, .9); d.position.set(4, 7, 5); s.add(d);
  const g = new T.Group(); s.add(g);
  let last = '';
  const say = x => { if (x !== last) { last = x; label.textContent = x; } };
  const tick = SCENES[c.dataset.scene](T, g, say);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mx = 0, t = 0, vis = false, run = false, w = 0, h = 0;
  c.addEventListener('pointermove', e => { const b = c.getBoundingClientRect(); mx = (e.clientX - b.left) / b.width - .5; });
  function loop() {
    if (!vis) { run = false; return; }
    requestAnimationFrame(loop);
    if (c.clientWidth !== w || c.clientHeight !== h) { w = c.clientWidth; h = c.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    if (!reduce) t += .016;
    g.rotation.y = t * .18 + mx * 1.8;
    tick(t);
    r.render(s, cam);
  }
  new IntersectionObserver(es => {
    vis = es[0].isIntersecting && c.isConnected;
    if (vis && !run) { run = true; loop(); }
    if (!c.isConnected) { r.dispose(); if (r.forceContextLoss) r.forceContextLoss(); }
  }).observe(c);
}

/* ===== the lessons page ===== */
const lsKey = () => 'lessonsDone:' + (me ? me.email : '');
const lsGet = () => { try { return JSON.parse(localStorage.getItem(lsKey())) || []; } catch { return []; } };
function lsPaint() {
  const d = lsGet();
  $('#lsBar').style.width = d.length / LESSONS.length * 100 + '%';
  $('#lsCount').textContent = d.length + ' of ' + LESSONS.length + ' lessons completed';
  document.querySelectorAll('.ls').forEach((el, i) => {
    el.classList.toggle('done', d.includes(i));
    el.querySelector('.ls-done').textContent = d.includes(i) ? '✓ Lesson completed' : 'Mark lesson complete';
  });
  $('#lsEnd').hidden = d.length < LESSONS.length;
}
function lsDone(i) {
  const d = lsGet();
  if (!d.includes(i)) d.push(i);
  localStorage.setItem(lsKey(), JSON.stringify(d));
  lsPaint();
}
function lsAnswer(i, j, btn) {
  const box = btn.parentNode, ok = j === LESSONS[i].a;
  box.querySelectorAll('button').forEach(b => b.classList.remove('ok', 'bad'));
  btn.classList.add(ok ? 'ok' : 'bad');
  box.nextElementSibling.textContent = ok ? 'Correct! Well done.' : 'Not quite. Read the lesson again and try another answer.';
  if (ok) lsDone(i);
}
function lsJump(i) { document.getElementById('ls' + i).scrollIntoView({ behavior: 'smooth', block: 'start' }); }

V.lessons = function () {
  out(`<div class="ls-hero rv"><h2>New Farmer Lessons</h2>
    <p>Nine short lessons that teach you what you need to start farming well. Scroll down: every lesson ends with a 3D explanation and a quick question.</p>
    <div class="ls-bar"><i id="lsBar"></i></div><p id="lsCount" class="note"></p></div>
    <div class="ls-index">${LESSONS.map((l, i) => `<button class="ghost small" onclick="lsJump(${i})">${i + 1}. ${l.t}</button>`).join('')}</div>
    ${LESSONS.map((l, i) => `<section class="ls rv" id="ls${i}">
      <span class="ls-num">Lesson ${i + 1} of ${LESSONS.length}</span>
      <h3>${l.t}</h3><p>${l.intro}</p>
      <ul>${l.pts.map(p => `<li>${p}</li>`).join('')}</ul>
      <div class="ls-tip"><b>Good to know:</b> ${l.tip}</div>
      <div class="ls-3d"><span class="ls-badge">3D explanation</span><canvas data-scene="${l.s}"></canvas><div class="ls-say"></div></div>
      <p class="note">${l.cap} Move your mouse over the 3D view to turn it.</p>
      <div class="ls-quiz"><b>Quick check:</b> ${l.q}
        <div>${l.o.map((o, j) => `<button class="small ghost" onclick="lsAnswer(${i},${j},this)">${o}</button>`).join('')}</div><p class="ls-fb"></p></div>
      <button class="ls-done" onclick="lsDone(${i})">Mark lesson complete</button>
    </section>`).join('')}
    <div class="card ls-end rv" id="lsEnd" hidden><h3>Congratulations!</h3><p>You finished every lesson. You are ready to ask the AI assistant your own questions, check your crops, and sell your harvest.</p></div>`);
  lsPaint();
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
  document.querySelectorAll('.ls-3d canvas').forEach(lsStart);
};