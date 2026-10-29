// ================= Little boy card viewer =================
// Flow:  1) opening screen (depends on the theme):
//           teddy  = an envelope with a paw seal       space = a rocket on a launch pad
//           sailor = a message in a bottle on the beach
//        2) tap: the guide (teddy / astronaut / seagull) opens it and keeps the letter
//        3) the story: each part appears as you scroll, delivered by the guide and visited by the
//           companion (bee / comet / fish); the hero (toy train / shooting star / whale) passes once
gsap.registerPlugin(ScrollTrigger);
try { history.scrollRestoration = 'manual'; } catch (e) {}

const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

const params = new URLSearchParams(location.search);
const isPreview = params.get('preview') === '1';
const cardId = isPreview ? null
  : (location.pathname.match(/^\/c\/([A-Za-z0-9_-]+)/) || [])[1] || params.get('id');
const themeParam = THEMES[params.get('theme')] ? params.get('theme') : null;

// Shown at "/" (no card id): a sample card of the chosen theme (/?theme=space)
function sampleCard(id) {
  const d = themeOf(id).defaults;
  return { ...d, theme: themeOf(id).id, date: '2026-12-12', time: '16:00', venue: 'The Garden Hall, 12 Park Road', caption: '', photoUrl: null, voiceUrl: null };
}

let card = null, T = themeOf(themeParam || DEFAULT_THEME);
let W = innerWidth, H = innerHeight;
let night = 0;              // 0 = day / dusk, 1 = starry night (follows the scroll)
let PAL = T.colors.burst;

// ======================================================================
// 1. Load the card
// ======================================================================
async function loadCard() {
  if (isPreview) {
    try { const d = JSON.parse(localStorage.getItem('babycard:preview') || 'null'); if (d) return d; } catch (e) {}
    return sampleCard(themeParam);
  }
  if (!cardId) return sampleCard(themeParam);
  const res = await fetch('/api/cards/' + encodeURIComponent(cardId), { cache: 'no-store' });
  if (res.status === 404) throw new Error('notfound');
  if (!res.ok) throw new Error('server');
  return res.json();
}
function normalise(c) {
  const out = { ...c };
  out.theme = THEMES[c.theme] ? c.theme : DEFAULT_THEME;
  out.slides = Array.isArray(c.slides) && c.slides.length ? c.slides
    : (c.message ? [{ text: c.message, style: 'rise' }] : []);
  out.slides = out.slides.filter((s) => s && String(s.text || '').trim());
  out.wishList = String(c.wishes || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 6);
  return out;
}

function boot() {                 // called at the very end of this file, once everything is defined
  applyTheme(T);                  // draw the default scenery straight away, so the page is never blank
  loadCard().then(async (c) => {
    card = normalise(c);
    if (card.theme !== T.id) applyTheme(themeOf(card.theme));
    document.title = card.title || 'Baby Card';
    buildStory();
    Sound.load({ url: card.voiceUrl, tts: card.tts });
    if (card.photoUrl) await preloadImage(card.photoUrl);
    $('openBtn').disabled = false;
    $('hint').textContent = T.text.hint;
    $('muteBtn').hidden = false;
    startOpener();
  }).catch((err) => {
    if (err.message !== 'notfound') console.error(err);
    $('hint').innerHTML = err.message === 'notfound'
      ? 'This card could not be found. <a href="/create.html">Make a new one</a>'
      : 'Could not load the card. Check your connection and refresh.';
  });
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    const t = setTimeout(resolve, 6000);              // never wait forever
    img.onload = img.onerror = () => { clearTimeout(t); resolve(); };
    img.src = src;
  });
}

// ======================================================================
// 2. Theme: scenery, characters, words, colours
// ======================================================================
const THEME_COLOR = { teddy: '#bfe0f5', space: '#1b2550', sailor: '#9fdcec' };
function applyTheme(theme) {
  T = theme;
  PAL = T.colors.burst;
  THEME_IDS.forEach((id) => document.body.classList.toggle('theme-' + id, id === T.id));
  document.querySelector('meta[name="theme-color"]').content = THEME_COLOR[T.id];
  $('land').innerHTML = T.land;
  $('stage').innerHTML = T.stage;
  $('stage').dataset.opener = T.opener;
  $('sceneEyebrow').textContent = T.text.sceneEyebrow;
  $('guideBob').innerHTML = T.guide.svg;
  $('companion').innerHTML = T.companion('cp');
  $('hero').innerHTML = T.hero.svg;
  $('polTop').textContent = T.text.polaroid;
  $('wishesTitle').textContent = T.text.wishesTitle;
  $('closingLine').textContent = T.text.closing;
  document.documentElement.style.setProperty('--flourish', JSON.stringify(T.text.flourish));
  sizeGuide(); sizeCompanion(); seedAmbient();
  bindOpener();
}

// ======================================================================
// 3. Build the story from the card data
// ======================================================================
// Splits text into words (and letters, if asked) so they can animate one by one
function splitText(el, text, { chars = false } = {}) {
  el.textContent = '';
  String(text || '').split('\n').forEach((line, i) => {
    if (i) el.append(document.createElement('br'));
    line.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { el.append(' '); return; }
      const w = document.createElement('span');
      w.className = 'wd';
      if (chars) {
        [...part].forEach((ch) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; w.append(s); });
      } else w.textContent = part;
      el.append(w);
    });
  });
}
function splitTitle(el, text) {
  el.textContent = '';
  String(text || '').split(/(\s+)/).forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) { el.append(' '); return; }
    const w = document.createElement('span');
    w.className = 'w';
    [...part].forEach((ch) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; w.append(s); });
    el.append(w);
  });
  el.setAttribute('aria-label', text || '');
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return isNaN(dt) ? iso : dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
const pad = (n) => String(n).padStart(2, '0');
function eventStamps(c) {           // for calendar links: [start, end] as YYYYMMDD or YYYYMMDDTHHMMSS
  const d = c.date.replace(/-/g, '');
  if (c.time) {
    const [h, m] = c.time.split(':').map(Number);
    const eh = Math.min(h + 2, 23), em = h + 2 > 23 ? 59 : m;
    return [`${d}T${pad(h)}${pad(m)}00`, `${d}T${pad(eh)}${pad(em)}00`];
  }
  const [y, mo, da] = c.date.split('-').map(Number);
  const n = new Date(Date.UTC(y, mo - 1, da + 1));
  return [d, n.toISOString().slice(0, 10).replace(/-/g, '')];
}
function icsBlobUrl(c) {            // used for the sample/preview (real cards use the server's /invite.ics)
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
  const [s, e] = eventStamps(c);
  const allDay = !c.time;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Baby Card//EN', 'BEGIN:VEVENT',
    'UID:' + Date.now() + '@babycard', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
    (allDay ? 'DTSTART;VALUE=DATE:' : 'DTSTART:') + s, (allDay ? 'DTEND;VALUE=DATE:' : 'DTEND:') + e,
    'SUMMARY:' + esc(c.title || 'Baby shower'), c.venue ? 'LOCATION:' + esc(c.venue) : '', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean);
  return URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
}

const JAR_SVG = `<svg viewBox="0 0 34 34" aria-hidden="true"><defs><clipPath id="jarClip{i}"><path d="M8 11 h18 v16 a4 4 0 0 1 -4 4 h-10 a4 4 0 0 1 -4 -4z"/></clipPath></defs>
<path d="M8 11 h18 v16 a4 4 0 0 1 -4 4 h-10 a4 4 0 0 1 -4 -4z" fill="#fff8ec" stroke="#c68a55" stroke-width="2"/>
<rect class="jar-fill" x="6" y="11" width="22" height="22" fill="#f4b740" clip-path="url(#jarClip{i})"/>
<rect x="6" y="5" width="22" height="7" rx="2.5" fill="#c68a55"/><path d="M11 17 q3 -2 6 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></svg>`;

function buildStory() {
  // intro
  splitText($('onceUpon'), T.text.intro, { chars: true });
  splitTitle($('title'), card.title || '');
  if (card.babyName) { $('babyName').textContent = card.babyName; $('babyName').hidden = false; }

  // one section per message slide
  const wrap = $('slides');
  wrap.textContent = '';
  card.slides.forEach((sl, i) => {
    const sec = document.createElement('section');
    sec.className = 'sec slide';
    sec.dataset.kind = 'slide';
    const note = document.createElement('div');
    const style = ['write', 'rise', 'unfurl', 'glow'].includes(sl.style) ? sl.style : 'rise';
    note.className = 'note ' + style;
    note.dataset.style = style;
    if (style === 'unfurl') note.innerHTML = '<span class="rod top"></span><span class="rod bottom"></span>';
    const p = document.createElement('p');
    p.className = 'note-text';
    splitText(p, sl.text, { chars: style === 'write' });
    note.append(p);
    sec.append(note);
    sec.setAttribute('aria-label', 'Message ' + (i + 1));
    wrap.append(sec);
  });

  // photo
  if (card.photoUrl) {
    $('secPhoto').hidden = false;
    $('secPhoto').dataset.kind = 'photo';
    $('photo').src = card.photoUrl;
    $('photo').alt = card.caption || 'Photo';
    $('caption').textContent = card.caption || '';
  }

  // event details
  const tags = [];
  const [icDate, icTime, icPlace] = T.text.icons;
  if (card.date) tags.push([icDate, 'Date', formatDate(card.date)]);
  if (card.time) tags.push([icTime, 'Time', formatTime(card.time)]);
  if (card.venue) tags.push([icPlace, 'Where', card.venue]);
  if (tags.length) {
    $('secDetails').hidden = false;
    $('secDetails').dataset.kind = 'details';
    $('tags').innerHTML = '';
    tags.forEach(([ic, label, value]) => {
      const li = document.createElement('li');
      li.className = 'tag';
      li.innerHTML = '<span class="ic" aria-hidden="true"></span><span><small></small><b></b></span>';
      li.querySelector('.ic').textContent = ic;
      li.querySelector('small').textContent = label;
      li.querySelector('b').textContent = value;
      $('tags').append(li);
    });
    if (card.date) {
      $('calBtn').hidden = false;
      $('calBtn').href = cardId ? '/c/' + cardId + '/invite.ics' : icsBlobUrl(card);
      const [s, e] = eventStamps(card);
      $('gcalBtn').hidden = false;
      $('gcalBtn').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
        + '&text=' + encodeURIComponent(card.title || 'Baby shower')
        + '&dates=' + s + '/' + e
        + (card.venue ? '&location=' + encodeURIComponent(card.venue) : '')
        + (cardId ? '&details=' + encodeURIComponent(location.origin + '/c/' + cardId) : '');
    }
    if (card.venue) {
      $('mapBtn').hidden = false;
      $('mapBtn').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(card.venue);
    }
  }

  // wishes: honey jars that fill / stars that join into a constellation / bubbles that float up
  if (card.wishList.length) {
    $('secWishes').hidden = false;
    $('secWishes').dataset.kind = 'wishes';
    $('wishList').innerHTML = '';
    card.wishList.forEach((w, i) => {
      const li = document.createElement('li');
      li.className = 'wish';
      const icon = T.id === 'teddy' ? JAR_SVG.replace(/\{i\}/g, i) : T.id === 'space' ? '★' : '';
      li.innerHTML = `<span class="wicon" aria-hidden="true">${icon}${T.id === 'space' && i ? '<i class="link"></i>' : ''}</span><span class="wish-text"></span>`;
      li.querySelector('.wish-text').textContent = w;
      $('wishList').append(li);
    });
  }

  // closing
  $('secClosing').dataset.kind = 'closing';
  $('from').textContent = card.from || '';
  $('from').hidden = !card.from;
  if (typeof BRAND !== 'undefined' && BRAND.shopName) {
    const cr = $('credit');
    cr.hidden = false;
    cr.textContent = 'Made with love by ';
    const name = document.createElement(BRAND.shopUrl ? 'a' : 'span');
    name.textContent = BRAND.shopName;
    if (BRAND.shopUrl) { name.href = BRAND.shopUrl; name.target = '_blank'; name.rel = 'noopener'; }
    cr.append(name);
  }

  // buttons
  if (isPreview) {
    $('previewBanner').hidden = false;
    $('share').hidden = true; $('makeOwn').hidden = true;
  } else {
    const keys = readKeys();
    if (cardId && keys[cardId]) { $('edit').hidden = false; $('edit').href = '/create.html?id=' + cardId; }
    if (!cardId) {                                   // sample page: let visitors try the other themes
      const nav = $('themeTry');
      nav.innerHTML = '<span>Try:</span>' + THEME_IDS.map((id) =>
        `<a href="/?theme=${id}"${id === T.id ? ' aria-current="page"' : ''}>${THEMES[id].emoji} ${THEMES[id].name}</a>`).join('');
      nav.hidden = false;
    }
  }
}
function readKeys() { try { return JSON.parse(localStorage.getItem('babycard:keys') || '{}'); } catch (e) { return {}; } }

// ======================================================================
// 4. Canvases: background (stars, glow-dots, drifting confetti/bubbles) and effects
// ======================================================================
const bg = $('bg').getContext('2d'), fx = $('fx').getContext('2d');
let DPR = 1;
function sizeCanvases() {
  W = innerWidth; H = innerHeight;
  DPR = Math.min(devicePixelRatio || 1, 2);
  for (const c of [$('bg'), $('fx')]) {
    c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
  }
}
sizeCanvases();

// soft glowing dot, drawn once per colour and reused (much faster than shadowBlur)
const sprites = {};
function sprite(color) {
  if (sprites[color]) return sprites[color];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, color); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (sprites[color] = c);
}

function drawStar4(ctx, x, y, s, rot, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot);
  ctx.drawImage(sprite(color), -s * 2.2, -s * 2.2, s * 4.4, s * 4.4);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s);
  ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s);
  ctx.fill(); ctx.restore();
}
function drawHeart(ctx, x, y, s, rot, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s / 10, s / 10);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 4);
  ctx.bezierCurveTo(-10, -3, -6, -12, 0, -6); ctx.bezierCurveTo(6, -12, 10, -3, 0, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(-3.5, -5.5, 1.8, 1.2, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawConfetti(ctx, x, y, s, rot, color, alpha, flip) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, flip);
  ctx.fillStyle = color; ctx.fillRect(-s * 0.8, -s * 0.4, s * 1.6, s * 0.8);
  ctx.restore();
}
function drawBubble(ctx, x, y, s, alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = Math.max(1, s * 0.16);
  ctx.fillStyle = 'rgba(220,250,255,.18)';
  ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(x - s * 0.35, y - s * 0.35, s * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawParticle(ctx, kind, x, y, s, rot, color, alpha, t) {
  if (kind === 'heart') drawHeart(ctx, x, y, s * 1.6, rot * 0.25, color, alpha);
  else if (kind === 'confetti') drawConfetti(ctx, x, y, s * 1.4, rot, color, alpha, Math.sin(t * 5));
  else if (kind === 'bubble') drawBubble(ctx, x, y, s * 1.3, alpha);
  else if (kind === 'dot') { ctx.globalAlpha = alpha; ctx.drawImage(sprite(color), x - s * 2, y - s * 2, s * 4, s * 4); }
  else drawStar4(ctx, x, y, s, rot, color, alpha);
}

const area = () => W * H;
let stars = [], flies = [], drift = [], streak = null, streakClock = 4;
function seedAmbient() {
  const n = reduceMotion ? 0 : 1;
  const dense = T.id === 'space' ? 1.6 : 1;
  stars = Array.from({ length: Math.round(Math.min(170, area() / 7000 * dense)) }, () => ({
    x: Math.random() * W, y: Math.random() * H * (T.id === 'space' ? 0.85 : 0.7), r: rand(0.6, 1.8), t: Math.random() * 6, s: rand(0.8, 2.4) }));
  flies = Array.from({ length: n * Math.round(clamp(area() / 60000, 6, 14)) }, () => ({
    x: Math.random() * W, y: rand(H * 0.25, H), t: Math.random() * 100, sp: rand(0.2, 0.5), r: rand(7, 14), c: pick(T.colors.flies) }));
  drift = Array.from({ length: n * Math.round(clamp(area() / 85000, 6, 13)) }, () => newDrift(true));
}
function newDrift(anywhere) {
  const D = T.colors.drift, up = D.dir < 0;
  return { x: Math.random() * W, y: anywhere ? Math.random() * H : (up ? H + 20 : -20), vy: rand(14, 30) * D.dir, sw: rand(16, 44), t: Math.random() * 10,
    r: rand(3, 5.5), rot: Math.random() * 6, vr: rand(-1.5, 1.5), c: pick(D.colors), k: pick(D.kinds) };
}

function drawAmbient(dt) {
  bg.clearRect(0, 0, W, H);
  const starA = Math.min(1, T.colors.starBase + night * 0.8);
  for (const s of stars) {
    s.t += dt * s.s;
    const a = starA * (0.45 + 0.55 * Math.sin(s.t));
    if (a <= 0.02) continue;
    bg.globalAlpha = a;
    bg.drawImage(sprite('#fff6dc'), s.x - s.r * 3, s.y - s.r * 3, s.r * 6, s.r * 6);
  }
  const flyA = T.id === 'space' ? 1 : 0.25 + night * 0.75;
  for (const f of flies) {
    f.t += dt * f.sp;
    const x = f.x + Math.sin(f.t * 1.3) * 40 + Math.sin(f.t * 0.7) * 30;
    const y = f.y + Math.cos(f.t * 1.1) * 30;
    bg.globalAlpha = flyA * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(f.t * 4)));
    bg.drawImage(sprite(f.c), x - f.r, y - f.r, f.r * 2, f.r * 2);
  }
  for (const p of drift) {
    p.t += dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    const x = p.x + Math.sin(p.t * 1.2) * p.sw;
    if (p.y > H + 24 || p.y < -24) Object.assign(p, newDrift(false));
    drawParticle(bg, p.k, x, p.y, p.r, p.rot, p.c, 0.7, p.t);
  }
  // space: a little shooting star crosses the background now and then
  if (T.id === 'space' && !reduceMotion) {
    streakClock -= dt;
    if (!streak && streakClock <= 0) { streak = { x: rand(W * 0.1, W * 0.7), y: rand(H * 0.05, H * 0.35), t: 0, a: rand(0.35, 0.6) }; streakClock = rand(5, 9); }
    if (streak) {
      streak.t += dt;
      const k = streak.t / 0.9, len = 120, dx = Math.cos(streak.a), dy = Math.sin(streak.a);
      const hx = streak.x + dx * k * W * 0.35, hy = streak.y + dy * k * W * 0.35;
      const g = bg.createLinearGradient(hx, hy, hx - dx * len, hy - dy * len);
      g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      bg.globalAlpha = Math.sin(Math.PI * clamp(k, 0, 1));
      bg.strokeStyle = g; bg.lineWidth = 2; bg.lineCap = 'round';
      bg.beginPath(); bg.moveTo(hx, hy); bg.lineTo(hx - dx * len, hy - dy * len); bg.stroke();
      if (k >= 1) streak = null;
    }
  }
  bg.globalAlpha = 1;
}

// effect particles
const parts = [];
function spawn(x, y, o = {}) {
  if (reduceMotion || parts.length > 420) return;
  const a = o.angle !== undefined ? o.angle + rand(-(o.spreadA || 0.4), o.spreadA || 0.4) : Math.random() * Math.PI * 2;
  const sp = o.speed !== undefined ? o.speed * rand(0.6, 1.2) : rand(20, 90);
  parts.push({
    x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.g !== undefined ? o.g : 30,
    life: 0, max: o.life || rand(0.6, 1.3), s: o.size || rand(2, 4.5), kind: o.kind || 'spark',
    c: o.color || pick(PAL), rot: Math.random() * 6, vr: rand(-4, 4), t: Math.random() * 6,
  });
}
function burst(x, y, n, o = {}) {
  for (let i = 0; i < n; i++) spawn(x, y, { speed: rand(60, o.power || 220), g: 120, life: rand(0.8, 1.6), ...o, kind: o.kind || (i % 4 === 3 ? T.colors.trailKind : 'spark') });
  if (!o.quiet) Sfx.play('sparkle');
}
// the end-of-card celebration: confetti & hearts fall (teddy, space) or bubbles rise (sailor)
function celebrationRain(n = 40) {
  const up = T.id === 'sailor';
  for (let i = 0; i < n; i++) setTimeout(() => {
    const kind = up ? (i % 3 ? 'bubble' : 'confetti') : T.id === 'teddy' ? (i % 3 ? 'confetti' : 'heart') : (i % 2 ? 'confetti' : 'spark');
    spawn(rand(0, W), up ? H + 10 : -10, { kind, angle: up ? -Math.PI / 2 : Math.PI / 2, spreadA: 0.5, speed: rand(60, 120), g: up ? -10 : 20, life: rand(3, 5), size: rand(3.5, 6) });
  }, i * 40);
}

// the hero's trail (rainbow-style ribbon, used by the shooting star)
const trail = [];
function drawFx(dt) {
  fx.clearRect(0, 0, W, H);
  const now = performance.now() / 1000;
  while (trail.length && now - trail[0].t > 1.5) trail.shift();
  if (trail.length > 1 && T.hero.bands) {
    const BANDS = T.hero.bands;
    fx.lineCap = 'round';
    const bw = trail[trail.length - 1].bw;
    for (let b = 0; b < BANDS.length; b++) {
      fx.strokeStyle = BANDS[b]; fx.lineWidth = bw + 1;
      for (let i = 1; i < trail.length; i++) {
        const p0 = trail[i - 1], p1 = trail[i];
        fx.globalAlpha = clamp(1 - (now - p1.t) / 1.5, 0, 1) * 0.85;
        const off = (b - (BANDS.length - 1) / 2) * bw;
        fx.beginPath(); fx.moveTo(p0.x, p0.y + off); fx.lineTo(p1.x, p1.y + off); fx.stroke();
      }
    }
    fx.globalAlpha = 1;
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life += dt;
    if (p.life >= p.max) { parts.splice(i, 1); continue; }
    p.vy += p.g * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.t += dt;
    const k = 1 - p.life / p.max;
    if (p.kind === 'spark') drawStar4(fx, p.x, p.y, p.s * (0.4 + 0.6 * k), p.rot, p.c, Math.min(1, k * 1.6));
    else drawParticle(fx, p.kind, p.x + (p.kind === 'confetti' || p.kind === 'bubble' ? Math.sin(p.t * 3) * 6 : 0), p.y, p.s, p.rot, p.c, Math.min(1, k * 2), p.t);
  }
  fx.globalAlpha = 1;
}

// sparkles (or bubbles on the beach) follow your finger / mouse
let lastTrail = 0;
addEventListener('pointermove', (e) => {
  const t = performance.now();
  if (t - lastTrail < 28) return;
  lastTrail = t;
  const kind = T.id === 'sailor' && Math.random() < 0.4 ? 'bubble' : 'spark';
  spawn(e.clientX, e.clientY, { speed: rand(10, 40), g: kind === 'bubble' ? -40 : 40, life: rand(0.5, 0.9), size: rand(2, 3.5), kind });
}, { passive: true });

// The first tap anywhere switches sound on (browsers only allow sound after a tap)
addEventListener('pointerdown', () => {
  Sound.unlock();
  setTimeout(() => { if (!opened && T.opener === 'bottle') Sfx.waves(true); }, 50);
}, { once: true, capture: true });

// ======================================================================
// 5. The guide (teddy on balloons / astronaut with a jetpack / seagull in a sailor hat)
// ======================================================================
const guide = { el: $('guide'), flip: $('guideFlip'), x: -400, y: -400, w: 160, h: 196, face: 1, flying: false, tween: null, atHome: false, gone: false, job: null };
function sizeGuide() {
  const v = T.guide.view;
  guide.w = Math.round(clamp(Math.min(W * 0.38, H * 0.26), 130, 200));
  guide.h = guide.w * v.h / v.w;
  guide.el.style.setProperty('--gw', guide.w + 'px');
  document.documentElement.style.setProperty('--gh', Math.round(guide.h * 0.9) + 'px');
}
function placeGuide() { gsap.set(guide.el, { x: guide.x - guide.w / 2, y: guide.y - guide.h / 2 }); }
function faceGuide(dir, instant) {
  if (dir === guide.face && !instant) return;
  guide.face = dir;
  gsap.to(guide.flip, { scaleX: dir, duration: instant ? 0 : 0.28, ease: 'power2.inOut' });
}
// Where the guide waits while you read: in the side margin on wide screens, top-right corner on phones
function guideHome() {
  const margin = (W - 620) / 2;
  if (margin > guide.w * 0.75) return { x: W - margin / 2, y: H * 0.36, face: -1 };
  return { x: W - guide.w * 0.4, y: guide.h * 0.48 + 6, face: -1 };
}
function guideFly(tx, ty, { duration, arc, face, ease = 'power1.inOut', free = false } = {}) {
  if (guide.tween) guide.tween.kill();
  if (!free) { tx = clamp(tx, guide.w * 0.4, W - guide.w * 0.4); ty = clamp(ty, guide.h * 0.4, H - guide.h * 0.4); }
  const sx = guide.x, sy = guide.y, dx = tx - sx, dy = ty - sy, dist = Math.hypot(dx, dy);
  if (dist < 2) { if (face) faceGuide(face); return Promise.resolve(); }
  const d = duration || clamp(dist / 520, 0.6, 1.7);
  const bend = arc !== undefined ? arc : -clamp(dist * 0.25, 20, 120);
  const cx = sx + dx / 2, cy = sy + dy / 2 + bend;
  if (Math.abs(dx) > 24) faceGuide(dx > 0 ? 1 : -1);
  guide.flying = true; guide.atHome = false;
  guide.el.classList.add('flying');
  if (T.id === 'sailor' && dist > 80) Sfx.play('flap');
  const p = { t: 0 };
  return new Promise((resolve) => {
    guide.tween = gsap.to(p, {
      t: 1, duration: d, ease,
      onUpdate() {
        const t = p.t, u = 1 - t;
        guide.x = u * u * sx + 2 * u * t * cx + t * t * tx;
        guide.y = u * u * sy + 2 * u * t * cy + t * t * ty;
        placeGuide();
        gsap.set(guide.el, { rotation: Math.sin(Math.PI * t) * (dx > 0 ? 9 : -9) });
      },
      onComplete() {
        guide.flying = false; guide.el.classList.remove('flying');
        gsap.to(guide.el, { rotation: 0, duration: 0.3 });
        if (face) faceGuide(face);
        resolve();
      },
      onInterrupt: resolve,
    });
  });
}
function goHome(delay = 0) {
  if (guide.job) guide.job.kill();
  guide.job = gsap.delayedCall(delay, () => {
    if (guide.gone) return;
    const h = guideHome();
    guideFly(h.x, h.y, { face: h.face }).then(() => { if (!guide.flying) guide.atHome = true; });
  });
}
function rectCenter(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }
const tipPos = () => rectCenter($('gTip'));
const carryPos = () => rectCenter($('gCarry'));

// Wave hello (wand / star / wing); sparkles fly from the tip (towards a target if given)
function wave(target, times = 1) {
  if (reduceMotion) return gsap.timeline();
  const arm = $('gArm'), [back, fwd] = T.guide.wave, o = T.guide.shoulder;
  const tl = gsap.timeline();
  tl.to(arm, { rotation: back, svgOrigin: o, duration: 0.18, ease: 'power2.out' })
    .to(arm, { rotation: fwd, svgOrigin: o, duration: 0.22, ease: 'power2.inOut', repeat: times * 2 - 1, yoyo: true })
    .to(arm, { rotation: 0, svgOrigin: o, duration: 0.3, ease: 'power2.out' });
  let n = 0;
  tl.eventCallback('onUpdate', () => {
    if (n++ % 2) return;
    const s = tipPos();
    if (target) {
      const a = Math.atan2(target.y - s.y, target.x - s.x), d = Math.hypot(target.x - s.x, target.y - s.y);
      spawn(s.x, s.y, { angle: a, spreadA: 0.25, speed: d * 1.6, g: 0, life: rand(0.45, 0.7), size: rand(2.5, 4.5) });
    } else spawn(s.x, s.y, { speed: rand(30, 90), g: 40, life: rand(0.6, 1), size: rand(2, 4) });
  });
  return tl;
}
// a trail behind the guide while flying: hearts (teddy), jetpack flames (astronaut), sea sparkles (gull)
let dustClock = 0;
function guideTrail(dt) {
  if (!guide.flying) return;
  dustClock += dt;
  while (dustClock > 0.03) {
    dustClock -= 0.03;
    if (T.id === 'space') {
      const nx = guide.x + (87 / 220 - 0.5) * guide.w * guide.face, ny = guide.y + (228 / 270 - 0.5) * guide.h;
      spawn(nx + rand(-4, 4), ny, { kind: 'dot', color: pick(T.colors.trail), angle: Math.PI / 2, spreadA: 0.35, speed: rand(60, 120), g: 20, life: rand(0.35, 0.6), size: rand(2.4, 4.2) });
    } else {
      const kind = Math.random() < 0.25 ? T.colors.trailKind : 'spark';
      spawn(guide.x + rand(-guide.w * 0.15, guide.w * 0.15), guide.y + guide.h * 0.25, { kind, color: kind === 'spark' ? undefined : pick(T.colors.trail), angle: Math.PI / 2, spreadA: 0.6, speed: rand(10, 40), g: kind === 'bubble' ? -30 : 60, life: rand(0.6, 1.1), size: rand(1.8, 3.4) });
    }
  }
}

// ======================================================================
// 6. The companion (bee / comet / fish): follows the guide, lands on things
// ======================================================================
const comp = { el: $('companion'), x: W + 60, y: H * 0.3, vx: 0, vy: 0, ang: 0, mode: 'off', land: null, size: 46, landed: false, orbit: 0 };
function sizeCompanion() { comp.size = Math.round(clamp(W * 0.1, 36, 50)); comp.el.style.setProperty('--cw', comp.size + 'px'); }
function landOn(el, fx_, fy_) { comp.mode = 'land'; comp.land = { el, fx: fx_, fy: fy_ }; }
function followGuide() { comp.mode = 'follow'; comp.land = null; }
function compTarget() {
  if (comp.mode === 'land' && comp.land) {
    const r = comp.land.el.getBoundingClientRect();
    if (r.bottom < -40 || r.top > H + 40 || !r.width) { followGuide(); }
    else return { x: r.left + r.width * comp.land.fx, y: r.top + r.height * comp.land.fy, land: true };
  }
  comp.orbit += 0.9 / 60;
  const gx = guide.gone ? W * 0.5 : guide.x, gy = guide.gone ? H * 0.3 : guide.y;
  return { x: gx + Math.cos(comp.orbit * 1.3) * guide.w * 0.75, y: gy - guide.h * 0.1 + Math.sin(comp.orbit * 2.1) * guide.h * 0.4 };
}
let lastLandSound = 0;
function updateCompanion(dt, time) {
  if (comp.mode === 'off') return;
  const Tg = compTarget();
  const dx = Tg.x - comp.x, dy = Tg.y - comp.y, dist = Math.hypot(dx, dy);
  if (Tg.land && dist < 3) {
    if (!comp.landed) {
      comp.landed = true; comp.el.classList.add('resting');
      if (opened && time - lastLandSound > 1.5) { lastLandSound = time; Sfx.play(T.id === 'sailor' ? 'bubble' : 'squeak'); }
    }
    comp.x = Tg.x; comp.y = Tg.y; comp.vx = comp.vy = 0;
    comp.ang += (Math.sin(time * 0.8) * 8 - comp.ang) * Math.min(1, dt * 3);
  } else {
    if (comp.landed) { comp.landed = false; comp.el.classList.remove('resting'); }
    const max = Tg.land ? 320 : 420;
    const speed = Math.min(max, dist * (Tg.land ? 3.2 : 2.2));
    const wob = Tg.land && dist < 60 ? 0 : Math.sin(time * 6.3) * 0.7;
    const a = Math.atan2(dy, dx) + wob;
    const k = Math.min(1, dt * 4);
    comp.vx += (Math.cos(a) * speed - comp.vx) * k;
    comp.vy += (Math.sin(a) * speed - comp.vy) * k;
    comp.x += comp.vx * dt; comp.y += comp.vy * dt + (Tg.land && dist < 40 ? 0 : Math.sin(time * 13) * 0.8);
    const target = Math.atan2(comp.vy, comp.vx) * 180 / Math.PI + 90;
    const diff = ((target - comp.ang + 540) % 360) - 180;
    comp.ang += diff * Math.min(1, dt * 6);
  }
  gsap.set(comp.el, { x: comp.x - comp.size / 2, y: comp.y - comp.size / 2, rotation: comp.ang });
}
// the end: little balloons float up (teddy), or comets / fish fly out in all directions
function miniFlurry(n, x, y) {
  if (reduceMotion) return;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'mini mini-' + T.id;
    el.innerHTML = T.mini(i);
    document.body.append(el);
    if (T.miniMotion === 'up') {
      const sx = rand(W * 0.08, W * 0.92);
      gsap.set(el, { x: sx - 15, y: H + 20, rotation: rand(-10, 10) });
      gsap.to(el, { y: -120, duration: rand(5, 7.5), ease: 'sine.in', delay: i * 0.25, onComplete: () => el.remove() });
      gsap.to(el, { x: sx - 15 + rand(-60, 60), rotation: rand(-14, 14), duration: rand(1.6, 2.4), yoyo: true, repeat: 3, ease: 'sine.inOut', delay: i * 0.25 });
    } else {
      const a = rand(-Math.PI * 0.9, -Math.PI * 0.1), d = rand(H * 0.5, H * 0.9);
      const ex = x + Math.cos(a) * d, ey = y + Math.sin(a) * d;
      gsap.set(el, { x: x - 13, y: y - 13, scale: 0.3, rotation: (a * 180 / Math.PI) + 90 });
      gsap.to(el, { scale: rand(0.8, 1.2), duration: 0.4 });
      gsap.to(el, { x: ex, y: ey, duration: rand(2.4, 3.6), ease: 'sine.in', delay: i * 0.08, onComplete: () => el.remove() });
      gsap.to(el, { opacity: 0, duration: 0.6, delay: 2 + i * 0.08 });
    }
  }
}

// ======================================================================
// 7. The hero (passes once after the title): toy train / shooting star / whale
// ======================================================================
const hero = { el: $('hero'), done: false };
function landScale() { const landH = Math.min(H * 0.32, 280); return { landH, s: Math.max(W / 1440, landH / 320) }; }
function runHero() {
  if (hero.done || reduceMotion) return;
  hero.done = true;
  const Hc = T.hero, [kw, minW, maxW] = Hc.size;
  const uw = Math.round(clamp(W * kw, minW, maxW)), uh = uw * Hc.view.h / Hc.view.w;
  hero.el.style.setProperty('--hw', uw + 'px');
  hero.el.style.aspectRatio = Hc.view.w + ' / ' + Hc.view.h;
  const { s } = landScale();
  let duration, path;
  if (Hc.path === 'ground') {                        // the toy train rolls along the meadow
    const top = H - 26 * s - uh * 0.97;
    duration = clamp(W / 240, 3.8, 6.5);
    path = (t, time) => ({ x: -uw + (W + uw * 1.3) * t, y: top + Math.abs(Math.sin(time * 14)) * -1.6 });
  } else if (Hc.path === 'sea') {                    // the whale swims along the waves
    const top = H - 74 * s - uh * 0.62;
    duration = clamp(W / 220, 4.2, 7);
    path = (t, time) => ({ x: -uw + (W + uw * 1.3) * t, y: top + Math.sin(time * 2.2) * 6 });
  } else {                                           // the shooting star arcs across the sky
    duration = clamp(W / 420, 2.2, 3.4);
    path = (t) => ({ x: -uw + (W + uw * 2) * t, y: H * 0.1 + t * H * 0.16 - Math.sin(Math.PI * t) * H * 0.07 - uh / 2 });
  }
  hero.el.classList.add('running');
  const p0 = path(0, 0);
  gsap.set(hero.el, { opacity: 1, x: p0.x, y: p0.y });
  Sfx.play(T.sfx.hero);
  if (T.id === 'teddy') Sfx.play('chug');
  const p = { t: 0 };
  let n = 0, spouted = false, tooted = false, start = performance.now();
  gsap.to(p, {
    t: 1, duration, ease: 'none',
    onUpdate() {
      const time = (performance.now() - start) / 1000;
      const { x, y } = path(p.t, time);
      gsap.set(hero.el, { x, y });
      n++;
      if (Hc.path === 'ground') {
        if (n % 5 === 0) spawn(x + Hc.smoke.x / Hc.view.w * uw, y + (Hc.smoke.y + 24) / Hc.view.h * uh, { kind: n % 10 ? 'dot' : 'heart', color: pick(['#ffffff', '#fff3f0', '#eaf5ff']), angle: -Math.PI / 2 - 0.4, spreadA: 0.3, speed: rand(30, 60), g: -18, life: rand(1.2, 1.8), size: rand(4, 7) });
        if (!tooted && p.t > 0.55) { tooted = true; Sfx.play('toot'); }
      } else if (Hc.path === 'sea') {
        if (n % 6 === 0) spawn(x + uw * 0.08, y + uh * 0.6, { kind: 'bubble', angle: -Math.PI / 2, spreadA: 0.6, speed: rand(20, 50), g: -30, life: rand(0.8, 1.4), size: rand(2, 4) });
        if (!spouted && p.t > 0.42) {
          spouted = true; Sfx.play('spout');
          const sx = x + Hc.spout.x / Hc.view.w * uw, sy = y + Hc.spout.y / Hc.view.h * uh;
          for (let i = 0; i < 46; i++) setTimeout(() => spawn(sx + rand(-4, 4), sy, { kind: i % 3 ? 'dot' : 'bubble', color: pick(['#ffffff', '#bfeaf5', '#9fe6ff']), angle: -Math.PI / 2, spreadA: 0.32, speed: rand(200, 330), g: 300, life: rand(1, 1.5), size: rand(2.5, 4.5) }), i * 16);
        }
      } else {
        trail.push({ x: x + uw * 0.5, y: y + uh * 0.5, t: performance.now() / 1000, bw: Math.max(2.5, uh * 0.05) });
        if (n % 2 === 0) spawn(x + uw * 0.5, y + uh * 0.5, { angle: Math.PI + rand(-0.6, 0.6), speed: rand(20, 70), g: 60, life: rand(0.5, 1), size: rand(2, 3.5) });
      }
    },
    onComplete() { hero.el.classList.remove('running'); gsap.set(hero.el, { opacity: 0 }); },
  });
}

// ======================================================================
// 8. Opening screen: shared parts
// ======================================================================
let idleTimer = null, opened = false;
function bindOpener() {
  const btn = $('openBtn');
  btn.addEventListener('click', (e) => { e.stopPropagation(); openCard(); });
  const env = $('envelope');
  if (env) env.addEventListener('click', () => { if (!btn.disabled) openCard(); });
}
function guideSpot() {
  // in the space kept above the stage, a little to the left
  const r = $('guideSpot').getBoundingClientRect();
  return { x: clamp(r.left + r.width * 0.3, guide.w * 0.45, W - guide.w * 0.5), y: r.top + r.height * 0.52 };
}
function startOpener() {
  const spot = guideSpot();
  gsap.set(guide.el, { opacity: 1 });
  if (reduceMotion) { guide.x = spot.x; guide.y = spot.y; placeGuide(); return; }
  // the guide arrives from the top-left
  guide.x = -guide.w; guide.y = H * 0.12; placeGuide();
  guideFly(spot.x, spot.y, { duration: 1.8, arc: -H * 0.12, face: 1, ease: 'power2.out' })
    .then(() => { if (!opened) wave(null, 1); });
  // the companion flutters in and lands on the thing to tap
  gsap.delayedCall(1.4, () => {
    if (opened) return;
    comp.x = W + 40; comp.y = H * 0.25;
    gsap.set(comp.el, { opacity: 1 });
    comp.mode = 'follow';
    gsap.delayedCall(1.8, () => { if (!opened) landOn($('openBtn'), T.opener === 'bottle' ? 0.9 : 0.5, T.opener === 'bottle' ? 0.38 : 0.12); });
  });
  OPENERS[T.opener].start();
  parallax();
}
function parallax() {
  if (reduceMotion) return;
  const far = gsap.quickTo('.land-far', 'x', { duration: 1, ease: 'power3' });
  const mid = gsap.quickTo('.land-mid', 'x', { duration: 1, ease: 'power3' });
  const near = gsap.quickTo('.land-near', 'x', { duration: 1, ease: 'power3' });
  const moon = gsap.quickTo('#moon', 'x', { duration: 1.2, ease: 'power3' });
  const move = (k) => { far(k * 10); mid(k * 22); near(k * 38); moon(k * -12); };
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') move((e.clientX / W - 0.5) * 2); }, { passive: true });
  addEventListener('deviceorientation', (e) => { if (e.gamma != null) move(clamp(e.gamma / 30, -1, 1)); });
}

function openCard() {
  if (opened || !card) return;
  opened = true;
  clearInterval(idleTimer);
  Sound.unlock();                 // must happen right here, inside the tap
  Sfx.play('tap');
  gsap.to(['#hint', '#sceneEyebrow', '#themeTry'], { opacity: 0, duration: 0.4 });
  if (reduceMotion) return simpleOpen();
  followGuide();
  OPENERS[T.opener].open();
}
// shared ending of every opening: the light burst, then the story
function letterBurst(el) {
  const lr = rectCenter(el);
  gsap.set('#flash', { x: lr.x - W / 2, y: lr.y - H / 2, scale: 1, opacity: 0 });
  gsap.to(el, { y: '-=' + H * 0.35, scale: 1.3, opacity: 0, duration: 0.6, ease: 'power2.in' });
  gsap.to('#flash', { opacity: 1, scale: Math.max(W, H) / 12, duration: 0.8, ease: 'power2.in', delay: 0.25 });
  burst(lr.x, lr.y - 40, 40, { power: 300 });
  Sfx.play('whoosh', 0.7);
}
function raysOn(tl, at) {
  tl.to('#rays', { opacity: 0.9, duration: 1 }, at)
    .add(() => gsap.to('#rays', { rotation: 360, duration: 80, repeat: -1, ease: 'none' }), '<');
}
// the guide takes the envelope / bottle with him
function takeAway(el, done) {
  const fr = carryPos(), er = rectCenter(el);
  gsap.to(el, { x: '+=' + (fr.x - er.x), y: '+=' + (fr.y - er.y), scale: fr.w / er.w, rotation: -8, duration: 0.8, ease: 'power2.inOut',
    onComplete: () => { gsap.set('#gCarry', { opacity: 1 }); gsap.set(el, { opacity: 0 }); if (done) done(); } });
}

// ======================================================================
// 9. The three openings
// ======================================================================
const OPENERS = {
  // ---------- Teddy: an envelope with a paw seal ----------
  envelope: {
    start() {
      const er = $('envelope').getBoundingClientRect();
      idleTimer = setInterval(() => {
        if (opened || document.hidden) return;
        wave({ x: er.left + er.width / 2, y: er.top + er.height * 0.6 }, 1);
        gsap.fromTo('#envelope', { rotation: 0 }, { keyframes: [{ rotation: -3, duration: 0.1 }, { rotation: 3, duration: 0.1 }, { rotation: -2, duration: 0.1 }, { rotation: 0, duration: 0.2 }] });
      }, 5200);
    },
    open() {
      const env = $('envelope');
      document.querySelector('.env-float').style.animation = 'none';
      const sr = rectCenter($('openBtn'));
      const tl = gsap.timeline();
      tl.add(() => guideFly(sr.x + guide.w * 0.55, sr.y - guide.h * 0.18, { duration: 0.75, face: -1 }))
        .add(() => wave({ x: sr.x, y: sr.y }, 1), '+=0.8')
        .add(() => {                                   // the paw seal pops
          burst(sr.x, sr.y, 46, { power: 260 });
          Sfx.play('pop');
          gsap.to('#openBtn', { scale: 1.7, opacity: 0, duration: 0.3, onComplete: () => ($('openBtn').style.visibility = 'hidden') });
        }, '+=0.45')
        .add(() => Sfx.play('paper'), '+=0.1')
        .to('#flap', { rotateX: -180, transformPerspective: 900, duration: 0.8, ease: 'power2.inOut' }, '<')
        .set('#flap', { zIndex: 0 }, '<0.4');
      raysOn(tl, '<');
      tl.to('#letter', { y: '-62%', duration: 0.8, ease: 'back.out(1.3)', onStart: () => Sfx.play('musicbox') }, '-=0.15')
        .set('#letter', { zIndex: 5 })
        .add(() => letterBurst($('letter')), '+=0.35')
        .add(() => takeAway(env), '+=0.2')
        .add(() => showStory(), '+=0.95');
    },
  },

  // ---------- Space: a rocket countdown ----------
  launch: {
    start() {
      gsap.set('#rFlame', { scaleY: 0, transformOrigin: '50% 0%' });
      idleTimer = setInterval(() => {
        if (opened || document.hidden) return;
        const r = rectCenter($('rocket'));
        wave({ x: r.x, y: r.y }, 1);
        gsap.fromTo('#rFlame', { scaleY: 0 }, { scaleY: 0.25, duration: 0.15, yoyo: true, repeat: 3 });
      }, 5200);
    },
    open() {
      const btn = $('openBtn'), rocket = $('rocket'), cd = $('countdown');
      const rr = () => rectCenter(rocket);
      const tl = gsap.timeline();
      gsap.fromTo(btn, { scale: 1 }, { scale: 0.88, duration: 0.1, yoyo: true, repeat: 1 });
      btn.classList.add('pressed');
      const r0 = rr();
      tl.add(() => guideFly(r0.x - r0.w * 0.9 - guide.w * 0.2, r0.y - r0.h * 0.1, { duration: 0.8, face: 1 }));
      // 3… 2… 1…
      ['3', '2', '1'].forEach((num, i) => {
        tl.add(() => {
          cd.textContent = num; Sfx.play('beep');
          gsap.fromTo(cd, { scale: 2.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' });
          gsap.to(cd, { opacity: 0, duration: 0.25, delay: 0.6 });
          gsap.fromTo(rocket, { x: 0 }, { x: 1.5 + i, duration: 0.05, repeat: 13, yoyo: true, ease: 'none' });
          const r = rr();
          for (let k = 0; k < 8 + i * 8; k++) spawn(r.x + rand(-r.w * 0.6, r.w * 0.6), r.y + r.h * 0.5, { kind: 'dot', color: pick(['#ffffff', '#dfe4f2', '#c3cae0']), angle: k % 2 ? 0 : Math.PI, spreadA: 0.4, speed: rand(40, 120), g: -15, life: rand(0.8, 1.4), size: rand(4, 8) });
          if (i === 0) wave({ x: r.x, y: r.y }, 1);
        }, i === 0 ? '+=0.5' : '+=0.9');
      });
      // liftoff!
      tl.add(() => {
        cd.textContent = 'Liftoff!'; cd.classList.add('go');
        gsap.fromTo(cd, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' });
        gsap.to(cd, { opacity: 0, duration: 0.4, delay: 1.1 });
        Sfx.play('beep', true); Sfx.play('liftoff');
        gsap.to('#rFlame', { scaleY: 1, duration: 0.3, ease: 'power2.out' });
        gsap.to('.tower-arm', { rotation: -70, svgOrigin: '78 130', duration: 0.6 });
        gsap.fromTo('#stage', { x: -3 }, { x: 3, duration: 0.05, repeat: 30, yoyo: true, ease: 'none', onComplete: () => gsap.set('#stage', { x: 0 }) });
      }, '+=0.9');
      raysOn(tl, '<');
      tl.to(rocket, {
        y: -H * 1.25 / Math.max(0.3, $('launch').getBoundingClientRect().width / 300), duration: 1.9, ease: 'power2.in',
        onUpdate() {
          const r = rr();
          for (let k = 0; k < 2; k++) spawn(r.x + rand(-6, 6), r.y + r.h * 0.5, { kind: 'dot', color: pick(T.colors.trail), angle: Math.PI / 2, spreadA: 0.3, speed: rand(80, 200), g: 30, life: rand(0.5, 0.9), size: rand(3, 6) });
          if (Math.random() < 0.3) spawn(r.x + rand(-10, 10), r.y + r.h * 0.5, { kind: 'dot', color: '#e7ebf6', angle: Math.PI / 2, spreadA: 1.2, speed: rand(20, 60), g: -10, life: rand(1, 1.6), size: rand(6, 10) });
        },
      }, '+=0.4')
      // the rocket is gone: a starburst high up, and the astronaut catches the mission letter
        .add(() => {
          const top = { x: W / 2, y: H * 0.12 };
          burst(top.x, top.y, 50, { power: 320 });
          Sfx.play('fanfare');
          gsap.set('#flash', { x: 0, y: -H * 0.38, scale: 1, opacity: 0 });
          gsap.to('#flash', { opacity: 1, scale: Math.max(W, H) / 12, duration: 0.9, ease: 'power2.in', delay: 0.35 });
        }, '-=0.3')
        .add(() => {
          const c = carryPos();
          burst(c.x, c.y, 24, { power: 140, quiet: true });
          gsap.set('#gCarry', { opacity: 1 });
          Sfx.play('chime', [1046, 1318, 1568], 0.08);
        }, '+=0.4')
        .add(() => showStory(), '+=0.6');
    },
  },

  // ---------- Sailor: a message in a bottle ----------
  bottle: {
    start() {
      // the bottle washes up on the waves
      gsap.from('#bottleWrap', { x: W * 0.55, rotation: 18, duration: 2.6, ease: 'power2.out' });
      idleTimer = setInterval(() => {
        if (opened || document.hidden) return;
        const b = rectCenter($('openBtn'));
        wave({ x: b.x, y: b.y }, 1);
        gsap.fromTo('#cork', { rotation: 0 }, { keyframes: [{ rotation: -8, duration: 0.08 }, { rotation: 8, duration: 0.08 }, { rotation: 0, duration: 0.12 }], svgOrigin: '298 86' });
      }, 5200);
    },
    open() {
      const wrap = $('bottleWrap'), scroll = $('msgScroll');
      wrap.querySelector('.bottle-btn').style.animation = 'none';
      const cr = () => rectCenter($('cork'));
      const tl = gsap.timeline();
      const c0 = cr();
      tl.add(() => guideFly(c0.x + guide.w * 0.3, c0.y - guide.h * 0.45, { duration: 0.75, face: -1 }))
        .add(() => wave(cr(), 1), '+=0.6');
      for (let i = 0; i < 3; i++) {                  // the cork wiggles…
        tl.add(() => Sfx.play('squeak'), i ? '+=0.02' : '+=0.3')
          .to('#cork', { rotation: i % 2 ? 9 : -9, x: 3 + i * 2, svgOrigin: '298 86', duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' });
      }
      tl.add(() => {                                 // …and POPS
        const c = cr();
        Sfx.play('cork');
        burst(c.x, c.y, 40, { power: 260, quiet: true });
        for (let k = 0; k < 14; k++) spawn(c.x, c.y, { kind: 'bubble', angle: -Math.PI / 3, spreadA: 0.7, speed: rand(80, 220), g: 60, life: rand(0.8, 1.4), size: rand(2.5, 5) });
        gsap.to('#cork', { x: 140, y: -260, rotation: 540, svgOrigin: '298 86', duration: 1.1, ease: 'power2.out' });
        gsap.to('#cork', { opacity: 0, duration: 0.3, delay: 0.8 });
        Sfx.waves(false);
      }, '+=0.05');
      // the scroll slides out of the bottle and unrolls in the light
      tl.add(() => {
        const n = rectCenter($('scrollIn')), w = rectCenter(wrap);
        gsap.set('#scrollIn', { opacity: 0 });
        gsap.set(scroll, { opacity: 1, x: n.x - w.x, y: n.y - w.y, scale: 0.3, scaleY: 0.08, rotation: -12 });
        Sfx.play('paper');
      }, '+=0.35')
        .to(scroll, { x: 0, y: -wrap.getBoundingClientRect().height * 0.55, scale: 1, scaleY: 0.08, rotation: 0, duration: 0.7, ease: 'power2.out' })
        .to(scroll, { scaleY: 1, duration: 0.8, ease: 'power3.out', onStart: () => Sfx.play('musicbox') });
      raysOn(tl, '<');
      tl.add(() => letterBurst(scroll), '+=0.5')
        .add(() => takeAway(wrap.querySelector('.bottle-btn')), '+=0.2')
        .add(() => showStory(), '+=0.95');
    },
  },
};

function showStory() {
  $('scene').style.pointerEvents = 'none';
  gsap.to('#scene', { opacity: 0, duration: 0.5, onComplete: () => ($('scene').hidden = true) });
  document.body.classList.remove('locked');
  scrollTo(0, 0);
  $('story').hidden = false;
  hideRevealTargets();
  gsap.to('#flash', { opacity: 0, duration: 1.1, ease: 'power2.out' });
  gsap.to('#rays', { opacity: 0.16, duration: 2 });
  goHome(0.2);
  revealIntro();
  setupScroll();
}

// ======================================================================
// 10. The story: each part is revealed as you scroll to it
// ======================================================================
function hideRevealTargets() {
  gsap.set(['#onceUpon .ch', '#title .ch', '#babyName', '#scrollCue'], { opacity: 0 });
  document.querySelectorAll('.slide .note').forEach((n) => gsap.set(n, { opacity: 0 }));
  gsap.set(['#secPhoto .polaroid', '#secPhoto .ribbon-hang', '#secDetails .panel', '#secWishes .panel', '#secClosing .panel'], { opacity: 0 });
}

function revealIntro() {
  const chars = gsap.utils.toArray('#title .ch');
  const tl = gsap.timeline({ delay: 0.5 });
  tl.to('#onceUpon .ch', { opacity: 1, duration: 0.05, stagger: 0.045, ease: 'none' })
    .fromTo(chars, { opacity: 0, y: -40, scale: 0.2, rotation: () => rand(-40, 40) },
      { opacity: 1, y: 0, scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(2.2)', stagger: 0.045 }, '-=0.2')
    .add(() => {
      $('title').classList.add('shimmer');
      const r = rectCenter($('title'));
      burst(r.x, r.y, 50, { power: 260, quiet: true });
      celebrationRain(30);
      Sfx.play('chime', [659, 988, 1318]);
    })
    .add(() => { if ($('babyName').hidden) return; const r = rectCenter($('babyName')); for (let i = 0; i < 16; i++) spawn(r.x + rand(-r.w / 2, r.w / 2), r.y + rand(-14, 14), { speed: rand(10, 50), life: rand(0.8, 1.4) }); })
    .fromTo('#babyName', { opacity: 0, scale: 0.6, letterSpacing: '0.8em' }, { opacity: 1, scale: 1, letterSpacing: '0.24em', duration: 0.9, ease: 'back.out(1.6)' }, '<')
    // the guide waves… and the hero passes by
    .add(() => { wave({ x: 0, y: H * 0.7 }, 2); }, '+=0.2')
    .add(() => runHero(), '+=0.5')
    .add(() => {
      Sound.play();
      if (Sound.hasVoice()) { $('voiceBtn').hidden = false; gsap.from('#voiceBtn', { y: 30, opacity: 0, duration: 0.5, ease: 'back.out(2)' }); }
    }, '+=0.6')
    .to('#scrollCue', { opacity: 1, duration: 0.6 }, '+=1.2');
}

function setupScroll() {
  ScrollTrigger.refresh();
  // the sky turns into a starry night as you scroll down
  ScrollTrigger.create({
    trigger: '#story', start: 'top top', end: 'bottom bottom', scrub: 0.6,
    onUpdate: (self) => { night = self.progress; document.documentElement.style.setProperty('--night', night.toFixed(3)); },
    animation: gsap.timeline()
      .to('#skyNight', { opacity: 0.92, ease: 'none' }, 0)
      .to('#land', { yPercent: 38, ease: 'none' }, 0)
      .to('#moon', { y: H * 0.05, scale: 1.15, ease: 'none' }, 0),
  });
  gsap.utils.toArray('#story .sec').forEach((sec) => {
    if (sec.id === 'secIntro' || sec.hidden) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 72%', once: true, onEnter: () => reveal(sec) });
  });
  ScrollTrigger.create({ trigger: '#secClosing', start: 'top 55%', onEnter: guideGoodbye, onLeaveBack: guideReturn });
  const hideCue = () => { if (scrollY > 40) { gsap.to('#scrollCue', { opacity: 0, duration: 0.4 }); gsap.to('#rays', { opacity: 0, duration: 1.2, overwrite: 'auto' }); removeEventListener('scroll', hideCue); } };
  addEventListener('scroll', hideCue, { passive: true });
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
}

function reveal(sec) {
  const kind = sec.dataset.kind;
  if (kind === 'slide') return revealSlide(sec);
  if (kind === 'photo') return revealPhoto(sec);
  if (kind === 'details') return revealPanel(sec, revealDetails);
  if (kind === 'wishes') return revealPanel(sec, revealWishes);
  if (kind === 'closing') return revealPanel(sec, revealClosing);
}

// The guide flies over and pulls the note out of the letter he carries
function guideDeliver(targetEl) {
  if (guide.gone) return;
  const r = targetEl.getBoundingClientRect();
  const right = r.right + guide.w * 0.42 < W;
  const tx = right ? r.right + guide.w * 0.1 : W - guide.w * 0.42;
  const ty = clamp(r.top - guide.h * 0.15, guide.h * 0.5, H - guide.h * 0.5);
  guideFly(tx, ty, { duration: 0.6, face: -1 });
  gsap.delayedCall(0.5, () => Sfx.play(T.sfx.deliver));
  gsap.delayedCall(0.55, () => wave(rectCenter(targetEl), 1));
  goHome(2.4);
}
function fromCarry(el) {          // start values so an element looks like it comes out of the guide's letter
  const e = guide.gone ? { x: W * 0.5, y: -40 } : carryPos();
  const c = rectCenter(el);
  return { x: e.x - c.x, y: e.y - c.y };
}

function revealSlide(sec) {
  const note = sec.querySelector('.note'), style = note.dataset.style;
  const text = note.querySelector('.note-text');
  guideDeliver(note);
  const from = fromCarry(note);
  const tl = gsap.timeline({ delay: 0.45 });
  const words = gsap.utils.toArray(text.querySelectorAll('.wd'));
  const chars = gsap.utils.toArray(text.querySelectorAll('.ch'));
  gsap.set(style === 'write' ? chars : words, { opacity: 0 });

  if (style === 'unfurl') {
    gsap.set(note.querySelectorAll('.rod'), { opacity: 1 });
    tl.fromTo(note, { opacity: 0, x: from.x, y: from.y, scaleX: 0.08, scaleY: 0.05, rotation: -10 },
      { opacity: 1, x: 0, y: 0, scaleX: 0.5, scaleY: 0.05, rotation: 0, duration: 0.7, ease: 'power2.out' })
      .add(() => Sfx.play('paper'))
      .to(note, { scaleX: 1, duration: 0.35, ease: 'power2.out' })
      .to(note, { scaleY: 1, duration: 0.9, ease: 'power3.out' });
  } else {
    tl.fromTo(note, { opacity: 0, x: from.x, y: from.y, scale: 0.06, rotation: -14 },
      { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, duration: 0.95, ease: 'back.out(1.15)' });
  }
  tl.add(() => { const c = rectCenter(note); burst(c.x, note.getBoundingClientRect().top, 18, { power: 160 }); });

  if (style === 'write') {
    tl.fromTo(chars, { opacity: 0, y: 6, filter: 'blur(3px)' }, {
      opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.3, ease: 'power1.out',
      stagger: { each: 0.022, onStart() { if (Math.random() < 0.3) { const c = rectCenter(this.targets()[0]); spawn(c.x, c.y, { speed: rand(10, 40), life: 0.6, size: 2.4 }); } } },
    });
  } else if (style === 'rise') {
    tl.fromTo(words, { opacity: 0, y: 22, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out', stagger: 0.06 });
  } else if (style === 'glow') {
    const glow = T.colors.glow;
    tl.fromTo(words, { opacity: 0, scale: 0.7, textShadow: '0 0 24px ' + glow }, { opacity: 1, scale: 1, textShadow: '0 0 0px ' + glow.replace(/,1\)$/, ',0)'), duration: 0.9, ease: 'power2.out', stagger: 0.09 });
  } else {
    tl.fromTo(words, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.04 });
  }
  tl.add(() => landOn(note, 0.06, 0.02));
}

function revealPhoto(sec) {
  const pol = sec.querySelector('.polaroid');
  guideDeliver(pol);
  gsap.timeline({ delay: 0.3 })
    .set('#secPhoto .ribbon-hang', { opacity: 1 })
    .fromTo('#secPhoto .ribbon-hang', { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'power2.out' })
    .fromTo(pol, { opacity: 0, y: -H * 0.4, rotation: 18 }, { opacity: 1, y: 0, rotation: 0, duration: 1.5, ease: 'elastic.out(1, .45)' }, '<0.1')
    .fromTo('#photo', { filter: 'brightness(2.4) sepia(.7) contrast(.5) blur(8px)' },
      { filter: 'brightness(1) sepia(0) contrast(1) blur(0px)', duration: 2.4, ease: 'power1.inOut' }, '<0.3')
    .add(() => {
      const c = rectCenter(pol);
      burst(c.x, c.y, 40, { power: 240, quiet: true });
      Sfx.play('chime', [1046, 1318, 1568], 0.08);
    }, '<0.4')
    .fromTo('#secPhoto .shine', { x: '-120%' }, { x: '120%', duration: 1.1, ease: 'power2.inOut' }, '>-1')
    .fromTo('#caption', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.6 }, '<')
    .add(() => {
      gsap.to(pol, { rotation: 2.5, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      landOn(pol, 0.92, 0.04);
    });
}

function revealPanel(sec, inner) {
  const panel = sec.querySelector('.panel');
  guideDeliver(panel);
  const from = fromCarry(panel);
  const tl = gsap.timeline({ delay: 0.4 });
  tl.fromTo(panel, { opacity: 0, x: from.x, y: from.y, scale: 0.08, rotation: -10 },
    { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, duration: 0.9, ease: 'back.out(1.2)' })
    .fromTo(panel.querySelector('h2') || panel.firstElementChild, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
  inner(sec, panel, tl);
}
function revealDetails(sec, panel, tl) {
  tl.fromTo(panel.querySelectorAll('.tag'), { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.25 })
    .fromTo(panel.querySelectorAll('.tag .ic'), { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(3)', stagger: { each: 0.25, onStart: () => Sfx.play('tap') } }, '<0.2')
    .fromTo(panel.querySelectorAll('.btn-row > *:not([hidden]), .small-link:not([hidden])'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 })
    .add(() => landOn(panel, 0.94, 0.02));
}
function revealWishes(sec, panel, tl) {
  panel.querySelectorAll('.wish').forEach((li, i) => {
    const icon = li.querySelector('.wicon'), txt = li.querySelector('.wish-text');
    const pos = i ? '-=0.15' : '-=0.1';
    if (T.id === 'teddy') {                          // a honey jar pops up and fills with honey
      tl.fromTo(icon, { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.5)' }, pos)
        .fromTo(icon.querySelector('.jar-fill'), { scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 100%', duration: 0.6, ease: 'power2.out' }, '<0.2')
        .add(() => { const c = rectCenter(icon); burst(c.x, c.y, 10, { power: 110, g: 40, kind: 'heart', color: undefined, quiet: true }); Sfx.play('plink', i); }, '<0.25');
    } else if (T.id === 'space') {                   // the line draws from the last star, then the star lights up
      const link = icon.querySelector('.link');
      if (link) tl.fromTo(link, { scaleY: 0 }, { scaleY: 1, duration: 0.35, ease: 'none' }, pos);
      tl.fromTo(icon, { scale: 0, rotation: -180 }, { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2.5)' }, link ? '>-0.05' : pos)
        .add(() => { const c = rectCenter(icon); burst(c.x, c.y, 12, { power: 120, g: 40, quiet: true }); Sfx.play('twinkle', i + 2); }, '<0.2');
    } else {                                         // a bubble floats up into place
      tl.fromTo(icon, { y: 70, scale: 0.4, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.8)' }, pos)
        .add(() => { const c = rectCenter(icon); for (let k = 0; k < 8; k++) spawn(c.x, c.y, { kind: 'bubble', angle: -Math.PI / 2, spreadA: 1, speed: rand(30, 90), g: -20, life: rand(0.6, 1.1), size: rand(1.8, 3.2) }); Sfx.play('bubble'); }, '<0.45');
    }
    tl.fromTo(txt, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, '<');
  });
  tl.add(() => landOn(panel, 0.06, 0.02));
}
function revealClosing(sec, panel, tl) {
  tl.fromTo('#secClosing .closing-line', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.2')
    .fromTo('#from', { opacity: 1, clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.5, ease: 'power1.inOut' })
    .fromTo('#actions > *:not([hidden]), #credit:not([hidden])', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'back.out(2)' }, '-=0.4')
    .add(() => {
      const c = rectCenter(panel);
      celebrationRain(50);
      miniFlurry(T.miniMotion === 'up' ? 7 : 8, c.x, c.y);
      Sfx.play('fanfare');
      landOn(panel, 0.5, 0.0);
    }, '-=0.6');
}

// At the end the guide waves goodbye and leaves; scroll back up and he returns
function guideGoodbye() {
  if (guide.gone || reduceMotion) return;
  if (guide.job) guide.job.kill();
  guide.job = gsap.delayedCall(2.6, () => {
    const h = guideHome();
    guideFly(h.x, h.y, { duration: 0.6, face: -1 }).then(() => {
      if (guide.gone || guide.flying) return;
      wave(null, 3);
      gsap.delayedCall(1.4, () => {
        guide.gone = true;
        Sfx.play('whoosh', 0.8, 0.08);
        guideFly(W + guide.w, -guide.h, { duration: 1.6, arc: -80, ease: 'power2.in', free: true });
      });
    });
  });
}
function guideReturn() {
  if (reduceMotion) return;
  if (guide.job) guide.job.kill();
  if (guide.gone) { guide.gone = false; guide.x = W + guide.w; guide.y = -guide.h; placeGuide(); }
  goHome(0);
}

// Calm version for people who turn off animations in their system settings
function simpleOpen() {
  $('scene').hidden = true;
  document.body.classList.remove('locked');
  $('story').hidden = false;
  gsap.set('#gCarry', { opacity: 1 });
  const h = guideHome(); guide.x = h.x; guide.y = h.y; placeGuide(); faceGuide(h.face, true);
  $('scrollCue').style.opacity = 1;
  setTimeout(() => { Sound.play(); if (Sound.hasVoice()) $('voiceBtn').hidden = false; }, 600);
}

// ======================================================================
// 11. Main loop, resize
// ======================================================================
let last = performance.now(), clock = 0, lastScroll = scrollY, lean = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now; clock += dt;
  drawAmbient(dt);
  drawFx(dt);
  updateCompanion(dt, clock);
  guideTrail(dt);
  // the guide leans a little as you scroll
  const v = (scrollY - lastScroll) / Math.max(dt, 0.001); lastScroll = scrollY;
  lean += (clamp(v / 120, -10, 10) - lean) * Math.min(1, dt * 5);
  const r = Math.abs(lean) < 0.05 ? 0 : Math.round(lean * 10) / 10;
  if (r !== frame.lastLean) { frame.lastLean = r; gsap.set(guide.flip, { rotation: r }); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

let resizeT;
addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    const oldW = W;
    sizeCanvases(); sizeGuide(); sizeCompanion();
    if (Math.abs(oldW - W) > 50) seedAmbient();
    if (!opened && !reduceMotion && !guide.flying) { const s = guideSpot(); guide.x = s.x; guide.y = s.y; placeGuide(); }
    if (opened && guide.atHome && !guide.gone) { const h = guideHome(); guide.x = h.x; guide.y = h.y; placeGuide(); }
  }, 150);
});

// ======================================================================
// 12. Voice, sound button, photo lightbox, share, replay
// ======================================================================
Sound.onChange((on) => {
  $('voiceBtn').classList.toggle('playing', on);
  $('voiceLabel').textContent = on ? 'Stop voice' : 'Play voice';
  Sfx.duck(on ? 0.3 : 1);                            // sound effects get quiet while the voice plays
});
$('voiceBtn').addEventListener('click', () => {
  Sound.unlock();
  Sound.isPlaying() ? Sound.stop() : Sound.play();
});

function showMute(m) {
  $('muteBtn').classList.toggle('muted', m);
  $('muteBtn').setAttribute('aria-label', m ? 'Turn sound effects on' : 'Turn sound effects off');
}
showMute(Sfx.isMuted());
Sfx.onChange(showMute);
$('muteBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  Sound.unlock();
  Sfx.setMuted(!Sfx.isMuted());
  if (!Sfx.isMuted()) { Sfx.play('tap'); if (!opened && T.opener === 'bottle') Sfx.waves(true); }
});

$('photoBtn').addEventListener('click', () => {
  $('lightImg').src = card.photoUrl;
  $('lightImg').alt = card.caption || 'Photo';
  $('lightCap').textContent = card.caption || '';
  $('lightCap').hidden = !card.caption;
  $('lightbox').hidden = false;
  gsap.fromTo('#lightbox', { opacity: 0 }, { opacity: 1, duration: 0.3 });
  gsap.fromTo('#lightbox figure', { scale: 0.6, rotation: -6, y: 40 }, { scale: 1, rotation: 0, y: 0, duration: 0.6, ease: 'back.out(1.5)' });
  $('lightClose').focus();
});
function closeLightbox() {
  gsap.to('#lightbox', { opacity: 0, duration: 0.25, onComplete: () => { $('lightbox').hidden = true; } });
}
$('lightbox').addEventListener('click', closeLightbox);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('lightbox').hidden) closeLightbox(); });

function toast(text) {
  $('toast').textContent = text;
  $('toast').classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => $('toast').classList.remove('show'), 2200);
}
$('share').addEventListener('click', async () => {
  const url = location.origin + (cardId ? '/c/' + cardId : '/' + (T.id !== DEFAULT_THEME ? '?theme=' + T.id : ''));
  if (navigator.share) { try { await navigator.share({ title: card.title, text: T.text.share, url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch (e) { prompt('Copy this link:', url); }
});
$('replay').addEventListener('click', () => { Sound.stop(); scrollTo(0, 0); location.reload(); });

boot();
