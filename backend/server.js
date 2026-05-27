// ─────────────────────────────────────────────────────────────────────────────
// ReviseIQ Backend v2.0 — Production-hardened Express API proxy
//
// Fixes applied vs v1:
//   CRIT-1  helmet.js security headers (CSP, HSTS, X-Frame-Options, etc.)
//   CRIT-2  Rate limiting — global 100/15min + strict 10/15min on /api/analyse
//   CRIT-3  CORS origin from environment variable — not hardcoded
//   CRIT-4  AbortSignal.timeout(120_000) on all outbound fetch calls
//   CRIT-5  max_tokens raised to 10 000 — prevents JSON truncation on long papers
//   CRIT-6  Input length limits — answerKey ≤8000 chars, context ≤800 chars
//   CRIT-7  async-retry with 2 retries + exponential backoff on Anthropic 5xx/529
//   CRIT-8  PDF multi-page: pdf-parse text extraction injected as context
//   CRIT-9  Structured HTTP logging via morgan
//   MINOR   Improved health check (uptime, memory, apiKeyPresent, timestamp)
//   MINOR   express.json() limit corrected to 1mb (was irrelevant 20mb)
//   MINOR   SSE streaming: backend emits real progress events + final JSON
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();

const express  = require("express");
const cors     = require("cors");
const helmet   = require("helmet");
const morgan   = require("morgan");
const multer   = require("multer");
const rateLimit = require("express-rate-limit");
const retry    = require("async-retry");
const pdfParse = require("pdf-parse");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── 0. Startup guard — fail fast if the API key is missing ───────────────────
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("\n❌  ANTHROPIC_API_KEY is missing.");
  console.error("    Create backend/.env from .env.example and add your key.\n");
  process.exit(1);
}

// ── 1. Security headers — must be FIRST, before all other middleware ─────────
//    This sets: CSP, X-Frame-Options (deny clickjacking), X-Content-Type-Options
//    (no MIME sniffing), Strict-Transport-Security, Cross-Origin-Resource-Policy,
//    and removes X-Powered-By: Express (hides stack info from attackers).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'"], // Vite injects inline styles in dev
        imgSrc:      ["'self'", "data:", "blob:"],
        connectSrc:  ["'self'"],
        fontSrc:     ["'self'"],
        objectSrc:   ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    // HSTS: 1 year, include subdomains
    strictTransportSecurity: {
      maxAge: 31_536_000,
      includeSubDomains: true,
    },
  })
);

// ── 2. HTTP request logging ───────────────────────────────────────────────────
//    "dev" format in development: coloured, compact
//    "combined" format in production: Apache-style, machine-parseable
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── 3. CORS — origin from environment, never hardcoded ───────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (Postman, curl, mobile apps calling directly)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed.`));
    },
    methods:        ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// ── 4. Body parser — JSON only, 1 MB limit (files go through multer) ─────────
app.use(express.json({ limit: "1mb" }));

// ── 5. Global rate limit — protects all endpoints ────────────────────────────
//    Using 'draft-8' standardHeaders — the current IETF recommendation.
//    legacyHeaders: false — disables old X-RateLimit-* headers.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit:    100,
  standardHeaders: "draft-8",
  legacyHeaders:   false,
  message: { error: "Too many requests from this IP. Please wait 15 minutes." },
});
app.use(globalLimiter);

// Strict limiter for the expensive Anthropic AI endpoint
const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit:    10, // 10 analyses per IP per 15 minutes
  standardHeaders: "draft-8",
  legacyHeaders:   false,
  message: {
    error: "Analysis limit reached (10 per 15 minutes). Please wait before trying again.",
  },
});

// ── 6. File upload — memory only, never touches disk ─────────────────────────
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter(req, file, cb) {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only JPG, PNG, GIF, WEBP or PDF files are accepted."));
  },
});

// ── 7. System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are ReviseIQ, a world-class AI-powered post-exam learning intelligence engine. Your sole mission is to transform a student's answered exam paper into a precise, deeply personalized diagnostic report and targeted revision plan.

You are a forensic learning analyst: a cognitive detective who examines every wrong answer to understand WHY the student failed — and then engineers the fastest possible path back to mastery.

Produce ONLY a raw JSON object (no markdown fences, no preamble, no explanation) with this exact structure:

{
  "subject": "detected subject name",
  "examBoard": "detected exam board or Unknown",
  "totalQuestions": number,
  "score": { "obtained": number, "total": number, "percentage": number },
  "errorBreakdown": {
    "conceptualGap": number,
    "calculationError": number,
    "misreadQuestion": number,
    "partialUnderstanding": number,
    "knowledgeGap": number,
    "flagged": number
  },
  "diagnosticSummary": "3 sentences — what they understand well, dominant failure mode, single most urgent focus. Honest, direct, no comfort, no flattery.",
  "questions": [
    {
      "number": number,
      "topic": "topic / subtopic string",
      "studentAnswer": "what the student wrote, or blank if empty",
      "correctAnswer": "expected correct answer",
      "isCorrect": boolean,
      "workingDetected": "Yes | No | Partial",
      "errorType": "Conceptual Gap | Calculation Error | Misread Question | Partial Understanding | Knowledge Gap | Flagged | Correct",
      "whyItWentWrong": "2-4 sentences of surgical clinical analysis. Do NOT say 'you were wrong because'. Name exactly which cognitive step failed, which assumption broke, which mental model misfired.",
      "whatMasteryLooksLike": "1-3 sentences on the correct mental model or fact anchor",
      "microExercise": "One concrete 30-minute practice action. Name the exercise type, quantity, and self-check method. Never vague."
    }
  ],
  "weaknessMap": {
    "critical": [ { "area": "string", "subConcepts": [ { "name": "string", "affectsQuestions": [number] } ] } ],
    "moderate": [ { "area": "string", "subConcepts": [ { "name": "string", "affectsQuestions": [number] } ] } ],
    "execution": [ { "area": "string", "subConcepts": [ { "name": "string", "affectsQuestions": [number] } ] } ],
    "strongZones": ["string"],
    "narrativeSummary": "one paragraph describing the overall learning profile pattern and whether errors are clustered or scattered"
  },
  "revisionPlan": {
    "day1": {
      "theme": "Conceptual Repair",
      "priority": "string — the 1-2 most critical gaps",
      "timeEstimate": "N hours",
      "sessions": [
        {
          "duration": "N min",
          "topic": "string",
          "goal": "string",
          "resource": "Specific named resource — YouTube channel + video title, Khan Academy section path, NCERT chapter number. NEVER 'Google it' or 'your textbook'.",
          "activity": "Precisely described practice task with quantity and method",
          "selfCheck": "How they know they have genuinely understood it"
        }
      ],
      "checkpoints": ["string"]
    },
    "day2": {
      "theme": "Knowledge Filling + Execution Training",
      "priority": "string",
      "timeEstimate": "N hours",
      "sessions": [],
      "checkpoints": []
    },
    "day3": {
      "theme": "Consolidation + Mock Simulation",
      "priority": "string",
      "timeEstimate": "N hours",
      "sessions": [],
      "checkpoints": []
    }
  }
}

RULES — violating any of these is an error:
1. Classify EVERY incorrect answer. Never skip errorType.
2. Never fabricate questions not visible in the image or text.
3. Low OCR confidence → errorType: "Flagged".
4. diagnosticSummary must be brutally honest — no empty comfort.
5. Resources must be specific. If you cannot name a specific resource, say "Search YouTube for: [exact search term]".
6. Return ONLY the JSON. Nothing before or after it.`;

// ── 8. SSE helper ─────────────────────────────────────────────────────────────
function sseEvent(res, eventName, data) {
  res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ── 9. Main analysis endpoint ─────────────────────────────────────────────────
app.post(
  "/api/analyse",
  analysisLimiter,                   // strict 10/15min limit on this route
  upload.single("examFile"),         // parse multipart file
  async (req, res) => {
    // Set SSE headers immediately — the client expects a stream
    res.setHeader("Content-Type",  "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection",    "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx proxy buffering

    const send  = (name, data) => sseEvent(res, name, data);
    const close = ()           => res.end();

    try {
      // ── Validate file ────────────────────────────────────────────────────
      if (!req.file) {
        send("error", { message: "No exam file was uploaded." });
        return close();
      }

      // ── Sanitise text inputs ─────────────────────────────────────────────
      const answerKey = (req.body.answerKey || "").slice(0, 8_000).trim();
      const context   = (req.body.context   || "").slice(0,   800).trim();

      send("status", { stage: 0, message: "Received file — beginning extraction…" });

      // ── Build Claude message content ─────────────────────────────────────
      const base64    = req.file.buffer.toString("base64");
      const mediaType = req.file.mimetype;
      let   userContent;

      if (mediaType === "application/pdf") {
        // PDF: extract text layer with pdf-parse, pass alongside the document.
        // This handles multi-page PDFs — pdf-parse reads all pages.
        // For scanned PDFs (no text layer), extractedText will be empty and
        // Claude falls back to the document blob alone.
        let extractedText = "";
        try {
          const pdfData  = await pdfParse(req.file.buffer);
          extractedText  = (pdfData.text || "").slice(0, 12_000);
        } catch (e) {
          console.warn("pdf-parse failed — falling back to vision only:", e.message);
        }

        userContent = [
          {
            type:   "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          },
          {
            type: "text",
            text: [
              "Please analyse this exam paper PDF.",
              extractedText
                ? `\n\nExtracted text from all PDF pages (use alongside visual):\n${extractedText}`
                : "\n\n(This appears to be a scanned PDF with no text layer — analyse visually.)",
              answerKey ? `\n\nAnswer key:\n${answerKey}` : "\n\nNo answer key provided — infer from context, flag uncertain items.",
              context   ? `\n\nAdditional context: ${context}` : "",
            ].join(""),
          },
        ];
      } else {
        // Image (JPEG, PNG, WEBP, GIF)
        userContent = [
          {
            type:   "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: [
              "Please analyse this exam paper image.",
              answerKey ? `\n\nAnswer key:\n${answerKey}` : "\n\nNo answer key provided — infer from context, flag uncertain items.",
              context   ? `\n\nAdditional context: ${context}` : "",
            ].join(""),
          },
        ];
      }

      send("status", { stage: 1, message: "Classifying errors for each question…" });

      // ── Call Anthropic API with retry + streaming ────────────────────────
      let fullText = "";

      await retry(
        async (bail) => {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            signal: AbortSignal.timeout(120_000), // 2-minute hard ceiling
            headers: {
              "Content-Type":     "application/json",
              "x-api-key":        process.env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model:      "claude-sonnet-4-20250514",
              max_tokens: 10_000,  // raised from 6000 — prevents JSON truncation
              stream:     true,    // real SSE streaming from Anthropic
              system:     SYSTEM_PROMPT,
              messages:   [{ role: "user", content: userContent }],
            }),
          });

          // 4xx errors are the client's fault — bail immediately, no retry
          if (response.status >= 400 && response.status < 500) {
            const errBody = await response.json().catch(() => ({}));
            bail(new Error(errBody?.error?.message || `Anthropic API error ${response.status}`));
            return;
          }

          // 5xx / 529 Overloaded — retry with backoff
          if (!response.ok) {
            throw new Error(`Anthropic API ${response.status} — will retry`);
          }

          // ── Stream SSE events from Anthropic → accumulate text ───────────
          const reader  = response.body.getReader();
          const decoder = new TextDecoder();
          let   buffer  = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE lines from the buffer
            const lines = buffer.split("\n");
            buffer = lines.pop(); // keep incomplete last line in buffer

            let currentEvent = "";
            for (const line of lines) {
              if (line.startsWith("event: ")) {
                currentEvent = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                const raw = line.slice(6).trim();
                if (raw === "[DONE]") continue;
                try {
                  const evt = JSON.parse(raw);
                  if (
                    currentEvent === "content_block_delta" &&
                    evt.delta?.type === "text_delta"
                  ) {
                    fullText += evt.delta.text;
                  }
                } catch { /* malformed chunk — skip */ }
              }
            }
          }
        },
        {
          retries:    2,
          minTimeout: 500,
          maxTimeout: 3_000,
          onRetry(err, attempt) {
            console.warn(`[retry ${attempt}] ${err.message}`);
            send("status", { stage: 1, message: `Retrying (attempt ${attempt + 1})…` });
          },
        }
      );

      send("status", { stage: 2, message: "Building weakness concept map…" });

      // ── Parse JSON from accumulated text ─────────────────────────────────
      // Strip markdown fences if the model emits them despite instructions
      const clean = fullText
        .replace(/^```json\s*/i, "")
        .replace(/\s*```\s*$/i,  "")
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch (parseErr) {
        console.error("JSON parse failed. First 500 chars:\n", clean.slice(0, 500));
        send("error", {
          message: "The model returned malformed output. Please try again with a clearer image.",
        });
        return close();
      }

      send("status", { stage: 3, message: "Generating 3-day revision plan…" });
      send("result", parsed);
      close();

    } catch (err) {
      const isTimeout = err.name === "TimeoutError" || err.name === "AbortError";
      const message   = isTimeout
        ? "Analysis timed out after 2 minutes. Try a smaller or clearer image."
        : err.message || "Unexpected server error. Please try again.";

      console.error("[/api/analyse error]", err);
      send("error", { message });
      close();
    }
  }
);

// ── 10. Health check ──────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status:        "ok",
    uptime:        `${Math.round(process.uptime())}s`,
    memory: {
      heapUsed:  `${Math.round(mem.heapUsed  / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
      rss:       `${Math.round(mem.rss       / 1024 / 1024)}MB`,
    },
    model:         "claude-sonnet-4-20250514",
    apiKeyPresent: Boolean(process.env.ANTHROPIC_API_KEY),
    allowedOrigins: ALLOWED_ORIGINS,
    timestamp:     new Date().toISOString(),
  });
});

// ── 11. Global error handler ──────────────────────────────────────────────────
// Catches errors thrown by middleware (e.g. multer file type rejection, CORS error)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[global error handler]", err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error." });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  ReviseIQ backend v2.0 running on http://localhost:${PORT}`);
  console.log(`    API key : ${process.env.ANTHROPIC_API_KEY.slice(0, 14)}...`);
  console.log(`    Origins : ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`    Node    : ${process.version}\n`);
});
