# Little Boy Card 🧸🚀⛵

An animated baby-shower card for little boys, with three themes, gentle sound effects, and a small backend for saving and sharing cards.

## The three themes

| | 🧸 Teddy bear picnic | 🚀 Space explorer | ⛵ Little sailor |
|---|---|---|---|
| **Opening** | An envelope with a blue paw-print seal. The teddy waves his star wand, the seal pops, the flap opens and the letter rises in a burst of light. | A rocket on a launch pad with a big red button. Press it for a 3‑2‑1 countdown, smoke and a liftoff. | A message in a bottle washes up on the beach. Tap it: the cork wiggles, pops off, and a scroll unrolls. |
| **Guide** (delivers each part) | A teddy bear floating on balloons | A little astronaut with a jetpack | A seagull in a sailor hat |
| **Companion** (lands on each part) | A honey bee | A smiling comet | A little flying fish |
| **Hero moment** (once, after the title) | A toy train of teddies puffing heart-shaped smoke | A shooting star with a rainbow trail | A whale that swims past and spouts |
| **Scenery** | Meadow, picnic blanket, oak tree with a swing | Moon surface, ringed planet, moon base, flag | Sea, lighthouse (its beam sweeps at night), sailboats, beach |
| **Wishes** | Honey jars fill up one by one | Stars light up and join into a constellation | Bubbles float up into place |
| **Ending** | Confetti and hearts, balloons float up | Star confetti, comets fly out | Bubbles rise, fish leap out |

**What guests see in every theme**
1. **The opening** above. Sparkles follow your finger (bubbles on the beach), and the scenery moves as you tilt the phone or move the mouse.
2. **The story, as you scroll:** the sky turns into a starry night. For each part, the guide flies over and pulls it out of the letter he carries, and the companion lands on it.
   - **Title:** written letter by letter, with the baby's name. Then the hero moment.
   - **Story pages:** each page's words appear in one of four styles: written by magic, float up, unrolling scroll or glowing words.
   - **Photo:** drops in on a ribbon and develops like a polaroid. Tap it to see it big.
   - **You're invited:** date, time and place, with *Add to calendar*, *Google Calendar* and *Directions* buttons.
   - **Wishes:** themed as above.
   - **Ending:** the theme's closing line, the signature, a celebration, and a small "Made with love by …" credit. The guide waves goodbye and leaves, and comes back if you scroll up.
3. **Voice:** a recorded or uploaded voice-over (or a computer voice) plays after the title, with a *Play voice* button.
4. **Sound effects:** soft, short sounds at the key moments (seal pop, music box, countdown beeps, rocket rumble, cork pop, waves, train whistle, whale spout, bubbles, twinkles…). They start after the guest's first tap (browsers require this), get quieter while the voice-over plays, and the 🔊 button in the corner turns them off (remembered on that device). All sounds are generated in the browser, so there are no audio files to license.

If a guest has "reduce motion" turned on, the card shows a calm version with no movement.

## Your shop name

Open `public/brand.js` and change `shopName` (and optionally `shopUrl`, e.g. your Etsy shop link). It appears as a small credit at the end of every card and in the editor. Set it to `''` to hide it.

## Run it on your computer

You need Node.js 18 or newer (https://nodejs.org).

```bash
npm install
npm start
```

- http://localhost:3000/create.html: make a card. Pick a theme first (its sample words fill in, and you can change them). You get a **share link** (`/c/<id>`) and a **private edit link**.
- http://localhost:3000/: a sample card, with a small "Try" bar at the top to switch theme. You can link straight to one: `/?theme=teddy`, `/?theme=space`, `/?theme=sailor`. These links work well for your Etsy listing so buyers can try each theme.
- In the editor, **👀 Preview** opens your card with unsaved changes in a new tab.

> Recording a voice note needs the microphone, which browsers only allow on `localhost` or an `https://` site.

## Put it online

Any host that runs Node works (Render, Railway, Fly.io, a VPS…).

- **Start command:** `npm start`. It reads the `PORT` the host gives it.
- **Storage:** cards and uploads are saved in the `data/` folder. On hosts with a temporary disk, attach a **persistent disk** and set `DATA_DIR` to its path, or cards will vanish on redeploy.
- **Fonts:** the fonts (Fredoka, Baloo 2, Pacifico, Nunito, Caveat) come from npm packages under the SIL Open Font License, which allows commercial use. The app serves them itself, so nothing loads from Google.
- **Licences for selling:** all characters and scenery are original vector drawings made for this project. GSAP (the animation library) is free for commercial use.

## Files

| File | What it does |
|---|---|
| `server.js` | Backend: saves/loads cards (including the theme), uploads, the calendar invite, link previews, serves pages and fonts |
| `public/themes.js` | **Everything theme-specific:** words, sample text, colours, characters, scenery and opening scenes for the three themes |
| `public/index.html`, `app.js`, `style.css` | The card: opening scenes, scrolling story, all animations |
| `public/sfx.js` | The sound effects |
| `public/voice.js` | Voice-over and computer-voice playback |
| `public/create.html`, `create.js` | The editor, with the theme picker |
| `public/brand.js` | Your shop name for the credit line |
| `public/fonts.css` | Font definitions |

### Adding a new theme later
Add an entry to `THEMES` in `public/themes.js` (copy one of the three and change its art, words and colours). Then add its id to `THEMES` in `server.js` and its colours to the `body.theme-…` blocks in `style.css` and `create.html`.

## API

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/cards` | Multipart form fields: `theme` (`teddy`, `space` or `sailor`), `title`, `babyName`, `slides` (JSON list of `{text, style}`; style is `write`, `rise`, `unfurl` or `glow`; max 8), `date` (YYYY-MM-DD), `time` (HH:MM), `venue`, `wishes` (one per line), `from`, `caption`, `tts`; files `photo`, `voice`. Returns the card plus its `editKey` |
| `GET` | `/api/cards/:id` | Public card data |
| `PUT` | `/api/cards/:id` | Same fields, with header `X-Edit-Key`. Send `removePhoto=1` / `removeVoice=1` to delete the photo or voice |
| `DELETE` | `/api/cards/:id` | Header `X-Edit-Key` |
| `GET` | `/c/:id/invite.ics` | Calendar invite for the card's event |

Cards saved before themes existed open in the Teddy bear theme. Older cards that have a single `message` still work: it shows as one story page.
