# 难得读书 · mybook

> **Languages:** [简体中文](README.md) · **English**

> *Become* a character from a literary classic, make one of their agonizing choices — then see your real self reflected back.

A mobile-first interactive "step-into-a-classic" app. Pick a book, choose a character, and the AI re-decomposes the most tension-filled dilemma from the original work into 3–5 decision points that you live through in the first person. When it ends, it generates your **"value tendencies / behavioral pattern"** profile — and you can switch on **Extreme-Pressure Mode** to push the stakes to the limit and compare the everyday you against the you under extreme circumstances.

**Live preview (playable now):** https://3000-ivhgrqhc5osuwu5hzfix2.e2b.app

> Note: this is a temporary sandbox preview URL and may change when the environment restarts. The entrance animations are most visible on the **Loading / Result / Extreme-Compare** screens — play a full round to see them.

---

## Table of Contents

- [1. How to Use](#1-how-to-use)
- [2. Design Thinking & Highlights](#2-design-thinking--highlights)
- [3. UI Preview](#3-ui-preview)
- [4. Running Locally](#4-running-locally)
- [5. Tech Stack](#5-tech-stack)
- [6. Directory Structure](#6-directory-structure)

---

## 1. How to Use

### For players

1. **Open the app** — open the live preview on your phone browser: `https://3000-ivhgrqhc5osuwu5hzfix2.e2b.app` (best on mobile, portrait).
2. **Pick a theme (optional)** — a row of swipeable theme "chips" sits at the top of the home page:
   - 💗 **Love · Lovers**, 💼 **Career · Choices**, 🌱 **Growth · Self**, 👪 **Family · Kin**, 🗡 **Survival · Fate**.
   - Choosing a theme prioritizes characters whose dilemmas **genuinely fit the original story** (e.g. pick "Love" and Lin Daiyu follows an emotional arc; Zhuge Liang is *not* forced into romance — he falls back to his real canonical dilemmas such as the Wuzhang Plains).
3. **Pick a book** — tap a book card (e.g. *Dream of the Red Chamber*, *Romance of the Three Kingdoms*). Each card is tinted with that book's "spine color"; one tap enters.
4. **Meet your character** — the intro page shows who this person is: title, character name, a one-line tagline, field tags, and the AI-distilled "Character DNA — three questions."
5. **Wait while the AI prepares** — the loading screen reveals the AI's thinking steps (reading the whole book → finding the character with the densest dilemmas → unpacking motives → distilling decision points → about to enter their body).
6. **Make choices, immersed** — a dark, immersive story page lets you read the original situation in first person and choose at each decision point. Every choice is recorded into your "choice trajectory."
7. **See your result profile** — after all nodes, the result page shows:
   - **Choice trajectory** — what you chose at each node;
   - **Value tendencies** — what you weigh more (loyalty / self-preservation / emotion / reason…);
   - **AI narration & your pattern** — the AI's reading of this run;
   - **Mirror to yourself** — a reflection mapping the character's situation back to real life.
8. **Enter Extreme-Pressure Mode** — from the result page, the AI **upgrades the same character's dilemma into irreversible, extreme choices** for another round.
9. **Extreme comparison** — after the extreme run, the compare page contrasts "everyday you vs. extreme you" act by act, revealing where your line is.
10. **Share / play again** — every result page can share the story, or "switch book / play again / try extreme."

### For developers

- To get running fast, see [4. Running Locally](#4-running-locally).
- App copy uses `react-i18next` (`en-US` / `zh-CN`); strings live in `src/i18n/locales/*.json` — never hardcode visible strings.
- AI capabilities call through the Eazo official model proxy (text model `deepseek.v3.1`); secrets live only in `.env`, which is **not git-tracked**.

---

## 2. Design Thinking & Highlights

### Core product idea

Turn "reading a classic" from passive reading into a **first-person immersive decision experiment**. You do not watch the character's fate — you stand in their place and choose, then hold up a "mirror" to yourself. That is the whole point of *难得读书*: you read a book, but what you see is yourself.

### Highlight 1: Canon-faithful theme matching (no forcing)

Theme filtering is not simple tagging; it runs a **canon-faithful matching algorithm**:

- themes (Love / Career / Growth / Family / Survival) map to internal dilemma "fields";
- a dilemma is only up-weighted when it **intersects a field that truly exists for that character in the original work**;
- when there is no intersection it **never forces one** — it falls back to that character's real core dilemma.
- Result: pick "Love" and Lin Daiyu's emotional arc makes sense; Zhuge Liang returns to a real dilemma like the Wuzhang Plains rather than being shoehorned into a love scene.

### Highlight 2: Clear teal-blue palette · translucent glassmorphism

The visual identity is a fresh, translucent, premium "clear teal-blue" system:

- a **mint–emerald–cyan aurora backdrop** (`fresh-backdrop`) with a slow drifting gradient (`auroraDrift` 16s) — clean but not static;
- **frosted glass panels** (`glass-panel`, `backdrop-filter: blur(22px)`) with top-edge highlights, light and layered;
- buttons use a teal gradient (`#14b8a6 → #0ea5b7`) and a warm-orange gradient (for Extreme Mode), with generous rounded corners;
- deliberately avoids the "dark-green ground + pale text" legibility trap: dark-region text uses high-contrast bright mint (`#eafdf9`); titles use a white stroke + deep-green shadow for a "gilt-embossed" feel.

### Highlight 3: A clean icon language (no more emoji clutter)

Following the "taste-skill" anti-slop design principle, scattered emojis (🔥📊🎭⟷) are unified into consistent **Lucide line icons** (`Flame` / `Share2` / `Drama` / `MoveHorizontal`) — one restrained, premium visual language.

### Highlight 4: One layered entrance animation across the whole flow

A single "rise-and-focus" entrance animation runs throughout:

- keyframe `riseIn`: blocks rise from below + a slight scale-up + blur-to-clear (blur 6px→0);
- easing uses `cubic-bezier(.16,1,.3,1)` (ease-out-expo): fast start, soft finish;
- the `.stagger-in` container makes child blocks **cascade in** at ~0.07s increments;
- applied consistently to **Loading / Result / Extreme-Compare** screens; the top bar stays stable (no animation) so nothing feels jittery;
- respects `prefers-reduced-motion`: motion stops automatically when the OS disables it.

### Highlight 5: A "dual color-domain" split between immersive reading and the result profile

The immersive story page keeps a **dark** atmosphere (to focus on story and choice), while home / character / result / extreme pages use the **light glass** system. The two domains are cleanly isolated by scoped CSS rules so they never bleed into each other, and the top bar style is unified across the whole flow.

---

### 📖 Full design philosophy · Design Notes

The highlights above are visual and product-level. The product's *real* core — **how to discover your values without presupposing any, how extreme pressure forces out deeper values, how anchors and the two-pass comparison are designed, how the main plot and free choice are balanced, and how to re-read classics through a modern lens** — is broken into 17 principles (plus a "🚧 backlog" of unshipped ideas), each mapping to real code:

👉 **[Design Notes (condensed English)](docs/DESIGN_NOTES.en.md)** — the 17 principles, the Reverse-Productization methodology, and the landing-status table.

🀄 中文完整版：**[《价值说明 · 难得读书的设计哲学》](docs/价值说明.md)**

> 🧭 **The meta-principle "Reverse Productization"**: this philosophy was not "write principles first, then build." It ran the other way — **build → extract principles from the product → use them as a ruler to find where the product falls short → reinforce → extract again**, in a loop. The doc also appends a **per-principle landing self-assessment** (🟢 truly landed / 🟡 strong skeleton, AI-fleshed / 🔴 heavily AI-dependent), honestly marking what to fix next.
>
> **Why principle design *is* the product:** UI and the model decide what this product *looks like*; the principle design decides *whether it is actually that thing*. The skin can be copied — the bone structure cannot.

---

## 3. UI Preview

> No static screenshots are bundled yet. The most direct way is to **open the live preview**:
> https://3000-ivhgrqhc5osuwu5hzfix2.e2b.app
>
> To add static shots, play a round on a device/browser, drop images into `docs/`, and replace the placeholders below.

| Home · theme select | Character intro | Immersive story |
| :---: | :---: | :---: |
| `docs/home.png` | `docs/character.png` | `docs/story.png` |

| Loading | Result profile | Extreme compare |
| :---: | :---: | :---: |
| `docs/loading.png` | `docs/result.png` | `docs/compare.png` |

**Key-screen flow (text version):**

```
Home (theme chips + book list)
   └─ pick book → Character intro (Character DNA, 3 questions)
        └─→ Loading (AI thinking steps)
             └─→ Immersive story (first-person choices, node by node)
                  └─→ Result profile (trajectory / value tendencies / mirror)
                       └─(optional)→ Extreme mode → Extreme compare (everyday you vs. extreme you)
```

---

## 4. Running Locally

Built on Eazo's Next.js template; package manager is **Bun**.

```bash
# 1. Install dependencies
bun install
# If installing sharp stalls locally:
# SHARP_IGNORE_GLOBAL_LIBVIPS=1 bun install

# 2. Configure env vars (copy the example and fill in your own keys)
cp .env.example .env
#   then edit .env and fill in the Eazo App EAZO_* variables
#   ⚠️ .env is gitignored — never commit any secret

# 3. Start the dev server
bun dev
#   defaults to http://localhost:3000

# 4. Production build
bun run build
bun start
```

### Environment variables

| Variable | Description |
|---|---|
| `EAZO_PRIVATE_KEY` | Eazo developer private key (64-char hex); used server-side to decrypt user session tokens. **Never expose it to the browser.** |
| `EAZO_*` (others) | App credentials and endpoints for the Eazo App AI proxy. If missing, AI endpoints return unavailable. |

> Note: this app's AI capabilities depend on the Eazo official model proxy; valid Eazo App credentials are required to generate stories and profiles.

---

## 5. Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + custom glassmorphism CSS tokens
- **Motion**: Framer Motion + custom CSS layered entrance (`riseIn` / `stagger-in`)
- **Icons**: lucide-react
- **i18n**: react-i18next (`en-US` / `zh-CN`)
- **AI**: Eazo official model proxy (text model `deepseek.v3.1`)
- **Data/ORM** (if enabled): Drizzle ORM + Postgres
- **Runtime/PM**: Bun

---

## 6. Directory Structure

```
src/
├─ app/
│  ├─ page.tsx                 # Home: theme select + book list + state routing
│  └─ api/narrative/init/      # Story init: decode theme filter, canon-faithful dilemma weighting
├─ components/reader/
│  ├─ book-select.tsx          # Swipeable theme chips + white-glass book cards
│  ├─ agent-character-intro.tsx# Character intro (teal glass, Character DNA 3-questions)
│  ├─ loading-screen.tsx       # Loading (pulsing ring + thinking steps + layered entrance)
│  ├─ agent-result-page.tsx    # Result profile (layered entrance + Lucide icons)
│  ├─ agent-compare-page.tsx   # Extreme-compare (normal vs. extreme)
│  └─ page-topbar.tsx          # Unified top bar (light-glass / dark-immersive)
├─ lib/reader/types.ts         # Theme mapping + themed preset book list
├─ i18n/locales/*.json         # zh-CN / en-US copy
└─ app/globals.css             # Color tokens + glassmorphism + layered entrance
```

---

- [Eazo Docs](https://docs.eazo.ai) · [Next.js Docs](https://nextjs.org/docs)

---

## License

Licensed under **[CC BY-NC 4.0](LICENSE)** (Attribution–NonCommercial 4.0 International): free to share and adapt, but **attribution to jassbin is required and commercial use is prohibited**. This project's reinterpretation of **public-domain classics** (*Dream of the Red Chamber*, *Romance of the Three Kingdoms*, *Journey to the West*, etc.) is original content covered by this license (dilemma design, code, narrative framing).

_Built with Eazo._
