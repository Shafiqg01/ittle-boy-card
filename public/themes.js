// ================= Themes: Teddy bear picnic, Space explorer, Little sailor =================
// Everything that makes a theme look and sound different lives here: the words, the colours,
// the characters (original vector art with named parts that CSS/GSAP animate) and the scenery.
// app.js (the card) and create.js (the editor) both read this file.

const STAR5 = (cx, cy, r = 11) => {            // 5-point star path centred on (cx, cy)
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1) + ' ';
  }
  return d + 'Z';
};
const STAR_GLOW = (id, c1 = '#fff3b0', c2 = '#ffd35c') => `
  <radialGradient id="${id}" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="${c1}"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/>
  </radialGradient>`;

// =====================================================================================
// 1. TEDDY BEAR PICNIC
// =====================================================================================
const TEDDY_GUIDE = `
<svg viewBox="0 0 220 270" aria-hidden="true" class="guide-svg">
  <defs>
    <radialGradient id="tdGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".5" stop-color="#fff1d6" stop-opacity=".4"/><stop offset="1" stop-color="#fff1d6" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="tdFur" cx="40%" cy="32%" r="70%"><stop offset="0" stop-color="#dba26b"/><stop offset="1" stop-color="#b57643"/></radialGradient>
    <radialGradient id="tdB1" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#e3f2fc"/><stop offset="1" stop-color="#6faedb"/></radialGradient>
    <radialGradient id="tdB2" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff4c4"/><stop offset="1" stop-color="#eebc3f"/></radialGradient>
    <radialGradient id="tdB3" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#e6f5e0"/><stop offset="1" stop-color="#86bf7d"/></radialGradient>
    ${STAR_GLOW('tdStar')}
  </defs>
  <ellipse cx="112" cy="140" rx="104" ry="120" fill="url(#tdGlow)" class="g-glow"/>

  <g class="t-balloons">
    <path d="M84 140 C78 112 64 92 62 70 M84 140 C90 104 98 82 100 55 M84 140 C100 114 120 98 133 79" stroke="#8a6a50" stroke-width="1.3" fill="none"/>
    <g class="t-bal t-bal-1"><ellipse cx="62" cy="45" rx="20" ry="24" fill="url(#tdB1)"/><path d="M59 69 h6 l-3 -4z" fill="#6faedb"/><ellipse cx="55" cy="35" rx="4.5" ry="8" fill="#fff" opacity=".55" transform="rotate(-20 55 35)"/></g>
    <g class="t-bal t-bal-2"><ellipse cx="100" cy="29" rx="21" ry="25" fill="url(#tdB2)"/><path d="M97 54 h6 l-3 -4z" fill="#eebc3f"/><ellipse cx="92" cy="19" rx="4.5" ry="8" fill="#fff" opacity=".55" transform="rotate(-20 92 19)"/></g>
    <g class="t-bal t-bal-3"><ellipse cx="134" cy="55" rx="19" ry="23" fill="url(#tdB3)"/><path d="M131 78 h6 l-3 -4z" fill="#86bf7d"/><ellipse cx="127" cy="46" rx="4" ry="7.5" fill="#fff" opacity=".55" transform="rotate(-20 127 46)"/></g>
  </g>

  <g class="t-legs">
    <g class="t-leg t-leg-1"><ellipse cx="103" cy="216" rx="13" ry="17" fill="#b97a45"/><ellipse cx="103" cy="226" rx="8.5" ry="6.5" fill="#f2d4ab"/><circle cx="97.5" cy="219" r="2" fill="#f2d4ab"/><circle cx="103" cy="217" r="2" fill="#f2d4ab"/><circle cx="108.5" cy="219" r="2" fill="#f2d4ab"/></g>
    <g class="t-leg t-leg-2"><ellipse cx="140" cy="216" rx="13" ry="17" fill="#c48650"/><ellipse cx="140" cy="226" rx="8.5" ry="6.5" fill="#f2d4ab"/><circle cx="134.5" cy="219" r="2" fill="#f2d4ab"/><circle cx="140" cy="217" r="2" fill="#f2d4ab"/><circle cx="145.5" cy="219" r="2" fill="#f2d4ab"/></g>
  </g>

  <ellipse cx="121" cy="183" rx="34" ry="36" fill="url(#tdFur)"/>
  <ellipse cx="121" cy="190" rx="21" ry="23" fill="#f2d4ab"/>
  <path d="M110 176 q11 6 22 0" stroke="#e6bf8f" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- back arm holds the balloon strings -->
  <path d="M101 161 C92 157 87 150 85 143" stroke="#c48650" stroke-width="15" stroke-linecap="round" fill="none"/>
  <circle cx="84" cy="140" r="8.5" fill="#b57643"/>

  <!-- the letter he carries (hidden until he picks it up) -->
  <g id="gCarry" class="g-carry" opacity="0">
    <rect x="104" y="170" width="34" height="23" rx="3" fill="#fffaf0" stroke="#4a90c8" stroke-width="1.5"/>
    <path d="M104.8 171.5 L121 184 L137.2 171.5" fill="none" stroke="#4a90c8" stroke-width="1.5"/>
    <circle cx="121" cy="183" r="3.8" fill="#4a90c8"/>
  </g>

  <!-- head -->
  <circle cx="92" cy="86" r="14" fill="#b97a45"/><circle cx="92" cy="86" r="7.5" fill="#f2d4ab"/>
  <circle cx="150" cy="86" r="14" fill="#b97a45"/><circle cx="150" cy="86" r="7.5" fill="#f2d4ab"/>
  <circle cx="121" cy="112" r="35" fill="url(#tdFur)"/>
  <ellipse cx="125" cy="127" rx="15" ry="11" fill="#f2d4ab"/>
  <ellipse cx="104" cy="122" rx="6" ry="4" fill="#f2a48a" opacity=".55"/><ellipse cx="148" cy="122" rx="6" ry="4" fill="#f2a48a" opacity=".55"/>
  <g class="t-eyes">
    <ellipse cx="110" cy="106" rx="3.6" ry="4.4" fill="#3b2416"/><ellipse cx="140" cy="106" rx="3.6" ry="4.4" fill="#3b2416"/>
    <circle cx="111.3" cy="104.4" r="1.3" fill="#fff"/><circle cx="141.3" cy="104.4" r="1.3" fill="#fff"/>
  </g>
  <ellipse cx="125" cy="120" rx="5.5" ry="4" fill="#4a2c1a"/><ellipse cx="123.5" cy="118.6" rx="1.6" ry="1" fill="#fff" opacity=".6"/>
  <path d="M125 124 v3.5 M119 128 q6 5 12 0" stroke="#4a2c1a" stroke-width="1.8" fill="none" stroke-linecap="round"/>

  <!-- bow tie -->
  <path d="M121 149 L105 141 L105 157Z M121 149 L137 141 L137 157Z" fill="#4a90c8"/>
  <circle cx="121" cy="149" r="4.5" fill="#3a78ad"/>
  <circle cx="110" cy="146" r="1.3" fill="#fff"/><circle cx="110" cy="152" r="1.3" fill="#fff"/><circle cx="132" cy="146" r="1.3" fill="#fff"/><circle cx="132" cy="152" r="1.3" fill="#fff"/>

  <!-- front arm with a little star wand (rotates around the shoulder) -->
  <g id="gArm" class="g-arm">
    <path d="M147 160 C159 158 167 150 171 141" stroke="#c48650" stroke-width="15" stroke-linecap="round" fill="none"/>
    <circle cx="173" cy="138" r="8.5" fill="#b57643"/>
    <path d="M176 133 L190 106" stroke="#f3c057" stroke-width="3" stroke-linecap="round"/>
    <circle cx="192" cy="102" r="15" fill="url(#tdStar)" class="g-tip-glow"/>
    <path id="gTip" d="${STAR5(192, 102, 10)}" fill="#ffe17a" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>
  </g>
</svg>`;

const TEDDY_BEE = (id = 'b') => `
<svg viewBox="-50 -50 100 100" aria-hidden="true" class="companion-svg">
  <g class="b-wing b-wing-r">
    <ellipse cx="17" cy="-10" rx="17" ry="10" transform="rotate(-25 17 -10)" fill="#eef8ff" fill-opacity=".9" stroke="#9cc3dd" stroke-width="1.4"/>
    <ellipse cx="13" cy="4" rx="10" ry="6" transform="rotate(15 13 4)" fill="#eef8ff" fill-opacity=".85" stroke="#9cc3dd" stroke-width="1.2"/>
  </g>
  <g class="b-wing b-wing-l" transform="scale(-1 1)">
    <ellipse cx="17" cy="-10" rx="17" ry="10" transform="rotate(-25 17 -10)" fill="#eef8ff" fill-opacity=".9" stroke="#9cc3dd" stroke-width="1.4"/>
    <ellipse cx="13" cy="4" rx="10" ry="6" transform="rotate(15 13 4)" fill="#eef8ff" fill-opacity=".85" stroke="#9cc3dd" stroke-width="1.2"/>
  </g>
  <path d="M-2 21 L0 28 L2 21Z" fill="#3b2a14"/>
  <ellipse cx="0" cy="5" rx="11" ry="17" fill="#f6c63b" stroke="#3b2a14" stroke-width="1.6"/>
  <path d="M-10.5 -1 Q0 2 10.5 -1 M-10.4 8 Q0 11 10.4 8 M-7 16 Q0 18.5 7 16" stroke="#3b2a14" stroke-width="3.6" fill="none"/>
  <circle cx="0" cy="-15" r="8" fill="#3b2a14"/>
  <circle cx="-3" cy="-17" r="1.7" fill="#fff"/><circle cx="3" cy="-17" r="1.7" fill="#fff"/>
  <path d="M-2 -22 C-4 -28 -7 -31 -10 -32 M2 -22 C4 -28 7 -31 10 -32" stroke="#3b2a14" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  <circle cx="-10.5" cy="-32.5" r="1.8" fill="#3b2a14"/><circle cx="10.5" cy="-32.5" r="1.8" fill="#3b2a14"/>
</svg>`;

const TEDDY_HEAD = (x, y, fur = '#b97a45', s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="-13" cy="-12" r="8" fill="${fur}"/><circle cx="-13" cy="-12" r="4" fill="#f2d4ab"/>
    <circle cx="13" cy="-12" r="8" fill="${fur}"/><circle cx="13" cy="-12" r="4" fill="#f2d4ab"/>
    <circle cx="0" cy="0" r="18" fill="${fur}"/>
    <ellipse cx="2" cy="7" rx="8.5" ry="6.5" fill="#f2d4ab"/>
    <ellipse cx="2" cy="4" rx="3.2" ry="2.4" fill="#4a2c1a"/>
    <circle cx="-6" cy="-3" r="2.3" fill="#3b2416"/><circle cx="9" cy="-3" r="2.3" fill="#3b2416"/>
    <path d="M-2 10 q4 3 8 0" stroke="#4a2c1a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  </g>`;
const WHEEL = (x, y, r, rim = '#3d4a5c') => `
  <g class="tr-wheel"><circle cx="${x}" cy="${y}" r="${r}" fill="${rim}"/><circle cx="${x}" cy="${y}" r="${r * 0.72}" fill="#e7ecf3"/>
  <path d="M${x - r * 0.7} ${y} H${x + r * 0.7} M${x} ${y - r * 0.7} V${y + r * 0.7}" stroke="${rim}" stroke-width="2.4"/>
  <circle cx="${x}" cy="${y}" r="${r * 0.22}" fill="${rim}"/></g>`;

const TEDDY_TRAIN = `
<svg viewBox="0 -24 384 184" aria-hidden="true" class="hero-svg">
  <g class="tr-body">
    <!-- carriage 1 -->
    <path d="M96 86 C98 60 104 36 102 12" stroke="#8a6a50" stroke-width="1.4" fill="none"/>
    <ellipse cx="102" cy="0" rx="12" ry="14" fill="#8fc3e8"/><ellipse cx="98" cy="-5" rx="3" ry="5" fill="#fff" opacity=".6"/>
    ${TEDDY_HEAD(56, 72)}
    <rect x="10" y="90" width="100" height="42" rx="8" fill="#a8d5a2" stroke="#6fa66a" stroke-width="2"/>
    <rect x="6" y="84" width="108" height="9" rx="4" fill="#f4d06f"/>
    <circle cx="36" cy="111" r="6" fill="#fff" opacity=".6"/><circle cx="60" cy="111" r="6" fill="#fff" opacity=".6"/><circle cx="84" cy="111" r="6" fill="#fff" opacity=".6"/>
    <rect x="110" y="117" width="16" height="6" rx="2" fill="#6b5b4a"/>
    <!-- carriage 2 -->
    ${TEDDY_HEAD(172, 72, '#8c5a32')}
    <path d="M160 92 L152 84 L152 98Z M160 92 L168 84 L168 98Z" fill="#e2604c"/>
    <rect x="124" y="90" width="100" height="42" rx="8" fill="#f4d06f" stroke="#d4a940" stroke-width="2"/>
    <rect x="120" y="84" width="108" height="9" rx="4" fill="#8fc3e8"/>
    <circle cx="150" cy="111" r="6" fill="#fff" opacity=".6"/><circle cx="174" cy="111" r="6" fill="#fff" opacity=".6"/><circle cx="198" cy="111" r="6" fill="#fff" opacity=".6"/>
    <rect x="224" y="117" width="16" height="6" rx="2" fill="#6b5b4a"/>
    <!-- engine -->
    <rect x="320" y="50" width="14" height="38" fill="#3d4a5c"/>
    <rect x="314" y="42" width="26" height="10" rx="3" fill="#e2604c"/>
    <rect x="288" y="86" width="74" height="46" rx="10" fill="#4a90c8" stroke="#2f6fa3" stroke-width="2"/>
    <rect x="306" y="86" width="6" height="46" fill="#f4d06f"/><rect x="336" y="86" width="6" height="46" fill="#f4d06f"/>
    <rect x="356" y="80" width="14" height="56" rx="4" fill="#e2604c"/>
    <circle cx="372" cy="94" r="6" fill="#ffe17a" stroke="#d4a940" stroke-width="1.5"/>
    <rect x="238" y="62" width="54" height="70" rx="6" fill="#4a90c8" stroke="#2f6fa3" stroke-width="2"/>
    <rect x="248" y="72" width="34" height="26" rx="4" fill="#fff8ec"/>
    ${TEDDY_HEAD(265, 92, '#c48650', 0.72)}
    <path d="M252 78 h26 v-5 q-13 -8 -26 0z" fill="#4a90c8"/><path d="M252 78 h26" stroke="#fff" stroke-width="2"/>
    <rect x="232" y="54" width="66" height="12" rx="4" fill="#e2604c"/>
    <path d="M362 132 L380 150 L346 150Z" fill="#e2604c"/>
    <line x1="262" y1="134" x2="310" y2="134" stroke="#cbd5e0" stroke-width="4" stroke-linecap="round"/>
  </g>
  ${WHEEL(34, 136, 13)}${WHEEL(86, 136, 13)}${WHEEL(148, 136, 13)}${WHEEL(200, 136, 13)}
  ${WHEEL(262, 134, 16)}${WHEEL(310, 134, 16)}${WHEEL(346, 138, 11)}
</svg>`;

const TEDDY_BALLOON = (c) => `
<svg viewBox="-20 -30 40 74" aria-hidden="true"><ellipse cx="0" cy="-8" rx="14" ry="17" fill="${c}"/>
<ellipse cx="-5" cy="-14" rx="3" ry="6" fill="#fff" opacity=".55"/><path d="M-3 9 h6 l-3 -3z" fill="${c}"/>
<path d="M0 9 C4 18 -4 26 1 42" stroke="#8a6a50" stroke-width="1.2" fill="none"/></svg>`;

const TEDDY_LAND = `
<svg viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice">
  <defs>
    <pattern id="ging" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
      <rect width="18" height="18" fill="#fff"/><rect width="9" height="18" fill="#8fc3e8" opacity=".55"/><rect width="18" height="9" fill="#8fc3e8" opacity=".55"/>
    </pattern>
  </defs>
  <g class="land-far">
    <path d="M0 210 C160 150 300 170 430 190 C560 210 640 140 780 150 C920 160 1040 200 1180 180 C1300 160 1380 170 1440 180 V320 H0Z" fill="#cfe6c2"/>
    <g class="lm"><g transform="translate(-230 30)">
      <rect x="1070" y="96" width="22" height="100" rx="4" fill="#a0744a"/>
      <path d="M1081 150 L1060 128 M1081 138 L1100 118" stroke="#a0744a" stroke-width="7" stroke-linecap="round"/>
      <circle cx="1040" cy="112" r="34" fill="#8bbd7e"/><circle cx="1124" cy="110" r="36" fill="#8bbd7e"/>
      <circle cx="1081" cy="94" r="46" fill="#9cc98f"/><circle cx="1080" cy="56" r="32" fill="#a8d29b"/>
      <circle cx="1056" cy="84" r="5" fill="#ff9f8a"/><circle cx="1110" cy="70" r="5" fill="#ff9f8a"/><circle cx="1096" cy="112" r="5" fill="#ff9f8a"/>
      <g class="swing"><path d="M1108 130 V180 M1134 130 V180" stroke="#8a6a50" stroke-width="2"/><rect x="1102" y="178" width="38" height="6" rx="2" fill="#c68a55"/></g>
    </g></g>
  </g>
  <path class="land-mid" d="M0 250 C140 220 260 230 380 246 C520 264 640 214 800 222 C960 230 1060 262 1200 248 C1320 236 1400 236 1440 240 V320 H0Z" fill="#b5d6a3"/>
  <g class="land-near">
    <path d="M0 286 C180 262 340 270 520 284 C700 298 860 262 1040 270 C1200 276 1340 290 1440 280 V320 H0Z" fill="#98c886"/>
    <path d="M548 296 L712 286 L744 316 L526 322Z" fill="url(#ging)" stroke="#e8f2fa" stroke-width="2"/>
    <path d="M598 290 h38 l-5 19 h-28z" fill="#c99a5b"/><path d="M600 296 h34 M602 302 h30" stroke="#a8783f" stroke-width="1.5"/>
    <path d="M603 290 q14 -18 28 0" stroke="#a8783f" stroke-width="3" fill="none"/>
    <circle cx="664" cy="298" r="7" fill="#e2604c"/><path d="M664 291 q2 -4 5 -4" stroke="#6fa66a" stroke-width="2" fill="none"/>
    <g class="flowers">
      <g transform="translate(90 278)"><circle r="7" fill="#fff"/><circle r="3" fill="#ffd35c"/></g>
      <g transform="translate(160 270)"><circle r="6" fill="#bfe0f5"/><circle r="2.5" fill="#fff"/></g>
      <g transform="translate(330 280)"><circle r="8" fill="#fff"/><circle r="3" fill="#ffd35c"/></g>
      <g transform="translate(850 276)"><circle r="6" fill="#ffd35c"/><circle r="2.5" fill="#fff"/></g>
      <g transform="translate(930 270)"><circle r="7" fill="#fff"/><circle r="3" fill="#ffd35c"/></g>
      <g transform="translate(1250 284)"><circle r="8" fill="#fff"/><circle r="3" fill="#ffd35c"/></g>
      <g transform="translate(1360 282)"><circle r="6" fill="#bfe0f5"/><circle r="2.5" fill="#fff"/></g>
    </g>
  </g>
</svg>`;

const PAW_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="25" rx="8.5" ry="7.5" fill="#fff8ec"/>
<circle cx="10.5" cy="16" r="3.8" fill="#fff8ec"/><circle cx="16.5" cy="10.5" r="3.8" fill="#fff8ec"/><circle cx="23.5" cy="10.5" r="3.8" fill="#fff8ec"/><circle cx="29.5" cy="16" r="3.8" fill="#fff8ec"/></svg>`;

const TEDDY_STAGE = `
<div class="env-float">
  <div class="envelope" id="envelope">
    <div class="env-back"></div>
    <div class="letter" id="letter"><span class="letter-star">♥</span><span class="letter-line"></span><span class="letter-line short"></span></div>
    <div class="pocket"></div>
    <div class="lace" aria-hidden="true"></div>
    <div class="flap" id="flap"></div>
    <button class="seal" id="openBtn" aria-label="Open the card" disabled>${PAW_SVG}</button>
  </div>
</div>`;

// =====================================================================================
// 2. SPACE EXPLORER
// =====================================================================================
const SPACE_GUIDE = `
<svg viewBox="0 0 220 270" aria-hidden="true" class="guide-svg">
  <defs>
    <radialGradient id="asGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#e8fbff" stop-opacity=".7"/><stop offset=".5" stop-color="#7fe0e6" stop-opacity=".22"/><stop offset="1" stop-color="#7fe0e6" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="asSuit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9deef"/></linearGradient>
    <linearGradient id="asVisor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3a78"/><stop offset="1" stop-color="#141c44"/></linearGradient>
    ${STAR_GLOW('asStar')}
  </defs>
  <ellipse cx="116" cy="140" rx="104" ry="120" fill="url(#asGlow)" class="g-glow"/>

  <!-- jetpack + flames -->
  <rect x="70" y="128" width="34" height="68" rx="10" fill="#8e9abf" stroke="#6c78a0" stroke-width="2"/>
  <rect x="76" y="140" width="22" height="6" rx="3" fill="#e8604c"/>
  <g class="a-flames">
    <path class="a-flame" d="M79 204 q-7 14 0 30 q7 -16 0 -30Z" fill="#ffb347"/><path class="a-flame" d="M79 206 q-3 8 0 16 q3 -8 0 -16Z" fill="#fff1b0"/>
    <path class="a-flame a-flame-2" d="M95 204 q-7 14 0 30 q7 -16 0 -30Z" fill="#ffb347"/><path class="a-flame a-flame-2" d="M95 206 q-3 8 0 16 q3 -8 0 -16Z" fill="#fff1b0"/>
  </g>
  <rect x="73" y="194" width="12" height="10" rx="2" fill="#5a6795"/><rect x="89" y="194" width="12" height="10" rx="2" fill="#5a6795"/>

  <g class="a-legs">
    <g class="a-leg a-leg-1"><path d="M110 200 L105 230" stroke="#eef1f8" stroke-width="17" stroke-linecap="round"/><path d="M110 200 L105 230" stroke="#c3cae0" stroke-width="17" stroke-linecap="round" stroke-dasharray="0 22 2 40" opacity=".5"/><ellipse cx="103" cy="236" rx="12" ry="7.5" fill="#5a6795"/></g>
    <g class="a-leg a-leg-2"><path d="M132 200 L134 230" stroke="#e3e7f3" stroke-width="17" stroke-linecap="round"/><ellipse cx="136" cy="236" rx="12" ry="7.5" fill="#4b5785"/></g>
  </g>

  <path d="M94 140 C92 128 104 122 120 122 C136 122 148 128 146 140 L148 196 C148 206 138 210 120 210 C102 210 92 206 92 196Z" fill="url(#asSuit)" stroke="#c3cae0" stroke-width="1.5"/>
  <rect x="107" y="148" width="28" height="22" rx="5" fill="#e3e7f3" stroke="#b8c0da" stroke-width="1.5"/>
  <circle cx="114" cy="159" r="3.2" fill="#e8604c" class="a-btn"/><circle cx="121" cy="159" r="3.2" fill="#4fc3c9" class="a-btn a-btn-2"/><circle cx="128" cy="159" r="3.2" fill="#f2b84b" class="a-btn a-btn-3"/>
  <rect x="93" y="188" width="55" height="7" rx="3" fill="#b8c0da"/>
  <path d="M137 132 l3 6 6 1 -4.5 4 1 6 -5.5-3 -5.5 3 1-6 -4.5-4 6-1z" fill="#f2b84b"/>

  <!-- back arm holds the message -->
  <path d="M99 146 C90 160 94 172 106 177" stroke="#eef1f8" stroke-width="14" stroke-linecap="round" fill="none"/>
  <g id="gCarry" class="g-carry" opacity="0">
    <rect x="104" y="166" width="34" height="23" rx="3" fill="#fff" stroke="#4fc3c9" stroke-width="1.5"/>
    <path d="M104.8 167.5 L121 180 L137.2 167.5" fill="none" stroke="#4fc3c9" stroke-width="1.5"/>
    <path d="${STAR5(121, 179, 4.5)}" fill="#f2b84b"/>
  </g>
  <circle cx="107" cy="177" r="7" fill="#4fc3c9"/>

  <!-- helmet with a little face inside -->
  <ellipse cx="121" cy="123" rx="23" ry="6" fill="#b8c0da"/>
  <circle cx="122" cy="86" r="40" fill="url(#asSuit)" stroke="#c3cae0" stroke-width="2"/>
  <ellipse cx="128" cy="91" rx="29" ry="25" fill="url(#asVisor)"/>
  <circle cx="128" cy="95" r="19" fill="#ffdcc4"/>
  <path d="M110 88 q8 -13 22 -9 q9 2 12 9 q-10 -5 -18 -3 q-9 2 -16 3Z" fill="#8a5a32"/>
  <g class="a-eyes"><ellipse cx="121" cy="97" rx="2.8" ry="3.4" fill="#2b1d14"/><ellipse cx="136" cy="97" rx="2.8" ry="3.4" fill="#2b1d14"/>
  <circle cx="122" cy="95.8" r="1" fill="#fff"/><circle cx="137" cy="95.8" r="1" fill="#fff"/></g>
  <ellipse cx="116" cy="103" rx="3.6" ry="2.4" fill="#ff9f9f" opacity=".6"/><ellipse cx="141" cy="103" rx="3.6" ry="2.4" fill="#ff9f9f" opacity=".6"/>
  <path d="M123 104 q5.5 5 11 0" stroke="#c2456f" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <ellipse cx="128" cy="91" rx="29" ry="25" fill="#9fe6ff" opacity=".18"/>
  <path d="M106 79 q10 -14 30 -12" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
  <circle cx="148" cy="80" r="2.4" fill="#fff" opacity=".7"/>
  <path d="M101 54 L93 36" stroke="#b8c0da" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="92" cy="33" r="4.5" fill="#e8604c" class="a-light"/>

  <!-- front arm holding a star -->
  <g id="gArm" class="g-arm">
    <path d="M145 146 C159 146 167 138 171 127" stroke="#eef1f8" stroke-width="14" stroke-linecap="round" fill="none"/>
    <circle cx="172" cy="124" r="7.5" fill="#4fc3c9"/>
    <circle cx="180" cy="106" r="17" fill="url(#asStar)" class="g-tip-glow"/>
    <path id="gTip" d="${STAR5(180, 106, 11)}" fill="#ffe17a" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>
  </g>
</svg>`;

const SPACE_COMET = (id = 'c') => `
<svg viewBox="-50 -50 100 100" aria-hidden="true" class="companion-svg">
  <g transform="scale(1.3) translate(0 4)">
  <defs><radialGradient id="${id}G" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".5" stop-color="#ffe9a3" stop-opacity=".45"/><stop offset="1" stop-color="#ffe9a3" stop-opacity="0"/></radialGradient></defs>
  <g class="c-tail">
    <path d="M-10 -12 C-14 8 -7 26 0 44 C7 26 14 8 10 -12Z" fill="#4fc3c9" opacity=".5"/>
    <path d="M-7 -12 C-8 4 -4 18 0 32 C4 18 8 4 7 -12Z" fill="#f2b84b" opacity=".85"/>
    <path d="M-4 -12 C-4 0 -2 10 0 20 C2 10 4 0 4 -12Z" fill="#fff3c4"/>
  </g>
  <circle cx="0" cy="-14" r="20" fill="url(#${id}G)"/>
  <circle cx="0" cy="-14" r="10.5" fill="#ffe9a3" stroke="#f2b84b" stroke-width="2"/>
  <circle cx="-3.6" cy="-15.5" r="1.6" fill="#3b2a14"/><circle cx="3.6" cy="-15.5" r="1.6" fill="#3b2a14"/>
  <path d="M-3 -10.5 q3 3 6 0" stroke="#3b2a14" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

const SPACE_STAR = `
<svg viewBox="-60 -60 120 120" aria-hidden="true" class="hero-svg">
  <defs><radialGradient id="ssG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#ffe9a3" stop-opacity=".55"/><stop offset="1" stop-color="#ffe9a3" stop-opacity="0"/></radialGradient></defs>
  <circle r="56" fill="url(#ssG)"/>
  <g class="ss-spin">
    <path d="${STAR5(0, 2, 30)}" fill="#ffe27a" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="-7" cy="0" r="2.6" fill="#3b2a14"/><circle cx="7" cy="0" r="2.6" fill="#3b2a14"/>
    <path d="M-5 7 q5 5 10 0" stroke="#3b2a14" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="-12" cy="5" rx="3.5" ry="2.2" fill="#ffab8a" opacity=".7"/><ellipse cx="12" cy="5" rx="3.5" ry="2.2" fill="#ffab8a" opacity=".7"/>
  </g>
</svg>`;

const SPACE_LAND = `
<svg viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice">
  <g class="land-far">
    <path d="M0 222 L80 186 L150 212 L240 164 L330 206 L420 178 L520 214 L640 172 L760 210 L880 168 L1000 206 L1120 176 L1240 210 L1340 182 L1440 200 V320 H0Z" fill="#2c3670"/>
    <g class="lm"><g transform="translate(790 152)">
      <path d="M0 40 a26 26 0 0 1 52 0z" fill="#3d4a8a"/><rect x="-6" y="38" width="64" height="6" rx="3" fill="#3d4a8a"/>
      <circle cx="16" cy="28" r="3" fill="#ffd98a" class="win"/><circle cx="30" cy="24" r="3" fill="#7fe0e6" class="win win-2"/>
      <path d="M44 16 l14 -16" stroke="#5a6795" stroke-width="3"/><circle cx="59" cy="-1" r="4" fill="#e8604c" class="a-light"/>
    </g></g>
  </g>
  <path class="land-mid" d="M0 252 C140 226 260 234 380 248 C520 264 640 222 800 228 C960 234 1060 262 1200 250 C1320 240 1400 240 1440 244 V320 H0Z" fill="#414d8c"/>
  <g class="land-near">
    <path d="M0 286 C180 264 340 272 520 284 C700 296 860 264 1040 272 C1200 278 1340 290 1440 282 V320 H0Z" fill="#5a66a6"/>
    <ellipse cx="210" cy="300" rx="44" ry="8" fill="#4a5594"/><path d="M168 298 a44 8 0 0 1 84 0" stroke="#7984bf" stroke-width="2" fill="none"/>
    <ellipse cx="780" cy="300" rx="56" ry="10" fill="#4a5594"/><path d="M726 297 a56 10 0 0 1 108 0" stroke="#7984bf" stroke-width="2" fill="none"/>
    <ellipse cx="1260" cy="302" rx="34" ry="7" fill="#4a5594"/>
    <ellipse cx="420" cy="292" rx="10" ry="5" fill="#6d79b6"/><ellipse cx="1010" cy="284" rx="12" ry="6" fill="#6d79b6"/><ellipse cx="560" cy="304" rx="7" ry="4" fill="#6d79b6"/>
    <path d="M600 290 V240" stroke="#d6dcf2" stroke-width="3"/>
    <g class="flag"><path d="M602 240 h36 v24 h-36z" fill="#4fc3c9"/><path d="${STAR5(620, 252, 7)}" fill="#f2b84b"/></g>
  </g>
</svg>`;

const SPACE_STAGE = `
<div class="launch" id="launch">
  <svg viewBox="0 0 300 300" class="launch-svg" aria-hidden="true">
    <g class="tower">
      <path d="M58 64 V282 M78 64 V282" stroke="#8e9abf" stroke-width="5"/>
      <path d="M58 80 L78 104 M78 80 L58 104 M58 120 L78 144 M78 120 L58 144 M58 160 L78 184 M78 160 L58 184 M58 200 L78 224 M78 200 L58 224 M58 240 L78 264 M78 240 L58 264" stroke="#6c78a0" stroke-width="3"/>
      <rect x="52" y="56" width="32" height="10" rx="3" fill="#e8604c"/>
      <circle cx="68" cy="50" r="4" fill="#ffd98a" class="a-light"/>
      <path d="M78 130 H124" stroke="#8e9abf" stroke-width="5" class="tower-arm"/>
    </g>
    <rect x="86" y="278" width="128" height="14" rx="4" fill="#5a6795"/>
    <path d="M100 278 L112 262 H188 L200 278Z" fill="#6c78a0"/>
    <g id="rocket">
      <g id="rFlame" class="r-flame">
        <path d="M134 250 Q150 330 166 250Z" fill="#ff7a4f"/><path d="M139 250 Q150 310 161 250Z" fill="#ffb347"/><path d="M144 250 Q150 286 156 250Z" fill="#fff1b0"/>
      </g>
      <path d="M126 206 L102 254 L130 246Z" fill="#e8604c"/><path d="M174 206 L198 254 L170 246Z" fill="#e8604c"/>
      <path d="M150 58 C177 88 183 140 178 250 L122 250 C117 140 123 88 150 58Z" fill="#f4f1ea" stroke="#c9ccd8" stroke-width="2"/>
      <path d="M150 58 C162 70 170 84 174 100 L126 100 C130 84 138 70 150 58Z" fill="#e8604c"/>
      <rect x="123" y="198" width="54" height="9" fill="#4fc3c9"/>
      <circle cx="150" cy="142" r="17" fill="#2b3a78" stroke="#c9ccd8" stroke-width="5"/>
      <path d="M141 135 a12 12 0 0 1 12 -7" stroke="#9fe6ff" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M150 226 V250" stroke="#c9ccd8" stroke-width="2"/>
      <rect x="135" y="248" width="30" height="9" rx="2" fill="#8e9abf"/>
    </g>
  </svg>
  <div class="countdown" id="countdown" aria-live="polite"></div>
  <button class="launch-btn" id="openBtn" aria-label="Launch and open the card" disabled><span>Launch</span></button>
</div>`;

// =====================================================================================
// 3. LITTLE SAILOR
// =====================================================================================
const SAILOR_GUIDE = `
<svg viewBox="0 0 220 270" aria-hidden="true" class="guide-svg">
  <defs>
    <radialGradient id="sgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".5" stop-color="#d7f5f8" stop-opacity=".35"/><stop offset="1" stop-color="#d7f5f8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sgBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3eaf0"/></linearGradient>
    <linearGradient id="sgWing" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#9fb0c2"/><stop offset="1" stop-color="#e2e9f0"/></linearGradient>
  </defs>
  <ellipse cx="114" cy="138" rx="104" ry="118" fill="url(#sgGlow)" class="g-glow"/>

  <g class="s-wing s-wing-far">
    <path d="M118 128 C106 96 88 70 62 56 C70 82 78 102 98 130Z" fill="#b9c6d3"/>
    <path d="M62 56 C68 66 72 74 76 82 L70 70Z" fill="#2c3e57"/>
  </g>
  <path d="M74 150 L42 138 L50 154 L40 170 L78 162Z" fill="#d5dde5" stroke="#bfcad5" stroke-width="1.5"/>
  <path d="M42 138 L49 146 L46 150Z M40 170 L48 160 L50 165Z" fill="#8a9bb0"/>

  <g class="s-legs">
    <g class="s-leg s-leg-1"><path d="M106 176 L102 198" stroke="#f5a623" stroke-width="3.5" stroke-linecap="round"/><path d="M93 202 L102 196 L109 203Z" fill="#f5a623"/></g>
    <g class="s-leg s-leg-2"><path d="M122 178 L124 200" stroke="#e8951a" stroke-width="3.5" stroke-linecap="round"/><path d="M116 204 L124 198 L132 204Z" fill="#e8951a"/></g>
  </g>

  <!-- the message bottle he carries (hidden until he picks it up) -->
  <g id="gCarry" class="g-carry" opacity="0">
    <rect x="96" y="198" width="38" height="17" rx="7" fill="#bfe6dc" stroke="#7cc4bb" stroke-width="1.5"/>
    <rect x="134" y="202" width="8" height="9" rx="2" fill="#bfe6dc" stroke="#7cc4bb" stroke-width="1.2"/>
    <rect x="142" y="202.5" width="6" height="8" rx="1.5" fill="#c08a4e"/>
    <rect x="102" y="202" width="24" height="9" rx="4" fill="#fff3dc"/><path d="M114 202 v9" stroke="#d9534f" stroke-width="2"/>
  </g>

  <ellipse cx="112" cy="150" rx="47" ry="30" transform="rotate(-12 112 150)" fill="url(#sgBody)" stroke="#cfd8e0" stroke-width="1.5"/>
  <path d="M90 168 q22 10 44 0" stroke="#dbe3ea" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- neckerchief -->
  <path d="M132 128 L160 124 L150 148Z" fill="#d9534f"/><path d="M146 132 L152 150 L142 146Z" fill="#b8403c"/>

  <circle cx="152" cy="110" r="24" fill="url(#sgBody)" stroke="#cfd8e0" stroke-width="1.5"/>
  <path d="M172 107 L199 114 L172 121Z" fill="#f5a623"/><path d="M174 114 L197 114" stroke="#d98a12" stroke-width="1.4"/>
  <circle cx="188" cy="117.5" r="2" fill="#e8604c"/>
  <g class="s-eyes"><circle cx="161" cy="104" r="3.8" fill="#1f2a3a"/><circle cx="162.3" cy="102.6" r="1.3" fill="#fff"/></g>
  <ellipse cx="159" cy="118" rx="5" ry="3" fill="#ffb3a7" opacity=".6"/>
  <!-- sailor hat -->
  <path d="M133 94 Q152 70 171 94Z" fill="#fff" stroke="#cfd8e0" stroke-width="1.5"/>
  <rect x="132" y="90" width="40" height="7" rx="3.5" fill="#1d4f73"/>
  <ellipse cx="152" cy="97" rx="23" ry="4" fill="#fff" stroke="#cfd8e0" stroke-width="1.2"/>
  <path d="M152 79 v8 M148.5 83 h7 M148 85.5 q4 4 8 0" stroke="#1d4f73" stroke-width="1.6" fill="none" stroke-linecap="round"/>

  <!-- near wing: waves hello (rotates around the shoulder) and flaps -->
  <g id="gArm" class="g-arm">
    <g class="s-wing s-wing-near">
      <path d="M122 132 C106 98 82 72 46 62 C40 66 44 72 50 76 C62 86 70 96 76 106 C84 120 100 134 122 142Z" fill="url(#sgWing)" stroke="#97a7b8" stroke-width="1.5"/>
      <path d="M46 62 C52 70 58 76 66 84 L58 72 C54 68 50 64 46 62Z" fill="#2c3e57"/>
      <path d="M118 132 C100 116 84 100 70 88 M116 138 C98 128 86 118 76 108" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/>
      <circle id="gTip" cx="50" cy="66" r="3" fill="#fff" opacity=".01"/>
    </g>
  </g>
</svg>`;

const SAILOR_FISH = (id = 'f') => `
<svg viewBox="-50 -50 100 100" aria-hidden="true" class="companion-svg">
  <g class="f-tail"><path d="M0 16 C-10 26 -14 34 -12 41 C-6 37 -2 33 0 28 C2 33 6 37 12 41 C14 34 10 26 0 16Z" fill="#ffd27a" stroke="#e0a83a" stroke-width="1.2"/></g>
  <g class="b-wing b-wing-r"><path d="M6 -4 C20 -15 34 -13 38 -5 C30 0 18 4 6 4Z" fill="#ffd27a" stroke="#e0a83a" stroke-width="1.2"/></g>
  <g class="b-wing b-wing-l" transform="scale(-1 1)"><path d="M6 -4 C20 -15 34 -13 38 -5 C30 0 18 4 6 4Z" fill="#ffd27a" stroke="#e0a83a" stroke-width="1.2"/></g>
  <ellipse cx="0" cy="0" rx="10.5" ry="21" fill="#4fc3c9" stroke="#2a8a99" stroke-width="1.6"/>
  <path d="M-9.5 5 Q0 8.5 9.5 5" stroke="#fff" stroke-width="3" fill="none"/>
  <circle cx="-6" cy="-12" r="3.2" fill="#fff"/><circle cx="6" cy="-12" r="3.2" fill="#fff"/>
  <circle cx="-6" cy="-12.6" r="1.7" fill="#1f2a3a"/><circle cx="6" cy="-12.6" r="1.7" fill="#1f2a3a"/>
</svg>`;

const SAILOR_WHALE = `
<svg viewBox="0 0 340 180" aria-hidden="true" class="hero-svg">
  <defs><linearGradient id="whB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5590c9"/><stop offset="1" stop-color="#355f94"/></linearGradient></defs>
  <g class="w-tail">
    <path d="M86 98 C62 94 46 82 32 60 C26 52 14 52 12 62 C20 68 28 82 32 94 C22 98 10 106 6 120 C16 124 32 118 46 110 C60 106 74 108 88 112Z" fill="#3f6fa6"/>
  </g>
  <path d="M80 110 C84 70 140 46 200 46 C262 46 316 72 326 112 C332 140 300 160 240 162 C170 166 110 158 88 140 C80 132 78 122 80 110Z" fill="url(#whB)"/>
  <path d="M120 140 C170 156 250 158 312 126 C308 148 282 160 238 162 C182 166 142 160 120 140Z" fill="#a9d4e8"/>
  <path d="M150 150 q70 12 140 -8 M168 156 q60 6 110 -8" stroke="#86bcd6" stroke-width="2" fill="none"/>
  <circle cx="276" cy="104" r="5.5" fill="#1d2a3a"/><circle cx="277.8" cy="102.2" r="1.8" fill="#fff"/>
  <path d="M292 122 q10 8 22 0" stroke="#1d2a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <ellipse cx="282" cy="118" rx="8" ry="4" fill="#ffb3c1" opacity=".6"/>
  <ellipse cx="250" cy="48.5" rx="6" ry="2" fill="#2a4f7a"/>
  <circle cx="200" cy="62" r="3" fill="#fff" opacity=".35"/><circle cx="214" cy="56" r="2" fill="#fff" opacity=".35"/><circle cx="186" cy="58" r="2" fill="#fff" opacity=".35"/>
  <g class="w-fin"><path d="M206 132 C200 150 186 162 170 165 C178 150 190 138 200 128Z" fill="#2e5a8a"/></g>
</svg>`;

const WAVE = (y, amp, n = 28) => 'M0 ' + y + ' q30 ' + (-amp) + ' 60 0 t60 0'.repeat(n) + ' V320 H0Z';
const SAILOR_LAND = `
<svg viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice">
  <defs>
    <linearGradient id="beamG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6c9" stop-opacity=".9"/><stop offset="1" stop-color="#fff6c9" stop-opacity="0"/></linearGradient>
  </defs>
  <g class="land-far">
    <rect x="0" y="200" width="1440" height="120" fill="#6cc0d0"/>
    <g class="lm">
    <path d="M660 204 C710 168 780 158 850 174 C900 184 940 196 962 206Z" fill="#7fae8e"/>
    <g class="beam"><path d="M822 102 L1300 36 L1300 168Z" fill="url(#beamG)"/></g>
    <path d="M808 178 L814 110 L830 110 L836 178Z" fill="#fff"/>
    <path d="M812.6 126 L831.4 126 L832.6 140 L811.4 140Z M810.6 154 L833.4 154 L834.6 168 L809.4 168Z" fill="#d9534f"/>
    <rect x="812" y="98" width="20" height="13" rx="2" fill="#ffd27a" class="lamp"/>
    <path d="M808 98 L822 84 L836 98Z" fill="#d9534f"/>
    </g>
    <g transform="translate(1040 186)"><g class="boat boat-far"><path d="M0 14 h40 l-6 8 h-28z" fill="#d9534f"/><path d="M20 12 V-14 L36 10Z" fill="#fff"/><path d="M18 12 V-8 L6 10Z" fill="#f4f1ea"/></g></g>
  </g>
  <g class="land-mid">
    <path class="wave wave-mid" d="${WAVE(238, 12)}" fill="#3ea7bd"/>
    <g transform="translate(540 212)"><g class="boat"><path d="M0 22 h64 l-10 12 h-44z" fill="#1d4f73"/><path d="M32 20 V-26 L58 16Z" fill="#fff"/><path d="M29 20 V-14 L8 16Z" fill="#f4f1ea"/><path d="M32 -26 l10 4 -10 4" fill="#d9534f"/></g></g>
    <path class="wave wave-mid-2" d="${WAVE(256, 9)}" fill="#2f97b0"/>
  </g>
  <g class="land-near">
    <path d="M0 286 C180 264 340 272 520 284 C700 296 860 264 1040 272 C1200 278 1340 290 1440 282 V320 H0Z" fill="#f2deb0"/>
    <path d="M0 286 C180 264 340 272 520 284 C700 296 860 264 1040 272 C1200 278 1340 290 1440 282" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="18 12" opacity=".75" class="foam"/>
    <path d="${STAR5(610, 300, 11)}" fill="#ff8a7a" stroke="#e86b5c" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="${STAR5(900, 296, 9)}" fill="#ffb27a" stroke="#e8935c" stroke-width="1.5" stroke-linejoin="round"/>
    <g transform="translate(720 300)"><path d="M-10 6 L0 -8 L10 6Z" fill="#ffd9c7"/><path d="M0 -8 L-5 6 M0 -8 L0 6 M0 -8 L5 6" stroke="#e8b49a" stroke-width="1.2"/></g>
    <g transform="translate(980 290)"><path d="M-8 5 L0 -7 L8 5Z" fill="#fff3e6"/><path d="M0 -7 L-4 5 M0 -7 L0 5 M0 -7 L4 5" stroke="#e8c9b0" stroke-width="1.1"/></g>
    <ellipse cx="160" cy="300" rx="6" ry="3.5" fill="#d9c08c"/><ellipse cx="860" cy="304" rx="8" ry="4" fill="#d9c08c"/><ellipse cx="1330" cy="300" rx="5" ry="3" fill="#d9c08c"/>
  </g>
</svg>`;

const SAILOR_STAGE = `
<div class="bottle-wrap" id="bottleWrap">
  <div class="tide" aria-hidden="true"></div>
  <button class="bottle-btn" id="openBtn" aria-label="Pop the cork and open the card" disabled>
    <svg viewBox="0 0 330 170" class="bottle-svg" aria-hidden="true">
      <defs>
        <linearGradient id="btG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2f7f2" stop-opacity=".95"/><stop offset="1" stop-color="#8fd0c6" stop-opacity=".9"/></linearGradient>
      </defs>
      <g id="bottle" transform="rotate(-12 165 85)">
        <path d="M40 62 C40 46 52 38 70 38 L196 38 C214 38 224 48 236 58 L262 72 L262 100 L236 114 C224 124 214 132 196 132 L70 132 C52 132 40 124 40 108Z" fill="url(#btG)" stroke="#6fb9ae" stroke-width="3"/>
        <g id="scrollIn"><rect x="70" y="63" width="122" height="44" rx="18" fill="#fff3dc" stroke="#e6c999" stroke-width="2"/><path d="M131 63 v44" stroke="#d9534f" stroke-width="4"/></g>
        <rect x="262" y="73" width="24" height="26" rx="4" fill="url(#btG)" stroke="#6fb9ae" stroke-width="3"/>
        <path d="M60 52 C100 46 160 46 200 50" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M70 122 C110 126 170 126 200 122" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>
        <g id="cork"><rect x="284" y="75" width="28" height="22" rx="5" fill="#c08a4e" stroke="#8f6233" stroke-width="2"/>
          <circle cx="292" cy="82" r="1.4" fill="#8f6233"/><circle cx="302" cy="88" r="1.4" fill="#8f6233"/><circle cx="296" cy="92" r="1.2" fill="#8f6233"/><circle cx="306" cy="80" r="1.2" fill="#8f6233"/></g>
      </g>
    </svg>
  </button>
  <div class="msg-scroll" id="msgScroll"><span class="rod top"></span><span class="ms-anchor">⚓</span><span class="letter-line"></span><span class="letter-line short"></span><span class="rod bottom"></span></div>
</div>`;

// =====================================================================================
// The theme table
// =====================================================================================
const THEMES = {
  teddy: {
    id: 'teddy', name: 'Teddy bear picnic', emoji: '🧸', blurb: 'Envelope, floating teddy, toy train',
    swatch: ['#c68a55', '#8fc3e8', '#a8d5a2', '#f4d06f'],
    text: {
      sceneEyebrow: 'A little bear has a letter for you', hint: 'Tap the paw to open',
      intro: 'Once upon a cuddly time…', wishesTitle: 'Beary big wishes', closing: '…and he was loved beary much, forever and ever.',
      share: 'A little bear has a card for you 🧸', icons: ['📅', '⏰', '🧺'], polaroid: '🧸', flourish: '♥',
    },
    defaults: {
      title: 'Our little cub is on his way!', babyName: 'Leo',
      slides: [
        { style: 'write', text: 'Deep in a cosy wood, where the honey is sweet and the hugs are warm, a little wish began to grow.' },
        { style: 'rise', text: 'The teddy bears heard the news and packed a picnic, because something beary special is coming.' },
        { style: 'glow', text: 'Soon there will be tiny paws, sleepy yawns and the biggest bear hugs you have ever seen.' },
        { style: 'unfurl', text: 'Please join us for a baby shower to welcome our little cub with love, laughter and plenty of cuddles.' },
      ],
      wishes: 'May you always have a hug when you need one\nMay your days be full of sunshine and picnics\nMay you grow up gentle, brave and kind\nMay you always know how loved you are',
      from: 'With love and big bear hugs, Aunt Sara',
      tts: 'Welcome, everyone! A little cub is on his way, and we would love for you to join our teddy bear picnic. Get ready for lots of cuddles!',
    },
    colors: {
      burst: ['#f4d06f', '#8fc3e8', '#ffffff', '#a8d5a2', '#ffb38a', '#e9c49a'],
      trail: ['#ffe9a8', '#ffffff', '#bfe0f5'], trailKind: 'heart',
      drift: { kinds: ['heart', 'confetti', 'confetti'], colors: ['#ffffff', '#bfe0f5', '#f4d06f', '#ffc2b0', '#cfe8c6'], dir: 1 },
      flies: ['#ffe08a', '#fff2c2'], starBase: 0.12, glow: 'rgba(244,192,87,1)',
    },
    guide: { svg: TEDDY_GUIDE, view: { w: 220, h: 270 }, shoulder: '147 160', wave: [-30, 16] },
    companion: TEDDY_BEE,
    hero: { svg: TEDDY_TRAIN, view: { w: 384, h: 184 }, size: [0.5, 220, 360], path: 'ground', smoke: { x: 327, y: 18 }, bands: null },
    mini: (i) => TEDDY_BALLOON(['#8fc3e8', '#f4d06f', '#a8d5a2', '#ffb38a', '#c9b3ff'][i % 5]), miniMotion: 'up',
    land: TEDDY_LAND, opener: 'envelope', stage: TEDDY_STAGE,
    sfx: { deliver: 'boing', hero: 'toot', wish: 'plink', open: 'paper', reveal: 'musicbox' },
  },

  space: {
    id: 'space', name: 'Space explorer', emoji: '🚀', blurb: 'Rocket launch, astronaut, shooting star',
    swatch: ['#1b2550', '#f2b84b', '#4fc3c9', '#e8604c'],
    text: {
      sceneEyebrow: 'Mission control has a message for you', hint: 'Press the big button to launch',
      intro: 'Far, far away, among the stars…', wishesTitle: 'Wishes from the stars', closing: '…and his adventure was only just beginning.',
      share: 'A little astronaut has a card for you 🚀', icons: ['📅', '⏰', '🪐'], polaroid: '⭐', flourish: '★',
    },
    defaults: {
      title: 'A little astronaut is on his way!', babyName: 'Max',
      slides: [
        { style: 'write', text: 'Out past the moon and over the Milky Way, a tiny star began to shine a little brighter.' },
        { style: 'rise', text: 'Mission control picked up the signal: a brand-new explorer is getting ready for launch.' },
        { style: 'glow', text: 'Every planet is spinning and every comet is cheering, because the countdown has begun.' },
        { style: 'unfurl', text: 'Please join us for a baby shower to welcome our little astronaut with love, laughter and a universe of wishes.' },
      ],
      wishes: 'May you always reach for the stars\nMay your curiosity be as big as the universe\nMay every day be a new adventure\nMay you always find your way back home',
      from: 'With love from Mission Control, Aunt Sara',
      tts: 'Attention, everyone! A little astronaut is on his way, and we would love for you to join the celebration. Three, two, one… blast off!',
    },
    colors: {
      burst: ['#ffd98a', '#f2b84b', '#ffffff', '#7fe0e6', '#ff8a6b', '#b9c4ff'],
      trail: ['#ffb347', '#ffd98a', '#ff7a4f'], trailKind: 'dot',
      drift: { kinds: ['spark', 'dot'], colors: ['#ffffff', '#ffe9a3', '#9fe6ff'], dir: 0.5 },
      flies: ['#7fe0e6', '#ffd98a'], starBase: 0.75, glow: 'rgba(127,224,230,1)',
    },
    guide: { svg: SPACE_GUIDE, view: { w: 220, h: 270 }, shoulder: '145 146', wave: [-30, 16] },
    companion: SPACE_COMET,
    hero: { svg: SPACE_STAR, view: { w: 120, h: 120 }, size: [0.2, 90, 130], path: 'sky', bands: ['#ffffff', '#ffe9a3', '#f2b84b', '#7fe0e6', '#4fc3c9'] },
    mini: (i) => SPACE_COMET('mc' + i + '_' + Date.now()), miniMotion: 'out',
    land: SPACE_LAND, opener: 'launch', stage: SPACE_STAGE,
    sfx: { deliver: 'blip', hero: 'shoot', wish: 'twinkle', open: 'beep', reveal: 'musicbox' },
  },

  sailor: {
    id: 'sailor', name: 'Little sailor', emoji: '⛵', blurb: 'Message in a bottle, seagull, whale',
    swatch: ['#1d4f73', '#2a9db3', '#d9534f', '#f2deb0'],
    text: {
      sceneEyebrow: 'A message has washed ashore for you', hint: 'Tap the bottle to pop the cork',
      intro: 'Ahoy! Across the sparkling sea…', wishesTitle: 'Wishes on the wind', closing: '…and he sailed on to happily ever after.',
      share: 'A message in a bottle for you ⛵', icons: ['📅', '⏰', '⚓'], polaroid: '⚓', flourish: '⚓',
    },
    defaults: {
      title: 'A little sailor is on his way!', babyName: 'Noah',
      slides: [
        { style: 'write', text: 'Far across the ocean, where the waves sing softly, a little message was tucked into a bottle.' },
        { style: 'rise', text: 'The seagulls carried it, the whales sang along, and now it has washed up just for you.' },
        { style: 'glow', text: 'The lighthouse is shining and every boat is waving, because a brand-new sailor is coming home.' },
        { style: 'unfurl', text: 'Please join us for a baby shower to welcome our little sailor with love, laughter and a boatload of fun.' },
      ],
      wishes: 'May calm seas always carry you\nMay you be brave in every storm\nMay your heart be your compass\nMay you find friends on every shore',
      from: 'Fair winds and lots of love, Aunt Sara',
      tts: 'Ahoy, everyone! A little sailor is on his way, and we would love for you to come aboard and celebrate with us!',
    },
    colors: {
      burst: ['#ffffff', '#7fe0e6', '#4fc3c9', '#ffd27a', '#ff8a7a', '#bfeaf5'],
      trail: ['#ffffff', '#bfeaf5', '#7fe0e6'], trailKind: 'bubble',
      drift: { kinds: ['bubble', 'bubble', 'dot'], colors: ['#ffffff', '#d7f5f8', '#bfeaf5'], dir: -1 },
      flies: ['#9ff3ff', '#ffffff'], starBase: 0.12, glow: 'rgba(79,195,201,1)',
    },
    guide: { svg: SAILOR_GUIDE, view: { w: 220, h: 270 }, shoulder: '122 132', wave: [-26, 22] },
    companion: SAILOR_FISH,
    hero: { svg: SAILOR_WHALE, view: { w: 340, h: 180 }, size: [0.46, 200, 340], path: 'sea', spout: { x: 250, y: 44 }, bands: null },
    mini: (i) => SAILOR_FISH('mf' + i + '_' + Date.now()), miniMotion: 'out',
    land: SAILOR_LAND, opener: 'bottle', stage: SAILOR_STAGE,
    sfx: { deliver: 'chirp', hero: 'spout', wish: 'bubble', open: 'pop', reveal: 'musicbox' },
  },
};
const THEME_IDS = Object.keys(THEMES);
const DEFAULT_THEME = 'teddy';
const themeOf = (id) => THEMES[id] || THEMES[DEFAULT_THEME];
