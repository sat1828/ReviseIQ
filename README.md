# ReviseIQ v2.0 — Post-Exam Learning Intelligence

Upload an answered exam paper. Get a surgical, question-by-question forensic diagnosis.
Know exactly why you failed and get a targeted 3-day revision plan.

---

## What changed in v2.0

| Area | v1 (broken) | v2 (fixed) |
|---|---|---|
| Security headers | None | helmet.js — CSP, HSTS, X-Frame-Options, etc. |
| Rate limiting | None — unlimited API calls | 10 analyses / IP / 15 min on /api/analyse |
| CORS | Hardcoded localhost:5173 | Environment variable ALLOWED_ORIGINS |
| API timeout | None — could hang forever | AbortSignal.timeout(120 000ms) |
| JSON truncation | max_tokens: 6000 (broke on long papers) | max_tokens: 10 000 |
| Input sanitisation | None | answerKey ≤ 8 000 chars, context ≤ 800 chars |
| Retries | None | 2 retries + exponential backoff on 5xx/529 |
| PDF multi-page | Broken — page 1 only | pdf-parse extracts all pages as text |
| Loading UI | Fake timer stages | Real SSE progress events from backend |
| Error display | alert() — janky, unsafe | Inline error state + dismiss button |
| App.jsx | 678 lines, 18 components in 1 file | 12 separate component files |
| Inline styles | 127 style objects per render | Static constants, defined once |
| Accessibility | Zero ARIA | role=tab/tabpanel/button, aria-expanded, focus rings |
| Responsive | Broken on mobile | CSS media queries at 640px |
| Print / export | Nothing | Print CSS + Copy text + Export JSON |
| Error boundary | None — blank screen on crash | ErrorBoundary wraps all report rendering |
| Tests | None | Vitest — 18 tests for parsing + error utilities |
| Linting | None | ESLint + jsx-a11y plugin |
| Logging | console.log only | morgan HTTP request logging |
| Health check | { status: "ok" } | uptime, memory, apiKeyPresent, timestamp |
| Dockerfile | None | node:20-alpine, non-root user, npm ci |

---

## Project structure

```
reviseiq/
├── .gitignore
├── .nvmrc                          ← pins Node 20
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── .env.example                ← template — copy to .env
│   ├── package.json
│   └── server.js                   ← hardened Express proxy (all 9 critical fixes)
│
└── frontend/
    ├── index.html                  ← lang="en", OG tags, theme-color
    ├── vite.config.js              ← Vite proxy + Vitest config
    ├── package.json
    ├── .eslintrc.json              ← ESLint + jsx-a11y
    ├── .prettierrc
    └── src/
        ├── App.jsx                 ← root orchestrator (~60 lines)
        ├── main.jsx
        ├── setupTests.js
        ├── styles/
        │   └── index.css           ← tokens, reset, responsive, print
        ├── constants/
        │   └── errorTypes.js       ← single source of truth for error type data
        ├── utils/
        │   ├── parseResponse.js    ← pure JSON parsing function
        │   └── parseResponse.test.js ← 18 Vitest tests
        ├── hooks/
        │   └── useAnalysis.js      ← SSE streaming hook
        └── components/
            ├── ui/
            │   ├── index.jsx       ← Card, Tag, Bar, SectionTitle
            │   └── ErrorBoundary.jsx
            ├── nav/
            │   └── TabNav.jsx      ← ARIA-compliant tab list
            ├── upload/
            │   ├── UploadZone.jsx  ← accessible drag & drop
            │   └── UploadView.jsx  ← upload form
            ├── loading/
            │   └── Loading.jsx     ← real SSE-stage progress
            └── report/
                ├── ReportView.jsx  ← tab orchestration + export buttons
                ├── Autopsy.jsx
                ├── ScoreRing.jsx   ← reads CSS vars at runtime
                ├── Questions.jsx
                ├── QuestionCard.jsx ← aria-expanded accordion
                ├── WeaknessMap.jsx
                └── RevisionPlan.jsx
```

---

## One-time setup

### Step 1 — Install Node.js

1. Go to **https://nodejs.org**
2. Click **LTS** (left green button)
3. Download and run the installer — click Next through everything
4. **Restart your PC**

Check it worked: open Command Prompt (`Windows key + R` → `cmd` → Enter):
```
node --version
```
Should show `v20.x.x` or higher. ✅

---

### Step 2 — Get an Anthropic API key

1. Go to **https://console.anthropic.com**
2. Sign up and log in
3. Go to **Settings → API Keys → Create Key**
4. Name it `reviseiq`, copy the key (starts with `sk-ant-api03-`)
5. Go to **Billing → Add payment method** — add $5 credit

⚠ You see the key ONCE. Copy it now.

---

### Step 3 — Download and extract this project

Extract the ZIP to your Desktop. You should have a `reviseiq` folder.

---

### Step 4 — Set up the backend (once only)

Open Command Prompt:

```cmd
cd Desktop\reviseiq\backend
copy .env.example .env
notepad .env
```

In Notepad, replace `sk-ant-api03-REPLACE-WITH-YOUR-KEY` with your real key. Save and close.

```cmd
npm install
```

Wait for it to finish (30–60 seconds).

---

### Step 5 — Set up the frontend (once only)

Open a second Command Prompt window:

```cmd
cd Desktop\reviseiq\frontend
npm install
```

---

## Running the app

You need **two Command Prompt windows open simultaneously**.

**Window 1 — backend:**
```cmd
cd Desktop\reviseiq\backend
node server.js
```
You should see:
```
✅  ReviseIQ backend v2.0 running on http://localhost:3001
    API key : sk-ant-api03-...
    Origins : http://localhost:5173
```

**Window 2 — frontend:**
```cmd
cd Desktop\reviseiq\frontend
npm run dev
```
You should see:
```
  VITE v5.x.x  ready
  ➜  Local:   http://localhost:5173/
```

**Open http://localhost:5173 in your browser.**

---

## Using the app

1. Take a clear photo of your answered exam paper (JPG or PNG recommended)
2. Transfer it to your PC (WhatsApp Web, USB, email to yourself)
3. Upload it in the app
4. Paste your answer key (one per line: `1. C`, `2. Newton's Third Law`, etc.)
5. Add context if you want better resources: `CBSE Class 12 Chemistry Unit 3`
6. Click **Run forensic analysis**
7. Watch real progress events appear — this takes 15–40 seconds
8. Read your report across 4 tabs:
   - 🔬 **Autopsy** — score, error breakdown, 3-sentence diagnosis
   - 📋 **Questions** — every wrong answer explained surgically
   - 🗺 **Weakness map** — your gaps ranked by severity
   - 📅 **3-Day plan** — specific sessions with named resources

**Export your report:**
- **📋 Copy** — copies plain text to clipboard
- **⬇ Export** — saves a JSON file
- **🖨 Print** — print-optimised layout (also works as PDF via browser)

---

## Running tests

```cmd
cd Desktop\reviseiq\frontend
npm test
```

---

## Running the linter

```cmd
cd Desktop\reviseiq\frontend
npm run lint
```

---

## Stopping the app

In each window: `Ctrl+C`

## Starting again (every subsequent use)

Window 1: `cd Desktop\reviseiq\backend` → `node server.js`
Window 2: `cd Desktop\reviseiq\frontend` → `npm run dev`
Open http://localhost:5173

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `node` not recognised | Restart PC after installing Node |
| `Cannot find module 'express'` | Run `npm install` in backend folder |
| `ANTHROPIC_API_KEY is missing` | Ensure `backend/.env` exists with your key |
| `401 Unauthorized` | Wrong or expired API key — check console.anthropic.com |
| `402 Payment Required` | Add billing credit at console.anthropic.com |
| `429 Too Many Requests` | Rate limit hit — wait 15 minutes |
| App loads, analysis fails silently | Backend not running — check Window 1 |
| `Failed to fetch` / network error | Backend not running — start it first |
| White screen / blank page | Press F12 → Console — read the red error |
| PDF analysis only covers part of paper | Scanned PDF with no text layer — use JPG images of each page |
| Analysis times out | Image too large or complex — try a smaller crop |

---

## Cost estimate

| Paper | Approximate cost |
|---|---|
| 10 questions | $0.01–$0.03 |
| 30 questions | $0.04–$0.08 |
| 50 questions | $0.06–$0.12 |

$5 of credit ≈ 60–200 analyses.

---

## Known limitations (honest)

- **No persistent storage** — reports disappear on page refresh. Use Export or Print.
- **No user accounts** — local only; not shareable.
- **Scanned PDFs** — multi-page scanned PDFs (no text layer) may only partially analyse. Use JPEG images for best results.
- **OCR quality** — blurry or dark photos give worse results. Good lighting, flat paper, frame the whole page.
- **Rate limit** — 10 analyses per IP per 15 minutes. Designed for personal use.

---

## Security

- API key stored in `backend/.env` only — never sent to browser
- Exam paper sent to Anthropic's API for processing only — not stored anywhere
- `backend/.env` is in `.gitignore` — will never be committed to git
- Helmet.js sets 13 HTTP security headers on every response
- Rate limiting prevents runaway API spend
- File uploads go through multer memory storage — never written to disk
- Non-root Docker user for production deployments
