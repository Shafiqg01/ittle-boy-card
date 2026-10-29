// Sound for the card: the voice-over (recorded/uploaded audio) and the computer voice.
//
// Why the old version often stayed silent:
//  • It "unlocked" the audio with a MUTED play. Muted playback doesn't count as permission on
//    iPhone/Safari, so the real play() a few seconds later was blocked.
//  • Chrome records .webm, which iPhones can't play.  (The editor now saves recordings as .wav.)
//  • Long computer-voice text gets cut off in Chrome after ~15 s, and voices load late.
//
// Now everything goes through ONE Web Audio context that is switched on inside the tap on the
// seal. Once it is running, it can play at any time, so the voice starts exactly when the card opens.
const Sound = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let buffer = null;        // decoded voice-over
  let fallbackEl = null;    // <audio> used if this browser can't decode the file
  let source = null;        // what's playing now
  let ttsText = '';
  let loading = null;       // promise while the voice file downloads/decodes
  let wantPlay = false;     // play() was asked for before the file was ready
  let playing = false;
  const listeners = new Set();

  const getCtx = () => (ctx = ctx || (AC ? new AC() : null));
  const setPlaying = (v) => { playing = v; listeners.forEach((fn) => fn(v)); };

  function decode(ab) {        // works with both promise and old callback Safari versions
    return new Promise((resolve, reject) => {
      const p = getCtx().decodeAudioData(ab, resolve, reject);
      if (p && p.then) p.then(resolve, reject);
    });
  }

  // Start downloading + decoding as soon as the card data arrives (before the tap)
  function load({ url, tts }) {
    ttsText = (tts || '').trim();
    if (!url) return Promise.resolve();
    loading = fetch(url)
      .then((r) => { if (!r.ok) throw new Error('voice download failed'); return r.arrayBuffer(); })
      .then(decode)
      .then((b) => { buffer = b; })
      .catch(() => {                       // e.g. an iPhone given a .webm: let <audio> try instead
        fallbackEl = new Audio(url);
        fallbackEl.preload = 'auto';
        fallbackEl.playsInline = true;
        fallbackEl.addEventListener('ended', () => setPlaying(false));
      })
      .finally(() => { loading = null; if (wantPlay) { wantPlay = false; play(); } });
    return loading;
  }

  // MUST be called directly inside a tap/click handler
  function unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {} // iPhone: play even with the silent switch on
    const c = getCtx();
    if (c) {
      if (c.state !== 'running') c.resume();
      const s = c.createBufferSource();          // a tiny silent sound, as iOS requires
      s.buffer = c.createBuffer(1, 1, 22050);
      s.connect(c.destination); s.start(0);
    }
    if (fallbackEl) {                            // real (unmuted) play inside the tap, then pause
      fallbackEl.play().then(() => { if (!wantPlay && !playing) { fallbackEl.pause(); fallbackEl.currentTime = 0; } }).catch(() => {});
    }
    if (ttsText && window.speechSynthesis) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      speechSynthesis.speak(u);
    }
  }

  function chime(notes = [880, 1318], vol = 0.12) {
    const c = getCtx();
    if (!c) return;
    notes.forEach((freq, i) => {
      const o = c.createOscillator(), g = c.createGain();
      const t = c.currentTime + i * 0.12;
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + 1.3);
    });
  }

  // ----- computer voice -----
  function pickVoice() {
    const vs = speechSynthesis.getVoices();
    const en = vs.filter((v) => /^en/i.test(v.lang));
    return en.find((v) => /samantha|google uk english female|zira|karen|moira|tessa|victoria|female/i.test(v.name))
      || en.find((v) => v.default) || en[0] || null;
  }
  function chunks(text) {   // short sentences, so Chrome doesn't cut off long text
    const parts = text.match(/[^.!?\n]+[.!?]*\s*/g) || [text];
    const out = [];
    for (const p of parts) {
      const s = p.trim();
      if (!s) continue;
      if (out.length && (out[out.length - 1] + ' ' + s).length < 160) out[out.length - 1] += ' ' + s;
      else out.push(s);
    }
    return out;
  }
  let run = 0;   // ignores "ended" events from an older, cancelled run
  function speak() {
    speechSynthesis.cancel();
    const my = ++run;
    const voice = pickVoice();
    const list = chunks(ttsText);
    list.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) { u.voice = voice; u.lang = voice.lang; }
      u.rate = 0.95; u.pitch = 1.1;
      const done = () => { if (my === run) setPlaying(false); };
      if (i === list.length - 1) { u.onend = done; }
      u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') done(); };
      speechSynthesis.speak(u);
    });
    speechSynthesis.resume();               // Chrome sometimes starts paused
    setPlaying(true);
  }
  if (window.speechSynthesis) speechSynthesis.getVoices();   // start loading voices early

  // ----- play / stop -----
  function play() {
    stop();
    if (loading) { wantPlay = true; setPlaying(true); return; }
    if (buffer && ctx) {
      if (ctx.state !== 'running') ctx.resume();
      source = ctx.createBufferSource();
      source.buffer = buffer;
      const g = ctx.createGain(); g.gain.value = 1;
      source.connect(g).connect(ctx.destination);
      const s = source;
      s.onended = () => { if (source === s) { source = null; setPlaying(false); } };
      s.start();
      setPlaying(true);
    } else if (fallbackEl) {
      fallbackEl.currentTime = 0;
      fallbackEl.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else if (ttsText && window.speechSynthesis) {
      speak();
    }
  }
  function stop() {
    wantPlay = false;
    run++;
    if (source) { const s = source; source = null; try { s.stop(); } catch (e) {} }
    if (fallbackEl) fallbackEl.pause();
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (playing) setPlaying(false);
  }

  return {
    load, unlock, chime, play, stop,
    ctx: getCtx,                  // shared with the sound effects (sfx.js)
    hasVoice: () => !!(loading || buffer || fallbackEl || (ttsText && window.speechSynthesis)),
    isPlaying: () => playing,
    onChange: (fn) => listeners.add(fn),
  };
})();
