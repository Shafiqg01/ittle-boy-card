// Little boy card backend: saves cards (theme + text + photo + voice) and serves the pages.
// Run:  npm install  &&  npm start      → http://localhost:3000
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const CARDS_DIR = path.join(DATA_DIR, 'cards');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');
fs.mkdirSync(CARDS_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const LIMITS = { title: 120, message: 1000, from: 120, caption: 80, tts: 1000, babyName: 60, venue: 160, wishes: 600 };
const SLIDE_STYLES = ['write', 'rise', 'unfurl', 'glow'];
const THEMES = ['teddy', 'space', 'sailor'];          // keep in sync with public/themes.js
const DEFAULT_THEME = 'teddy';
const THEME_PREVIEW = {                                 // the line shown under the title in WhatsApp/iMessage link previews
  teddy: 'A little bear has a card for you 🧸',
  space: 'A little astronaut has a card for you 🚀',
  sailor: 'A message in a bottle for you ⛵',
};
const MAX_SLIDES = 8, SLIDE_MAX = 500;
const EXT = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'image/heic': '.heic', 'image/heif': '.heif', 'image/avif': '.avif',
  'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/wave': '.wav', 'audio/mpeg': '.mp3', 'audio/mp3': '.mp3',
  'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a', 'audio/aac': '.aac', 'audio/ogg': '.ogg',
  'audio/webm': '.webm', 'audio/flac': '.flac',
};

// ---------- helpers ----------
const newId = (bytes) => crypto.randomBytes(bytes).toString('base64url');
const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const validId = (id) => /^[A-Za-z0-9_-]{6,32}$/.test(id);
const cardPath = (id) => path.join(CARDS_DIR, id + '.json');

async function readCard(id) {
  if (!validId(id)) return null;
  try { return JSON.parse(await fsp.readFile(cardPath(id), 'utf8')); } catch { return null; }
}
async function writeCard(card) {
  const tmp = cardPath(card.id) + '.' + newId(4) + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(card, null, 2));
  await fsp.rename(tmp, cardPath(card.id));          // atomic replace
}
async function removeUpload(name) {
  if (name && /^[A-Za-z0-9_.-]+$/.test(name)) await fsp.unlink(path.join(UPLOADS_DIR, name)).catch(() => {});
}
function keyMatches(card, key) {
  if (!key) return false;
  const a = Buffer.from(card.editKeyHash, 'hex'), b = Buffer.from(hash(key), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
// What the public viewer is allowed to see (never the edit key)
function publicCard(c) {
  return {
    id: c.id, theme: THEMES.includes(c.theme) ? c.theme : DEFAULT_THEME,
    title: c.title, message: c.message, from: c.from, caption: c.caption,
    tts: c.tts,
    babyName: c.babyName || '', date: c.date || '', time: c.time || '', venue: c.venue || '', wishes: c.wishes || '',
    slides: slidesOf(c),
    photoUrl: c.photo ? '/uploads/' + c.photo : null,
    voiceUrl: c.voice ? '/uploads/' + c.voice : null,
    updatedAt: c.updatedAt,
  };
}
// Older cards have one "message"; newer ones have a list of slides
function slidesOf(c) {
  if (Array.isArray(c.slides) && c.slides.length) return c.slides;
  return c.message ? [{ text: c.message, style: 'rise' }] : [];
}
function cleanText(body) {
  const out = {};
  for (const [k, max] of Object.entries(LIMITS)) {
    if (body[k] !== undefined) out[k] = String(body[k]).replace(/\r\n/g, '\n').slice(0, max);
  }
  if (body.theme !== undefined) out.theme = THEMES.includes(body.theme) ? body.theme : DEFAULT_THEME;
  // date as YYYY-MM-DD and time as HH:MM, or empty
  if (body.date !== undefined) out.date = /^\d{4}-\d{2}-\d{2}$/.test(body.date) && !isNaN(Date.parse(body.date)) ? body.date : '';
  if (body.time !== undefined) out.time = /^([01]\d|2[0-3]):[0-5]\d$/.test(body.time) ? body.time : '';
  if (body.slides !== undefined) {
    let list = [];
    try { list = JSON.parse(body.slides); } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    out.slides = list
      .map((sl) => ({
        text: String((sl && sl.text) || '').replace(/\r\n/g, '\n').trim().slice(0, SLIDE_MAX),
        style: SLIDE_STYLES.includes(sl && sl.style) ? sl.style : 'rise',
      }))
      .filter((sl) => sl.text)
      .slice(0, MAX_SLIDES);
    out.message = '';            // slides replace the old single message
  }
  return out;
}

// ---------- uploads ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => cb(null, newId(12) + (EXT[file.mimetype.split(';')[0]] || '')),
  }),
  limits: { fileSize: 25 * 1024 * 1024, files: 2, fields: 20 },
  fileFilter: (req, file, cb) => {
    const type = file.mimetype.split(';')[0];
    const ok = (file.fieldname === 'photo' && type.startsWith('image/')) ||
               (file.fieldname === 'voice' && (type.startsWith('audio/') || type === 'video/webm' || type === 'video/mp4'));
    cb(ok ? null : Object.assign(new Error('That file type is not allowed for ' + file.fieldname), { status: 400 }), ok);
  },
}).fields([{ name: 'photo', maxCount: 1 }, { name: 'voice', maxCount: 1 }]);

function withUpload(handler) {
  return (req, res, next) => upload(req, res, async (err) => {
    const files = Object.values(req.files || {}).flat();
    const cleanup = () => Promise.all(files.map((f) => removeUpload(f.filename)));
    if (err) {
      await cleanup();
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 25 MB).' : err.message;
      return res.status(err.status || 400).json({ error: msg });
    }
    try { await handler(req, res); } catch (e) { await cleanup(); next(e); }
  });
}
const fileOf = (req, field) => (req.files && req.files[field] && req.files[field][0]) || null;

// ---------- app ----------
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);   // correct https links when hosted behind a proxy (Render, Railway, nginx…)

// API responses must never be cached, so edits always show up straight away
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

// Create a card
app.post('/api/cards', withUpload(async (req, res) => {
  const now = new Date().toISOString();
  const editKey = newId(18);
  const photo = fileOf(req, 'photo'), voice = fileOf(req, 'voice');
  const card = {
    id: newId(8), editKeyHash: hash(editKey), theme: DEFAULT_THEME,
    title: '', message: '', from: '', caption: '', tts: '',
    babyName: '', date: '', time: '', venue: '', wishes: '', slides: [],
    ...cleanText(req.body),
    photo: photo ? photo.filename : null,
    voice: voice ? voice.filename : null,
    createdAt: now, updatedAt: now,
  };
  await writeCard(card);
  res.status(201).json({ ...publicCard(card), editKey });
}));

// Read a card (public)
app.get('/api/cards/:id', async (req, res) => {
  const card = await readCard(req.params.id);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  res.json(publicCard(card));
});

// Update a card (needs the private edit key)
app.put('/api/cards/:id', withUpload(async (req, res) => {
  const card = await readCard(req.params.id);
  const photo = fileOf(req, 'photo'), voice = fileOf(req, 'voice');
  if (!card || !keyMatches(card, req.get('X-Edit-Key'))) {
    await Promise.all([photo, voice].filter(Boolean).map((f) => removeUpload(f.filename)));
    return res.status(card ? 403 : 404).json({ error: card ? 'Wrong edit key' : 'Card not found' });
  }
  Object.assign(card, cleanText(req.body));
  if (photo || req.body.removePhoto === '1') { await removeUpload(card.photo); card.photo = photo ? photo.filename : null; }
  if (voice || req.body.removeVoice === '1') { await removeUpload(card.voice); card.voice = voice ? voice.filename : null; }
  card.updatedAt = new Date().toISOString();
  await writeCard(card);
  res.json(publicCard(card));
}));

// Delete a card
app.delete('/api/cards/:id', async (req, res) => {
  const card = await readCard(req.params.id);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  if (!keyMatches(card, req.get('X-Edit-Key'))) return res.status(403).json({ error: 'Wrong edit key' });
  await Promise.all([removeUpload(card.photo), removeUpload(card.voice), fsp.unlink(cardPath(card.id))]);
  res.json({ ok: true });
});

// Uploaded files never change (new upload = new name), so they can be cached for long
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true, fallthrough: false }));
// Self-hosted fonts (from the @fontsource packages)
for (const pkg of ['fredoka', 'baloo-2', 'pacifico', 'nunito', 'caveat']) {
  app.use('/fonts', express.static(path.join(path.dirname(require.resolve(`@fontsource/${pkg}/package.json`)), 'files'), { maxAge: '365d', immutable: true }));
}
app.get('/vendor/gsap.min.js', (req, res) => res.sendFile(require.resolve('gsap/dist/gsap.min.js')));
app.get('/vendor/ScrollTrigger.min.js', (req, res) => res.sendFile(require.resolve('gsap/dist/ScrollTrigger.min.js')));

// Calendar invite for the event (works on iPhone, Android, Outlook…)
const icsText = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
app.get('/c/:id/invite.ics', async (req, res) => {
  const card = await readCard(req.params.id);
  if (!card || !card.date) return res.status(404).type('text').send('No event date on this card');
  const d = card.date.replace(/-/g, '');
  let start, end;
  if (card.time) {
    const [h, m] = card.time.split(':').map(Number);
    const endH = Math.min(h + 2, 23), endM = h + 2 > 23 ? 59 : m;
    start = `DTSTART:${d}T${card.time.replace(':', '')}00`;
    end = `DTEND:${d}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;
  } else {
    const next = new Date(card.date + 'T00:00:00Z'); next.setUTCDate(next.getUTCDate() + 1);
    start = `DTSTART;VALUE=DATE:${d}`;
    end = `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, '')}`;
  }
  const origin = req.protocol + '://' + req.get('host');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Baby Card//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${card.id}@babycard`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    start, end, `SUMMARY:${icsText(card.title || 'Baby shower')}`,
    card.venue ? `LOCATION:${icsText(card.venue)}` : '',
    `DESCRIPTION:${icsText((card.from ? card.from + '\n' : '') + origin + '/c/' + card.id)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean);
  res.set('Cache-Control', 'no-cache').type('text/calendar; charset=utf-8')
    .set('Content-Disposition', 'attachment; filename="baby-shower.ics"').send(lines.join('\r\n') + '\r\n');
});

// Shared card link: the viewer page with the card's title in the link preview (WhatsApp, etc.)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
app.get('/c/:id', async (req, res) => {
  const card = await readCard(req.params.id);
  let html = await fsp.readFile(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
  if (card) {
    const origin = req.protocol + '://' + req.get('host');
    const meta = [
      `<meta property="og:title" content="${esc(card.title || 'You have a card!')}">`,
      `<meta property="og:description" content="${esc((THEME_PREVIEW[card.theme] || THEME_PREVIEW[DEFAULT_THEME]) + ' ' + (card.from || ''))}">`,
      card.photo ? `<meta property="og:image" content="${esc(origin + '/uploads/' + card.photo)}">` : '',
    ].join('\n  ');
    html = html.replace('<title>Baby Card</title>', `<title>${esc(card.title || 'Baby Card')}</title>\n  ${meta}`);
  }
  res.set('Cache-Control', 'no-cache').type('html').send(html);
});

// Pages, CSS, JS. "no-cache" = the browser re-checks each time, so updated files show immediately
app.use(express.static(PUBLIC_DIR, { setHeaders: (res) => res.set('Cache-Control', 'no-cache') }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

app.listen(PORT, () => console.log(`Little boy card running on http://localhost:${PORT}`));
