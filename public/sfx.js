// ================= Sound effects =================
// Every sound is made in the browser with the Web Audio API (no audio files, nothing to license).
// They are soft and short, share the same audio context as the voice-over (see voice.js),
// get quieter while the voice-over plays, and can be muted with the speaker button.
const Sfx = (() => {
  const VOL = 1;
  // per-sound loudness, so the small sounds (taps, bubbles, paper) are as easy to hear as the big ones
  const BOOST = { sparkle: 2.2, twinkle: 2, pop: 3, paper: 4, whoosh: 2, boing: 3, blip: 2.4, chirp: 3, chug: 4, bubble: 4, plink: 4, beep: 2.2, squeak: 6, flap: 5, tap: 5, chime: 1.6, cork: 1.3 };
  let gmul = 1;
  const KEY = 'babycard:muted';
  let muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) {}
  let master = null, duck = 1, noiseBuf = null;
  const listeners = new Set();

  const ctx = () => (typeof Sound !== 'undefined' ? Sound.ctx() : null);
  function out() {
    const c = ctx();
    if (!c || c.state !== 'running') return null;
    if (!master) {
      master = c.createGain();
      master.gain.value = muted ? 0 : VOL * duck;
      const comp = c.createDynamicsCompressor();       // keeps several overlapping sounds from clipping
      comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp).connect(c.destination);
    }
    return muted ? null : master;
  }
  function noise() {
    const c = ctx();
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = w * 0.6 + last * 3; }
    }
    return noiseBuf;
  }

  // ---- building blocks ----
  function tone(freq, o = {}) {
    const dest = out(); if (!dest) return;
    const c = ctx(), t = c.currentTime + (o.t || 0), dur = o.dur || 0.3;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.slide || dur));
    if (o.vib) {
      const l = c.createOscillator(), lg = c.createGain();
      l.frequency.value = o.vib; lg.gain.value = freq * 0.012;
      l.connect(lg).connect(osc.frequency); l.start(t); l.stop(t + dur + 0.05);
    }
    const v = (o.vol || 0.15) * gmul, a = o.attack || 0.006;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    if (o.hold) g.gain.setValueAtTime(v, t + a + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc.connect(g);
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; node = g.connect(f); }
    node.connect(dest);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function hiss(o = {}) {
    const dest = out(); if (!dest) return;
    const c = ctx(), t = c.currentTime + (o.t || 0), dur = o.dur || 0.4;
    const src = c.createBufferSource(); src.buffer = noise();
    src.playbackRate.value = o.rate || 1;
    const f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.freq || 1500, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = c.createGain(), v = (o.vol || 0.12) * gmul, a = o.attack || 0.02;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  const bell = (f, t = 0, vol = 0.07, dur = 1.1) => { tone(f, { t, vol, dur }); tone(f * 2.01, { t, vol: vol * 0.35, dur: dur * 0.6 }); tone(f * 3.98, { t, vol: vol * 0.12, dur: dur * 0.3 }); };
  const PENTA = [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637];

  // ---- the sounds ----
  let lastSparkle = 0;
  const S = {
    sparkle() {                                      // light glitter (throttled so bursts stay gentle)
      const now = performance.now(); if (now - lastSparkle < 90) return; lastSparkle = now;
      for (let i = 0; i < 3; i++) tone(PENTA[3 + (Math.random() * 5 | 0)] * 1.5, { t: i * 0.06, vol: 0.035, dur: 0.35 });
    },
    chime(notes = [880, 1318], gap = 0.12) { notes.forEach((f, i) => bell(f, i * gap, 0.06)); },
    twinkle(i = 0) { bell(PENTA[i % PENTA.length], 0, 0.07, 1.4); },
    musicbox() { [1047, 1319, 1568, 2093, 1568, 1319, 1568, 2093, 2637].forEach((f, i) => bell(f, i * 0.15, 0.055, 1.2)); },
    fanfare() { [784, 988, 1175, 1568, 1976].forEach((f, i) => bell(f, i * 0.09, 0.06, 1.4)); [784, 988, 1175].forEach((f) => bell(f, 0.55, 0.04, 1.8)); },
    pop() { tone(620, { to: 140, slide: 0.09, dur: 0.12, vol: 0.22 }); hiss({ freq: 2200, q: 2, dur: 0.05, vol: 0.12, attack: 0.002 }); },
    cork() {
      tone(900, { to: 1700, slide: 0.12, dur: 0.14, vol: 0.05, type: 'triangle' });
      tone(700, { t: 0.16, to: 160, slide: 0.08, dur: 0.12, vol: 0.28 });
      hiss({ t: 0.16, freq: 2600, q: 1.5, dur: 0.07, vol: 0.18, attack: 0.002 });
      hiss({ t: 0.2, freq: 5000, type: 'highpass', dur: 0.5, vol: 0.05 });
    },
    paper() { hiss({ freq: 2600, q: 0.7, dur: 0.18, vol: 0.09 }); hiss({ t: 0.14, freq: 3400, q: 0.9, dur: 0.28, vol: 0.07 }); },
    whoosh(dur = 0.6, vol = 0.14) { hiss({ freq: 300, to: 2400, q: 0.8, dur, vol, attack: dur * 0.5 }); },
    boing() { tone(620, { to: 980, slide: 0.08, dur: 0.16, vol: 0.06, type: 'triangle' }); tone(980, { t: 0.09, to: 760, slide: 0.08, dur: 0.14, vol: 0.05, type: 'triangle' }); },
    blip() { tone(988, { dur: 0.08, vol: 0.05, type: 'square', lp: 2600 }); tone(1480, { t: 0.09, dur: 0.12, vol: 0.05, type: 'square', lp: 2600 }); },
    chirp() { tone(1900, { to: 2800, slide: 0.06, dur: 0.08, vol: 0.045 }); tone(2100, { t: 0.11, to: 3000, slide: 0.06, dur: 0.09, vol: 0.04 }); },
    toot() {                                         // a toy train whistle: toot… toooot
      const chord = (t, d) => { [523, 659, 784].forEach((f, i) => tone(f, { t, dur: d, hold: d * 0.6, vol: 0.045, type: 'triangle', vib: 5.5, attack: 0.04, lp: 1800 + i * 200 })); hiss({ t, freq: 3000, q: 0.6, dur: d, vol: 0.025, attack: 0.04 }); };
      chord(0, 0.32); chord(0.42, 0.62);
    },
    chug() { for (let i = 0; i < 4; i++) hiss({ t: i * 0.16, freq: 900, q: 1.2, dur: 0.1, vol: 0.05 }); },
    shoot() { S.whoosh(0.9, 0.12); [2637, 2349, 2093, 1760, 1568, 1319].forEach((f, i) => bell(f, 0.25 + i * 0.07, 0.04, 0.9)); },
    spout() { hiss({ freq: 1200, type: 'highpass', dur: 0.9, vol: 0.16, attack: 0.08 }); hiss({ t: 0.05, freq: 500, q: 0.7, dur: 0.6, vol: 0.06 }); S.bubble(0.5); },
    bubble(t = 0) { const f = 320 + Math.random() * 260; tone(f, { t, to: f * 2.8, slide: 0.07, dur: 0.11, vol: 0.09 }); },
    plink(i = 0) { const f = [1319, 1568, 1760, 2093, 2349, 2637][i % 6]; tone(f, { dur: 0.35, vol: 0.07 }); tone(f * 2.4, { dur: 0.18, vol: 0.025 }); },
    beep(final) { tone(final ? 1318 : 880, { dur: final ? 0.5 : 0.16, hold: final ? 0.25 : 0.06, vol: 0.06, type: 'square', lp: 2200 }); },
    rumble(dur = 2.6) { hiss({ freq: 110, type: 'lowpass', q: 0.5, dur, vol: 0.5, attack: dur * 0.45, rate: 0.6 }); hiss({ freq: 320, q: 0.6, dur: dur * 0.8, vol: 0.12, attack: dur * 0.5 }); },
    liftoff() { S.rumble(2.8); hiss({ t: 0.5, freq: 400, to: 3000, q: 0.5, dur: 2.2, vol: 0.12, attack: 1 }); },
    squeak() { tone(1250, { to: 1600, slide: 0.05, dur: 0.07, vol: 0.035, type: 'triangle' }); },
    flap() { hiss({ freq: 700, q: 0.8, dur: 0.09, vol: 0.05 }); hiss({ t: 0.12, freq: 650, q: 0.8, dur: 0.09, vol: 0.045 }); },
    tap() { tone(1500, { to: 900, slide: 0.04, dur: 0.06, vol: 0.05 }); },
  };

  // Soft sea waves for the beach opening screen (a slow swell of filtered noise)
  let waveStop = null;
  function waves(on) {
    if (!on) { if (waveStop) waveStop(); waveStop = null; return; }
    if (waveStop) return;
    const dest = out(); if (!dest) return;
    const c = ctx(), src = c.createBufferSource(); src.buffer = noise(); src.loop = true; src.playbackRate.value = 0.5;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 650;
    const g = c.createGain(); g.gain.value = 0.0001;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.16; lg.gain.value = 0.05;
    const base = c.createConstantSource ? c.createConstantSource() : null;
    if (base) { base.offset.value = 0.06; base.connect(g.gain); base.start(); }
    lfo.connect(lg).connect(g.gain); lfo.start();
    src.connect(f).connect(g).connect(dest); src.start();
    waveStop = () => {
      const t = c.currentTime;
      g.gain.cancelScheduledValues(t); lg.gain.setTargetAtTime(0, t, 0.3); if (base) base.offset.setTargetAtTime(0, t, 0.3);
      setTimeout(() => { try { src.stop(); lfo.stop(); base && base.stop(); } catch (e) {} }, 1500);
    };
  }

  function apply() {
    const c = ctx(); if (!master || !c) return;
    master.gain.setTargetAtTime(muted ? 0 : VOL * duck, c.currentTime, 0.12);
  }
  return {
    play(name, ...args) { try { gmul = BOOST[name] || 1; if (S[name]) S[name](...args); } catch (e) {} finally { gmul = 1; } },
    waves,
    setMuted(m) { muted = m; try { localStorage.setItem(KEY, m ? '1' : '0'); } catch (e) {} if (m) waves(false); apply(); listeners.forEach((fn) => fn(m)); },
    isMuted: () => muted,
    duck(v) { duck = v; apply(); },
    onChange: (fn) => listeners.add(fn),
  };
})();
