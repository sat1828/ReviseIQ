<div align="center">

<br/>

```
██████╗ ███████╗██╗   ██╗██╗███████╗███████╗    ██╗ ██████╗
██╔══██╗██╔════╝██║   ██║██║██╔════╝██╔════╝    ██║██╔═══██╗
██████╔╝█████╗  ██║   ██║██║███████╗█████╗      ██║██║   ██║
██╔══██╗██╔══╝  ╚██╗ ██╔╝██║╚════██║██╔══╝      ██║██║▄▄ ██║
██║  ██║███████╗ ╚████╔╝ ██║███████║███████╗    ██║╚██████╔╝
╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚═╝╚══════╝╚══════╝    ╚═╝ ╚══▀▀═╝
```

### Post-exam learning intelligence. Not a grade — a diagnosis.

<br/>

![demo](./demo.gif)

<br/>

[![Node](https://img.shields.io/badge/Node-20_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Claude](https://img.shields.io/badge/claude--3--5--sonnet-Anthropic-d97706?style=flat-square)](https://anthropic.com)
[![Tests](https://img.shields.io/badge/Vitest-18_passing-4ade80?style=flat-square)](https://vitest.dev)
[![Docker](https://img.shields.io/badge/Docker-alpine_non--root-2496ed?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-ff4d6d?style=flat-square)](LICENSE)
[![JS](https://img.shields.io/badge/JavaScript-90.9%25-f1e05a?style=flat-square&logo=javascript&logoColor=black)](https://github.com/sat1828/ReviseIQ)

<br/>

</div>

---

## What this actually does

You finish an exam. You get `74%` back. That number tells you nothing about which concept to re-read, which mistake is following you across every paper, or what to do in the next 72 hours.

ReviseIQ fixes that.

Upload a photo of your answered exam paper — the raw, handwritten one. Paste your answer key. The backend sends it to Claude's vision API, which reads every single answer you wrote, compares it to what was correct, and returns a structured JSON diagnosis covering:

| Output | What you get |
|---|---|
| **Score ring** | Percentage + raw count, rendered as an animated donut |
| **Error breakdown** | Conceptual gaps vs calculation errors vs careless mistakes — proportioned |
| **Diagnosis** | 3 sentences. Specific. No filler. What your pattern is, not what your symptoms are. |
| **Question-by-question** | Every wrong answer explained at the concept level — not just "that's wrong" |
| **Weakness map** | Your topic gaps ranked by severity and impact on score |
| **3-day plan** | Named resources, specific chapters, time-blocked sessions for each gap |

The report renders across four ARIA-compliant tabs. You can copy it as plain text, export as JSON, or print it as a clean PDF via the browser.

---

## Full walkthrough

![upload screen](./upload.gif)

### The upload screen

Three inputs. No account required, no data stored anywhere.

1. **Your exam paper** — JPG, PNG, or PDF. Multer holds it in memory; it never touches disk.
2. **Answer key** — one per line, any format. Claude reads it correctly whether you write `1. C` or `1. The mitochondria is the powerhouse of the cell`.
3. **Context** (optional) — board, class, subject, chapter. The more specific, the better the revision resources Claude recommends.

---

![loading to report](./loading.gif)

### The loading screen

Six real SSE progress events streamed from the backend — not a fake spinner lying to your face about what's happening. The screen disappears the moment your report is actually ready.

---

![full report tabs](./report.gif)

### The report — four tabs

**🔬 Autopsy** — Score ring reads CSS variables at runtime so it respects your system theme. Error breakdown is proportioned exactly to your actual error distribution. The diagnosis is written at a level that tells you what the pattern is, not just what the symptoms are.

**📋 Questions** — Wrong answers get full cards with your answer, the correct answer, and a concept-level explanation. Correct answers are visible but collapsed — you're not here to re-read what you already know.

**🗺 Weakness Map** — Topic gaps ranked critical → high → medium → solid. Each gap has a severity bar, a plain-English description, the specific question numbers that exposed it, and named revision resources.

**📅 3-Day Plan** — Not "study more." Named resources, specific chapters, session-level time blocks, and a measurable end-goal for each day. Day 3 is always "upload your mock paper here and check if the gaps actually closed."

---

## Architecture

![system architecture](./arch.gif)

```
Browser (React + Vite :5173)
        │
        │ POST /api/analyse  (FormData — image or PDF)
        ▼
Express Server (:3001)
  ├── helmet.js            ← 13 HTTP security headers (CSP, HSTS, X-Frame-Options…)
  ├── express-rate-limit   ← 10 req / IP / 15 min on /api/analyse
  ├── cors                 ← ALLOWED_ORIGINS env variable — no hardcoded localhost
  ├── multer               ← memory storage, never writes to disk
  ├── morgan               ← HTTP request logging
  │
  ├── if PDF → pdf-parse   ← extracts all pages as text, builds image block
  ├── base64 encode image
  │
  └── POST api.anthropic.com/v1/messages
          model: claude-3-5-sonnet
          max_tokens: 10,000
          AbortSignal.timeout(120_000ms)
          retry × 2 with exponential backoff on 5xx / 529
          │
          ▼
     JSON response → parseResponse.js (pure fn, 18 Vitest tests)
          │
          ▼ SSE progress events stream back to browser throughout
          │
     ReportView.jsx → 4 tabs rendered
```

The API key lives on the server only. It is never sent to the browser, never logged, never in any response. The frontend talks to `localhost:3001` — not to Anthropic directly.

---

## Project structure

```
reviseiq/
├── .gitignore
├── .nvmrc                              ← Node 20 pinned
├── README.md
│
├── backend/
│   ├── Dockerfile                      ← node:20-alpine, non-root user, npm ci
│   ├── .env.example                    ← copy this to .env before running
│   ├── package.json
│   └── server.js                       ← the whole hardened proxy
│                                           helmet · rate-limit · cors · multer · morgan
│                                           AbortSignal · retries · pdf-parse · SSE
│
└── frontend/
    ├── index.html                      ← lang="en", OG meta, theme-color
    ├── vite.config.js                  ← dev proxy to :3001 + Vitest config
    ├── package.json
    ├── .eslintrc.json                  ← ESLint + jsx-a11y (accessibility linting)
    ├── .prettierrc
    └── src/
        ├── App.jsx                     ← root, ~60 lines
        ├── main.jsx
        ├── setupTests.js
        ├── styles/
        │   └── index.css               ← design tokens, reset, 640px responsive, print
        ├── constants/
        │   └── errorTypes.js           ← single source of truth for error category data
        ├── utils/
        │   ├── parseResponse.js        ← pure JSON parsing — strips fences, validates shape
        │   └── parseResponse.test.js   ← 18 Vitest tests (malformed, truncated, missing fields)
        ├── hooks/
        │   └── useAnalysis.js          ← SSE streaming hook, manages loading stages
        └── components/
            ├── ui/
            │   ├── index.jsx           ← Card, Tag, Bar, SectionTitle shared primitives
            │   └── ErrorBoundary.jsx
            ├── nav/
            │   └── TabNav.jsx          ← role=tablist/tab/tabpanel, aria-selected
            ├── upload/
            │   ├── UploadZone.jsx      ← accessible drag-and-drop, keyboard-usable
            │   └── UploadView.jsx
            ├── loading/
            │   └── Loading.jsx         ← renders real SSE stage messages
            └── report/
                ├── ReportView.jsx      ← tab switching + Copy / Export / Print
                ├── Autopsy.jsx         ← score ring, error breakdown, diagnosis
                ├── ScoreRing.jsx       ← donut chart, reads CSS vars at runtime
                ├── Questions.jsx       ← correct/incorrect list
                ├── QuestionCard.jsx    ← aria-expanded accordion per question
                ├── WeaknessMap.jsx     ← topics ranked by severity
                └── RevisionPlan.jsx    ← 3-day sessions with named resources
```

**Language breakdown:** JavaScript 90.9% · CSS 6.9% · Dockerfile 1.2% · HTML 1.0%

---

## What changed from v1

v1 was a proof of concept. v2 is something you can run, trust, and show people.

| Area | v1 | v2 |
|---|---|---|
| Security headers | None | helmet.js — CSP, HSTS, X-Frame-Options + 10 more |
| Rate limiting | None — unlimited API calls | 10 analyses / IP / 15 min on `/api/analyse` |
| CORS | Hardcoded `localhost:5173` | `ALLOWED_ORIGINS` environment variable |
| API timeout | None — could hang forever | `AbortSignal.timeout(120_000ms)` |
| JSON truncation | `max_tokens: 6000` — broke on long papers | `max_tokens: 10,000` |
| Input sanitisation | None | `answerKey ≤ 8,000 chars` · `context ≤ 800 chars` |
| Retries | None | 2 retries + exponential backoff on 5xx / 529 |
| PDF multi-page | Page 1 only | `pdf-parse` extracts all pages |
| Loading UI | Fake timer stages | Real SSE progress events from backend |
| Error display | `alert()` — janky, unsafe | Inline error state with dismiss button |
| App.jsx | 678 lines, 18 components in one file | 12 separate component files |
| Inline styles | 127 style objects recreated per render | Static constants, defined once |
| Accessibility | Zero ARIA | `role=tab/tabpanel/button`, `aria-expanded`, focus rings |
| Responsive | Broken on mobile | CSS media queries at 640px |
| Export | Nothing | Print CSS + Copy text + Export JSON |
| Error boundary | None — blank screen on crash | `ErrorBoundary` wraps all report rendering |
| Tests | None | 18 Vitest tests for parsing + error utilities |
| Linting | None | ESLint + `jsx-a11y` plugin |
| Logging | `console.log` | `morgan` HTTP request logging |
| Health check | `{ status: "ok" }` | uptime, memory, `apiKeyPresent`, timestamp |
| Docker | None | `node:20-alpine`, non-root user, `npm ci` |

---

## Setup

### Prerequisites

- **Node.js 20 LTS** — [nodejs.org](https://nodejs.org) → LTS → install → restart machine
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com) → Settings → API Keys → Create Key (starts `sk-ant-api03-`) → add ≥ $5 billing credit

```bash
node --version   # v20.x.x or higher ✓
```

> You see the API key **exactly once** when you create it. Copy it before closing the page.

---

### Backend

```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
```

Edit `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-your-real-key-here
ALLOWED_ORIGINS=http://localhost:5173
PORT=3001
```

```bash
npm install
```

---

### Frontend

```bash
cd frontend
npm install
```

---

## Running

Two terminals. Both must be running at the same time.

**Terminal 1 — backend:**

```bash
cd backend
node server.js
```

```
✅  ReviseIQ backend v2.0 running on http://localhost:3001
    API key : sk-ant-api03-...
    Origins : http://localhost:5173
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm run dev
```

```
VITE v5.x.x  ready
➜  Local:   http://localhost:5173/
```

Open **[http://localhost:5173](http://localhost:5173)**.

---

## Using it

1. Take a clear, flat-paper photo of your answered exam paper — phone camera is fine
2. Upload it (drag-drop or click)
3. Paste your answer key, one per line: `1. C` or `1. Newton's Third Law`
4. Add context if you want sharper resource recommendations: `CBSE Class 12 Chemistry Unit 3`
5. Click **Run forensic analysis**
6. Watch real SSE progress events — 15–40 seconds depending on paper length
7. Read the four tabs

**Export options:**

| Button | What it does |
|---|---|
| 📋 Copy | Full report as plain text to clipboard |
| ⬇ Export | Downloads `.json` file you can archive or feed into other tools |
| 🖨 Print | Opens print dialog with a clean printer-optimised layout — Save as PDF works perfectly |

---

## Tests

```bash
cd frontend
npm test
```

18 tests in `parseResponse.test.js` covering the pure JSON parsing function — valid responses, JSON wrapped in markdown fences, malformed JSON, truncated output, missing required fields, unexpected shapes, and edge cases that broke v1.

---

## Linting

```bash
cd frontend
npm run lint
```

ESLint with `jsx-a11y` catches accessibility violations at the source — missing ARIA labels, non-interactive elements with click handlers, focus management.

---

## Docker

```bash
cd backend
docker build -t reviseiq-backend .
docker run -p 3001:3001 \
  -e ANTHROPIC_API_KEY=sk-ant-api03-your-key \
  -e ALLOWED_ORIGINS=http://localhost:5173 \
  reviseiq-backend
```

`node:20-alpine`, non-root user, `npm ci` for a reproducible build.

---

## Health check

```bash
curl http://localhost:3001/health
```

Returns `uptime`, `memory`, `apiKeyPresent`, and `timestamp`. Useful for confirming the backend is actually running before wondering why your upload isn't going anywhere.

---

## Cost

| Paper length | Per analysis |
|---|---|
| 10 questions | $0.01 – $0.03 |
| 30 questions | $0.04 – $0.08 |
| 50 questions | $0.06 – $0.12 |

$5 of API credit ≈ 60–200 analyses depending on paper complexity. The rate limiter (10 per IP per 15 min) is there to protect your credit from runaway loops, not to be annoying.

---

## Security model

- API key in `backend/.env` only — never sent to browser, never logged, never in any response
- `.env` is in `.gitignore` — cannot be committed accidentally
- Exam paper images sent to Anthropic's API for processing only — not stored anywhere, not on disk, not in memory beyond the request lifetime
- `helmet.js` sets 13 HTTP security headers on every response (CSP, HSTS, X-Frame-Options, Referrer-Policy, and more)
- Rate limiting prevents runaway API spend
- `multer` memory storage — no temp files accumulate on host
- Docker image runs as non-root user

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `node` not recognised | Restart machine after installing Node |
| `Cannot find module 'express'` | Run `npm install` inside `backend/` |
| `ANTHROPIC_API_KEY is missing` | Check that `backend/.env` exists with your key |
| `401 Unauthorized` | Wrong or expired API key — regenerate at console.anthropic.com |
| `402 Payment Required` | Add billing credit at console.anthropic.com |
| `429 Too Many Requests` | Rate limit hit — wait 15 minutes |
| App loads, analysis fails silently | Backend not running — check Terminal 1 |
| `Failed to fetch` / network error | Backend not running — start it first |
| White screen after analysis | Open DevTools → Console → read the red error |
| PDF only covers part of paper | Scanned PDF with no text layer — use JPG images of each page instead |
| Analysis times out | Image too large — try a smaller crop or lower resolution |

---

## Known limitations

**No persistent storage.** Reports vanish on page refresh. Use Export or Print before closing.

**No user accounts.** Local tool, not a SaaS. There is no backend database.

**Scanned PDFs.** `pdf-parse` only extracts text layers. If your PDF is a scanned image with no embedded text, use JPEG photos of each page for best results.

**OCR quality.** The quality of Claude's analysis depends directly on photo quality. Blurry, dark, or heavily shadowed images degrade results. Even light, flat paper, whole page in frame.

**Rate limit.** 10 analyses per IP per 15 minutes. Designed for personal use, not batch processing.

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite 5 | Fast HMR, built-in proxy to backend, Vitest config |
| Styles | CSS custom properties | Zero runtime, print layer included, theme-aware |
| Testing | Vitest | Co-located with Vite, same config, fast |
| Linting | ESLint + jsx-a11y | Catches a11y issues at source before they ship |
| Backend | Node 20 + Express | Stable, predictable, minimal surface area |
| Security | helmet.js | 13 headers in one line, well-maintained |
| Rate limit | express-rate-limit | Protects both the API key and Anthropic spend |
| Upload | multer (memory) | No disk I/O, no temp file cleanup needed |
| PDF | pdf-parse | Extracts all pages as text, lightweight |
| AI | claude-3-5-sonnet | Best vision accuracy for handwritten exam papers |
| Container | Docker alpine + non-root | Minimal attack surface, reproducible builds |

---

<div align="center">

Built for the student who's tired of not knowing why.

</div>
