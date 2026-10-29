// ================= Card editor =================
const $ = (id) => document.getElementById(id);
const KEYS = 'babycard:keys';
const readKeys = () => { try { return JSON.parse(localStorage.getItem(KEYS) || '{}'); } catch (e) { return {}; } };
const saveKey = (id, key) => { try { const k = readKeys(); k[id] = key; localStorage.setItem(KEYS, JSON.stringify(k)); } catch (e) {} };
const TEXT_FIELDS = ['title', 'babyName', 'from', 'caption', 'tts', 'date', 'time', 'venue', 'wishes'];
const MAX_SLIDES = 8;

// ---------- Theme picker ----------
const SAMPLE_FIELDS = ['title', 'babyName', 'wishes', 'from', 'tts'];   // filled in from the theme's sample words
const GUIDE_NAME = { teddy: 'the teddy bear', space: 'the little astronaut', sailor: 'the seagull' };
const THEME_COLOR = { teddy: '#bfe0f5', space: '#1b2550', sailor: '#9fdcec' };
let theme = THEMES[new URLSearchParams(location.search).get('theme')] ? new URLSearchParams(location.search).get('theme') : DEFAULT_THEME;

$('tiles').innerHTML = THEME_IDS.map((id) => {
  const t = THEMES[id];
  return `<button type="button" class="tile" role="radio" data-theme="${id}" aria-checked="false">
    <span class="art"><div>${t.guide.svg}</div></span><b>${t.emoji} ${t.name}</b><small>${t.blurb}</small>
    <span class="sw">${t.swatch.map((c) => `<i style="background:${c}"></i>`).join('')}</span></button>`;
}).join('');

function setTheme(id) {
  theme = id;
  THEME_IDS.forEach((k) => document.body.classList.toggle('theme-' + k, k === id));
  document.querySelectorAll('.tile').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.theme === id)));
  $('topGuide').innerHTML = THEMES[id].guide.svg;
  $('sampleLink').href = '/?theme=' + id;
  $('slidesHint').textContent = 'Each page appears as guests scroll, delivered by ' + GUIDE_NAME[id] + '. Pick how its words appear.';
  document.querySelector('meta[name="theme-color"]').content = THEME_COLOR[id];
}
function fillSample(id) {
  const d = THEMES[id].defaults;
  SAMPLE_FIELDS.forEach((k) => ($(k).value = d[k] || ''));
  $('slides').textContent = '';
  d.slides.forEach((sl) => addSlide(sl));
  $('sampleNotice').hidden = true;
}
// true when the words are still exactly some theme's sample words (nothing typed by the user yet)
function isUntouched() {
  const now = readSlides();
  return THEME_IDS.some((id) => {
    const d = THEMES[id].defaults;
    return SAMPLE_FIELDS.every((k) => $(k).value === (d[k] || '')) &&
      now.length === d.slides.length && now.every((sl, i) => sl.text === d.slides[i].text && sl.style === d.slides[i].style);
  });
}
document.querySelectorAll('.tile').forEach((b) => b.addEventListener('click', () => {
  const id = b.dataset.theme;
  if (id === theme) return;
  const keep = !isUntouched();
  setTheme(id);
  if (keep) {
    $('sampleText').textContent = 'Your words were kept.';
    $('useSample').textContent = 'Use the ' + THEMES[id].name + ' sample words';
    $('sampleNotice').hidden = false;
  } else fillSample(id);
}));
$('useSample').onclick = () => {
  if (!confirm('Replace your title, story pages, wishes, voice text and signature with the ' + THEMES[theme].name + ' sample words?')) return;
  fillSample(theme);
};
setTheme(theme);

if (typeof BRAND !== 'undefined' && BRAND.shopName) {
  $('credit').hidden = false;
  $('credit').textContent = 'Made with love by ';
  const name = document.createElement(BRAND.shopUrl ? 'a' : 'span');
  name.textContent = BRAND.shopName;
  if (BRAND.shopUrl) { name.href = BRAND.shopUrl; name.target = '_blank'; name.rel = 'noopener'; }
  $('credit').append(name);
}

// ---------- Story pages (slides) ----------
function slideEls() { return [...$('slides').querySelectorAll('.slide-item')]; }
function addSlide(sl = { style: 'rise', text: '' }, focus) {
  if (slideEls().length >= MAX_SLIDES) return;
  const el = $('slideTpl').content.firstElementChild.cloneNode(true);
  el.querySelector('select').value = ['write', 'rise', 'unfurl', 'glow'].includes(sl.style) ? sl.style : 'rise';
  el.querySelector('textarea').value = sl.text || '';
  el.querySelector('.up').onclick = () => { if (el.previousElementSibling) el.parentNode.insertBefore(el, el.previousElementSibling); renumber(); el.querySelector('.up').focus(); };
  el.querySelector('.down').onclick = () => { if (el.nextElementSibling) el.parentNode.insertBefore(el.nextElementSibling, el); renumber(); el.querySelector('.down').focus(); };
  el.querySelector('.del').onclick = () => {
    if (el.querySelector('textarea').value.trim() && !confirm('Remove this page?')) return;
    el.remove(); renumber();
  };
  $('slides').append(el);
  renumber();
  if (focus) el.querySelector('textarea').focus();
}
function renumber() {
  const list = slideEls();
  list.forEach((el, i) => {
    el.querySelector('.num').textContent = 'Page ' + (i + 1);
    el.querySelector('.up').disabled = i === 0;
    el.querySelector('.down').disabled = i === list.length - 1;
  });
  $('addSlide').disabled = list.length >= MAX_SLIDES;
  $('slideCount').textContent = list.length >= MAX_SLIDES ? 'That’s the most pages a card can have.' : '';
}
function readSlides() {
  return slideEls().map((el) => ({ style: el.querySelector('select').value, text: el.querySelector('textarea').value.trim() }))
    .filter((s) => s.text);
}
$('addSlide').onclick = () => addSlide({ style: 'rise', text: '' }, true);

// ---------- Load an existing card for editing ----------
const params = new URLSearchParams(location.search);
let cardId = params.get('id');
let editKey = params.get('key') || (cardId && readKeys()[cardId]) || null;
if (cardId && params.get('key')) {                 // remember the key, then hide it from the address bar
  saveKey(cardId, editKey);
  history.replaceState(null, '', '/create.html?id=' + cardId);
}

// What we'll send. "existing" = already on the server; "removed" = user pressed Remove
const photo = { blob: null, existing: false, removed: false, url: null, blobUrl: null };
const voice = { blob: null, existing: false, removed: false, url: null, blobUrl: null };

if (cardId) {
  $('heading').textContent = 'Edit your card';
  $('lead').textContent = 'Change anything you like, then save. The same link will show the new version.';
  if (!editKey) showError('This browser does not have the edit key for this card. Open your private edit link to make changes.');
  // Lock the form until the saved card is in, so nothing typed gets overwritten
  const fields = document.querySelectorAll('main input, main textarea, main button, main select');
  fields.forEach((el) => (el.disabled = true));
  TEXT_FIELDS.forEach((k) => ($(k).value = ''));
  $('go').textContent = 'Loading your card…';
  fetch('/api/cards/' + encodeURIComponent(cardId), { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((c) => {
      setTheme(THEMES[c.theme] ? c.theme : DEFAULT_THEME);
      TEXT_FIELDS.forEach((k) => ($(k).value = c[k] || ''));
      const slides = Array.isArray(c.slides) && c.slides.length ? c.slides : (c.message ? [{ style: 'rise', text: c.message }] : []);
      slides.forEach((s) => addSlide(s));
      if (c.photoUrl) { photo.existing = true; photo.url = c.photoUrl; showThumb(c.photoUrl); }
      if (c.voiceUrl) { voice.existing = true; voice.url = c.voiceUrl; showPlayer(c.voiceUrl, 'Your saved audio'); }
    })
    .catch(() => showError('Could not load this card. It may have been deleted.'))
    .finally(() => {
      document.querySelectorAll('main input, main textarea, main button, main select').forEach((el) => (el.disabled = false));
      renumber();
      $('go').textContent = editKey ? 'Save changes' : 'Save as a new card';
    });
} else {
  fillSample(theme);
}

function showError(msg) { $('error').textContent = msg; $('error').hidden = !msg; }

// ---------- Photo: shrink to a JPEG (fast upload, works on every phone) ----------
function showThumb(src) { $('thumb').src = src; $('thumb').style.display = 'block'; $('photoClear').hidden = false; }

async function shrinkPhoto(file, max = 1600) {
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    return await new Promise((res) => c.toBlob((b) => res(b || file), 'image/jpeg', 0.86));
  } catch (e) {
    return file;              // the browser can't read it (e.g. HEIC on Windows): send the original
  }
}
$('photoIn').onchange = async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  $('photoIn').disabled = true;
  photo.blob = await shrinkPhoto(f);
  photo.removed = false;
  photo.blobUrl = URL.createObjectURL(photo.blob);
  showThumb(photo.blobUrl);
  $('photoIn').disabled = false;
};
$('photoClear').onclick = () => {
  photo.blob = null; photo.blobUrl = null; photo.removed = true;
  $('thumb').style.display = 'none'; $('photoClear').hidden = true;
};

// ---------- Voice ----------
function showPlayer(src, note) {
  $('player').src = src; $('player').style.display = 'block';
  $('status').textContent = note; $('audClear').hidden = false;
}
function setVoice(blob, note) {
  voice.blob = blob; voice.removed = false;
  voice.blobUrl = URL.createObjectURL(blob);
  showPlayer(voice.blobUrl, note);
}
$('audIn').onchange = (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  if (f.size > 25 * 1024 * 1024) { $('status').textContent = 'That file is over 25 MB. Please choose a shorter one.'; return; }
  setVoice(f, 'Loaded: ' + f.name);
};
$('audClear').onclick = () => {
  voice.blob = null; voice.blobUrl = null; voice.removed = true;
  $('player').pause(); $('player').style.display = 'none'; $('status').textContent = ''; $('audClear').hidden = true;
};

// Recording. Phones record in different formats (Chrome: webm, iPhone: mp4) and iPhones
// cannot play webm, so the recording is converted to WAV, which every device can play.
let recorder = null, chunks = [], recTimer = null, recStart = 0;
const MAX_SEC = 120;
$('rec').onclick = async () => {
  if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    $('status').textContent = 'This browser cannot record. Please upload an audio file instead.'; return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = async () => {
      clearInterval(recTimer);
      stream.getTracks().forEach((t) => t.stop());
      $('rec').classList.remove('rec-on'); $('recLabel').textContent = 'Record again';
      $('status').textContent = 'Preparing your recording…';
      const raw = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      const wav = await toWav(raw).catch(() => null);
      setVoice(wav || raw, 'Recording saved. Press play to check it.');
    };
    recorder.start(250);
    recStart = Date.now();
    $('rec').classList.add('rec-on');
    recTimer = setInterval(() => {
      const s = Math.floor((Date.now() - recStart) / 1000);
      $('recLabel').textContent = `Stop (${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')})`;
      if (s >= MAX_SEC) recorder.stop();
    }, 250);
    $('recLabel').textContent = 'Stop (0:00)';
    $('status').textContent = 'Recording. Speak now.';
  } catch (err) {
    $('status').textContent = 'Microphone blocked. Allow it in the browser settings, or upload a file instead.';
  }
};

// Decode the recording and write it as a 24 kHz mono WAV
async function toWav(blob) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ac = new AC();
  const decoded = await new Promise((res, rej) => {
    blob.arrayBuffer().then((ab) => { const p = ac.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }, rej);
  });
  ac.close && ac.close();
  const rate = 24000;
  const off = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, Math.ceil(decoded.duration * rate), rate);
  const src = off.createBufferSource();
  src.buffer = decoded; src.connect(off.destination); src.start();
  const out = (await off.startRendering()).getChannelData(0);

  // gentle normalise so quiet recordings are easy to hear
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  const gain = peak > 0 ? Math.min(4, 0.9 / peak) : 1;

  const buf = new ArrayBuffer(44 + out.length * 2), v = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + out.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, out.length * 2, true);
  for (let i = 0; i < out.length; i++) {
    const s = Math.max(-1, Math.min(1, out[i] * gain));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}

// Try the computer voice
$('ttsTry').onclick = () => {
  if (!window.speechSynthesis) { $('status').textContent = 'This browser has no computer voice.'; return; }
  if (Sound.isPlaying()) { Sound.stop(); return; }
  Sound.load({ tts: $('tts').value });
  Sound.unlock();
  Sound.play();
};
Sound.onChange((on) => { $('ttsTry').textContent = on ? '■ Stop' : '▶ Hear the computer voice'; });

// ---------- Preview (shows unsaved changes in a new tab) ----------
function draft() {
  const d = { theme, slides: readSlides() };
  TEXT_FIELDS.forEach((k) => (d[k] = $(k).value));
  d.photoUrl = photo.blobUrl || (photo.existing && !photo.removed ? photo.url : null);
  d.voiceUrl = voice.blobUrl || (voice.existing && !voice.removed ? voice.url : null);
  return d;
}
$('preview').onclick = () => {
  try { localStorage.setItem('babycard:preview', JSON.stringify(draft())); }
  catch (e) { showError('Preview needs browser storage, which is turned off here.'); return; }
  window.open('/?preview=1', '_blank');
};

// ---------- Save ----------
function send(method, url, body) {        // XHR so we can show upload progress
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open(method, url);
    if (editKey) x.setRequestHeader('X-Edit-Key', editKey);
    x.upload.onprogress = (e) => { if (e.lengthComputable) $('progress').firstElementChild.style.width = (e.loaded / e.total * 100) + '%'; };
    x.onload = () => {
      let data = {};
      try { data = JSON.parse(x.responseText); } catch (e) {}
      x.status < 300 ? resolve(data) : reject(new Error(data.error || 'Save failed (' + x.status + ')'));
    };
    x.onerror = () => reject(new Error('Could not reach the server. Check your connection.'));
    x.send(body);
  });
}

$('go').onclick = async () => {
  showError('');
  if (recorder && recorder.state === 'recording') { showError('Stop the recording first.'); return; }
  if (!$('title').value.trim() && !readSlides().length) { showError('Add a title or at least one story page first.'); return; }
  const fd = new FormData();
  TEXT_FIELDS.forEach((k) => fd.append(k, $(k).value));
  fd.append('theme', theme);
  fd.append('slides', JSON.stringify(readSlides()));
  if (photo.blob) fd.append('photo', photo.blob, 'photo.' + ((photo.blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')));
  else if (photo.removed) fd.append('removePhoto', '1');
  if (voice.blob) fd.append('voice', voice.blob, voice.blob.name || 'voice.' + (voice.blob.type.includes('wav') ? 'wav' : 'audio'));
  else if (voice.removed) fd.append('removeVoice', '1');

  $('go').disabled = true; $('go').textContent = 'Saving…';
  $('progress').style.display = 'block'; $('progress').firstElementChild.style.width = '0';
  try {
    const res = cardId && editKey
      ? await send('PUT', '/api/cards/' + cardId, fd)
      : await send('POST', '/api/cards', fd);
    if (res.editKey) { cardId = res.id; editKey = res.editKey; saveKey(cardId, editKey); history.replaceState(null, '', '/create.html?id=' + cardId); }
    // what's on the server now
    photo.existing = !!res.photoUrl; photo.url = res.photoUrl; photo.blob = null; photo.blobUrl = null; photo.removed = false;
    voice.existing = !!res.voiceUrl; voice.url = res.voiceUrl; voice.blob = null; voice.blobUrl = null; voice.removed = false;
    showDone();
  } catch (err) {
    showError(err.message);
  } finally {
    $('go').disabled = false; $('go').textContent = 'Save changes';
    $('progress').style.display = 'none';
  }
};

function showDone() {
  const share = location.origin + '/c/' + cardId;
  $('shareLink').value = share;
  $('editLink').value = location.origin + '/create.html?id=' + cardId + '&key=' + encodeURIComponent(editKey);
  $('openCard').href = '/c/' + cardId;
  $('whatsapp').href = 'https://wa.me/?text=' + encodeURIComponent(THEMES[theme].text.share + ' ' + share);
  $('done').classList.add('show');
  $('done').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  const input = $(b.dataset.copy);
  try { await navigator.clipboard.writeText(input.value); } catch (e) { input.select(); document.execCommand('copy'); }
  b.textContent = 'Copied!'; setTimeout(() => (b.textContent = 'Copy'), 1500);
}));
