<div align="center">

<!-- HERO BANNER — generated SVG, rendered by GitHub -->
<img width="1481" height="479" alt="image" src="https://github.com/user-attachments/assets/10072200-ddb2-4d6b-822f-0bd7707da4f4" />

<br/><br/>

[![Node](https://img.shields.io/badge/Node-20.x-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Claude AI](https://img.shields.io/badge/Powered_by-Claude_3.5_Sonnet-CC785C?style=flat-square)](https://anthropic.com)
[![Tests](https://img.shields.io/badge/Tests-18_passing-22c55e?style=flat-square)](./frontend/src/utils/parseResponse.test.js)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](./backend/Dockerfile)

</div>

---

## The Problem Nobody Solves

You get a test back. Red marks everywhere. You stare at it, feel bad, tell yourself "I'll study harder." You don't. Because "study harder" is not a plan — it's a feeling.

Nobody tells you *why* Q7 was wrong. Nobody maps the gap between what you thought you knew and what the question actually tested. Nobody builds you a recovery schedule that's specific to your specific failure.

**ReviseIQ does all three.** Upload the paper. Get a surgical, question-by-question forensic breakdown. Done in 40 seconds.

---

## How It Works

<div align="center">
<img width="1489" height="393" alt="image" src="https://github.com/user-attachments/assets/2577ba47-c6ea-4b5a-99f9-ca01286c6e82" />
</div>

<br/>

You get **four tabs** when the analysis finishes:

| Tab | What it contains |
|-----|-----------------|
| 🔬 **Autopsy** | Overall score, error type breakdown (concept gap / careless / misread), a 3-sentence clinical verdict on your performance |
| 📋 **Questions** | Every wrong answer in an expandable accordion — what you wrote, what was right, and a precise explanation of the conceptual gap |
| 🗺 **Weakness Map** | Your knowledge gaps, ranked by severity. Not chapters. Actual concepts — the exact thing your brain doesn't have yet |
| 📅 **3-Day Plan** | A day-by-day recovery schedule built from your gaps, with named resources (textbook chapters, specific exercises, videos) |

Export options: **Copy** plain text, **Export** as JSON, **Print** to PDF.

---

## Architecture

<div align="center">
<img width="1483" height="457" alt="image" src="https://github.com/user-attachments/assets/a92a4d38-81d2-4b33-ba5f-de4684128d7f" />
</div>

<br/>

The backend is a hardened Express proxy. The API key never leaves it. Files go through multer memory storage — never touched disk. Every response gets 13 security headers from helmet.js before it leaves the server.

```
Browser → POST /api/analyse (rate-limited: 10/IP/15min)
        ← SSE progress events stream back in real-time
        ← Final JSON report when done

Server → POST https://api.anthropic.com/v1/messages
       ← Structured JSON diagnosis (max_tokens: 10,000)
       → Retries with exponential backoff on 5xx / 529
```

---

## Project Structure

```
reviseiq/
├── .nvmrc                          ← pins Node 20
├── .gitignore
│
├── backend/
│   ├── Dockerfile                  ← node:20-alpine, non-root user, npm ci
│   ├── .env.example
│   └── server.js                   ← ~340 lines. Every security fix lives here.
│
└── frontend/
    ├── index.html                  ← lang="en", OG meta, theme-color
    ├── vite.config.js              ← proxy + Vitest config
    ├── .eslintrc.json              ← ESLint + jsx-a11y
    ├── .prettierrc
    └── src/
        ├── App.jsx                 ← 60 lines. Root orchestrator, nothing else.
        ├── styles/index.css        ← design tokens, reset, print, 640px breakpoints
        ├── constants/errorTypes.js ← single source of truth for error copy
        ├── utils/
        │   ├── parseResponse.js         ← pure function, zero side effects
        │   └── parseResponse.test.js    ← 18 Vitest cases
        ├── hooks/
        │   └── useAnalysis.js      ← SSE streaming hook
        └── components/
            ├── ui/                 ← Card, Tag, Bar, SectionTitle, ErrorBoundary
            ├── nav/TabNav.jsx      ← ARIA tab list (role=tab/tabpanel)
            ├── upload/             ← UploadZone (drag+drop) + UploadView
            ├── loading/Loading.jsx ← real SSE stage progress, no fake timers
            └── report/
                ├── ReportView.jsx      ← tab orchestration + export buttons
                ├── Autopsy.jsx         ← score ring + error breakdown
                ├── ScoreRing.jsx       ← reads CSS vars at runtime
                ├── Questions.jsx
                ├── QuestionCard.jsx    ← aria-expanded accordion
                ├── WeaknessMap.jsx     ← gap list ranked by severity
                └── RevisionPlan.jsx    ← 3-day session planner
```

---

## v1 → v2: What Got Fixed

The original version worked. It also had zero rate limiting, no security headers, a 678-line single component file, fake loading timers, and `alert()` calls for errors. v2 is the version you'd actually ship.

| What broke | What's there now |
|---|---|
| No security headers | helmet.js — CSP, HSTS, X-Frame-Options, 13 total |
| No rate limiting | 10 analyses / IP / 15 min on `/api/analyse` |
| CORS hardcoded to `localhost:5173` | `ALLOWED_ORIGINS` environment variable |
| No API timeout — could hang forever | `AbortSignal.timeout(120_000)` |
| `max_tokens: 6000` broke on long papers | Bumped to `10_000` |
| No input sanitisation | `answerKey ≤ 8000 chars`, `context ≤ 800 chars` |
| No retries | 2 retries + exponential backoff on 5xx / 529 |
| PDFs only read page 1 | `pdf-parse` extracts all pages as text |
| Fake loading stage timers | Real SSE progress events from backend |
| `alert()` for errors | Inline error state + dismiss button |
| 678-line `App.jsx`, 18 components in one file | 12 separate component files, `App.jsx` = 60 lines |
| 127 inline style objects per render | Static constants, defined once |
| Zero ARIA attributes | `role=tab/tabpanel/button`, `aria-expanded`, focus rings |
| Broken on mobile | CSS media queries at 640px |
| No export | Print CSS + Copy text + Export JSON |
| Blank screen on any crash | `ErrorBoundary` wraps all report rendering |
| Zero tests | 18 Vitest cases for parsing + error utilities |
| `console.log` only | `morgan` HTTP request logging |
| `{ status: "ok" }` health check | uptime, memory, apiKeyPresent, timestamp |
| No Docker | `node:20-alpine`, non-root user, `npm ci` |

---

## Getting Started

### Prerequisites

- Node 20+ — [nodejs.org](https://nodejs.org) → LTS
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
- $5 credit on Anthropic billing (~60–200 full analyses)

### Setup

```bash
git clone https://github.com/sat1828/ReviseIQ.git
cd ReviseIQ

# Backend
cd backend
cp .env.example .env
# Open .env and set: ANTHROPIC_API_KEY=sk-ant-api03-...
npm install

# Frontend (new terminal)
cd ../frontend
npm install
```

### Run

Two terminals. Both need to stay open.

**Terminal 1 — backend:**
```bash
cd backend && node server.js
# ✅  ReviseIQ backend v2.0 running on http://localhost:3001
```

**Terminal 2 — frontend:**
```bash
cd frontend && npm run dev
# ➜  Local: http://localhost:5173/
```

Open **http://localhost:5173**.

---

## Using It

1. Take a clear photo of your answered exam paper — flat, good lighting, full page in frame
2. Move it to your PC (WhatsApp Web, USB, email, whatever works)
3. Upload it in the app — drag and drop or click to browse
4. Paste your answer key, one per line: `1. C`, `2. Newton's Third Law`, etc.
5. Add subject context for sharper resource recommendations: `CBSE Class 12 Physics Unit 3`
6. Click **Run forensic analysis**
7. Watch real progress stages appear as the backend streams SSE events — 15–40 seconds
8. Navigate the four report tabs
9. Export: **Copy** for clipboard, **Export** for JSON file, **Print** for PDF

---

## Tests & Linting

```bash
# Tests
cd frontend && npm test
# 18 tests. All passing.

# Linter
cd frontend && npm run lint
# ESLint + jsx-a11y. Zero warnings on clean code.
```

---

## Docker

```bash
cd backend
docker build -t reviseiq-backend .
docker run -e ANTHROPIC_API_KEY=sk-ant-api03-... -p 3001:3001 reviseiq-backend
```

Non-root user. Alpine base. `npm ci` for deterministic installs.

---

## Cost

| Paper size | Approximate cost |
|---|---|
| 10 questions | $0.01–$0.03 |
| 30 questions | $0.04–$0.08 |
| 50 questions | $0.06–$0.12 |

$5 credit → ~60–200 full analyses.

---

## Security

- API key lives in `backend/.env` only — never reaches the browser
- Exam images go to Anthropic's API for processing only, not stored anywhere
- `backend/.env` is in `.gitignore` — won't end up in a commit
- helmet.js sets 13 HTTP security headers on every response
- Rate limiting prevents runaway API spend
- multer uses memory storage — uploaded files never touch disk
- Non-root Docker user for production

---

## Known Limitations

**No persistent storage** — reports disappear on page refresh. Export before closing.

**No accounts** — local only. Not shareable across devices.

**Scanned PDFs** — no text layer means partial analysis. JPEG images work better.

**OCR quality** — blurry or dark photos produce worse output. Flat paper, good light, full frame in shot.

**Rate limit** — 10 analyses per IP per 15 minutes. Built for personal use.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `node` not recognised | Restart PC after installing Node |
| `Cannot find module 'express'` | `npm install` in the `backend` folder |
| `ANTHROPIC_API_KEY is missing` | Check `backend/.env` exists with your key |
| `401 Unauthorized` | Wrong or expired API key — regenerate at console.anthropic.com |
| `402 Payment Required` | Add credit at console.anthropic.com/billing |
| `429 Too Many Requests` | Rate limit — wait 15 minutes |
| Analysis fails silently | Backend not running — check Terminal 1 |
| `Failed to fetch` | Backend not running — start it first |
| White / blank screen | F12 → Console → read the red error |
| PDF only covers part of paper | Scanned PDF with no text layer — switch to JPEG |
| Analysis times out | Image too large or complex — crop tighter |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5 |
| Styling | Vanilla CSS with design tokens |
| State | `useState`, custom `useAnalysis` SSE hook |
| Testing | Vitest (18 cases) |
| Linting | ESLint + jsx-a11y |
| Backend | Node 20, Express 4 |
| Security | helmet.js, express-rate-limit |
| Logging | morgan |
| File handling | multer (memory storage), pdf-parse |
| AI | Anthropic Claude 3.5 Sonnet via `/v1/messages` |
| Container | Docker (node:20-alpine, non-root) |

---

<div align="center">

Built from scratch. Rewritten once. Ships with tests, security headers, and a Dockerfile.

**[⭐ Star if it's useful](https://github.com/sat1828/ReviseIQ)**

</div>
