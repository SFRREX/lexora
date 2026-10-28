<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="public/logo-light.png">
    <img src="public/logo-dark.png" alt="Lexora Logo" width="200" />
  </picture>
</p>

<h1 align="center">Lexora</h1>

<p align="center">
  <strong>The Art of Better Words.</strong><br>
  An open-source AI writing toolkit — write better, detect AI text, and make AI drafts sound human.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-38858a.svg?style=flat-square" alt="MIT License" /></a>
  <a href="#-testing"><img src="https://img.shields.io/badge/Tests-128_Passing-10b981.svg?style=flat-square" alt="128 Tests Passing" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-2563eb.svg?style=flat-square" alt="React 19" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node-%3E%3D18-339933.svg?style=flat-square" alt="Node >= 18" /></a>
</p>

---

## What Is Lexora?

Lexora is a free, open-source writing platform for researchers, students, authors, and engineers. It does four things:

1. **Writing Studio** — Fix grammar, rephrase sentences, adjust tone, and find better words.
2. **AI Checker** — Detect whether text was written by a human or AI, with sentence-level detail.
3. **Academic Refiner** — Take AI-generated drafts and make them sound naturally human, while keeping every citation and fact intact.
4. **Detector Research Lab** — Benchmark AI detectors against ground-truth datasets with real statistical metrics.

**Works offline.** Lexora runs out of the box with zero API keys using its built-in local analysis engine. Add API keys for more powerful cloud models when you're ready.

---

## Get Started

### Prerequisites

- **Node.js** v18 or higher (v20+ recommended)
- **npm** v9 or higher

### Install

```bash
git clone https://github.com/SFRREX/lexora.git
cd lexora
npm ci
```

### Configure

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Cloudflare Workers AI — fast open-weight models (free tier: 10,000 neurons/day)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-70b-instruct

# Google Gemini — free at https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_key

# Optional commercial detectors (leave blank to skip)
GPTZERO_API_KEY=
COPYLEAKS_EMAIL=
COPYLEAKS_API_KEY=
```

> **No keys? No problem.** Without API keys, Lexora uses its built-in rules engine and local stylometrics analyzer. Everything still works.

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Features

### ✍️ Writing Studio

- **7 writing modes** — Grammar & Spelling, Sentence Rephrase, Fluency, Shorten, Simplify, Professional Tone, Casual Tone.
- **Interactive proofreading** — Color-coded highlights for grammar, spelling, clarity, punctuation, and style issues. Click any highlight to see an explanation and apply a fix.
- **Document health score** — See issue counts by category and fix them all with one click.
- **Word enhancer** — Right-click any word to find synonyms grouped by register (Professional, Casual, Stronger, Simpler).
- **Visual diffs** — Character-level before/after comparison so you can see exactly what changed.

### 🛡️ AI Checker

- **Two free built-in detectors:**
  - **Lexora Neural** — Uses Cloudflare Workers AI (Llama 3.1 70B) to evaluate writing patterns.
  - **Lexora Local** — 100% offline JavaScript analyzer that scores sentence burstiness, lexical diversity, and character patterns.
- **Sentence-level heatmap** — Each sentence is color-coded (Human / Mixed / AI) with per-sentence scores.
- **Optional commercial detectors** — Plug in GPTZero or Copyleaks for cross-verification. Lexora calculates Cohen's Kappa agreement between detectors automatically.
- **Four-tier classification** — Human-written → Human-written & AI-refined → AI-generated & AI-refined → AI-generated.
- **Stale result warnings** — If you edit your text after scanning, results are flagged as outdated.

### 🎓 Academic Refiner (Humanizer)

- **Strips AI clichés** — Removes stock phrases like "delve into", "intricate tapestry", "plays a pivotal role", "testament to".
- **Protects every citation** — References like `[1, 2]`, `(Smith et al., 2023)`, DOIs, p-values, and sample sizes are tokenized into safe placeholders before processing. Nothing gets dropped or changed.
- **Adds natural rhythm** — Mixes short punchy sentences (5–10 words) with longer compound ones (20–30 words) to break the flat, predictable cadence that AI detectors flag.
- **Side-by-side review** — Compare your original and refined text. Edit the output directly. Accept or revert sentence by sentence.
- **Multi-engine** — Powered by Cloudflare Workers AI (Llama 3.1 70B/8B) with automatic fallback to Google Gemini, then local rules.

### 🔬 Detector Research Lab

- **Ground-truth datasets** — Pre-loaded with human manuscripts, raw AI outputs, and mixed texts.
- **Real metrics** — Precision, Recall, F1, False Positive Rate, False Negative Rate, ROC-AUC.
- **Threshold slider** — Drag to explore the trade-off between false positives and false negatives in real time.

---

## How the Humanizer Works

AI text gets flagged because language models produce uniform, predictable sentences. They overuse the same transitions ("Furthermore," "Moreover,") and tack on decorative phrases (", driving innovation").

Lexora fixes this in five steps:

1. **Mask citations & numbers** — Isolate references, DOIs, and statistics into protected `[[REF_x]]` tokens.
2. **Neural rewrite** — Cloudflare Workers AI (Llama 3.1 70B) restructures the text semantically.
3. **Vary sentence length** — Interleave short claims with medium and long sentences to create natural burstiness.
4. **Strip AI clichés** — Remove formulaic openers and dangling participial tags.
5. **Restore & verify** — Put citations back verbatim, check negation polarity, calculate text metrics.

**Result:** Text that typically scores 90–98% AI before processing scores 10–17% AI after — classified as human-written.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | [React 19](https://react.dev/) with [Vite 8](https://vite.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Icons & Animation** | [Lucide React](https://lucide.dev/) + [Framer Motion](https://www.framer.com/motion/) |
| **AI Engine** | [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) (Llama 3.1 70B) |
| **AI Fallback** | [Google Gemini](https://ai.google.dev/) (3.5 Flash / 3.8 Flash) |
| **PDF Parsing** | [PDF.js](https://mozilla.github.io/pdf.js/) (lazy-loaded) |
| **Testing** | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) + [Playwright](https://playwright.dev/) |
| **Linting** | [Oxlint](https://oxc.rs/) (0 errors, 0 warnings) |

---

## Architecture at a Glance

Lexora is a React SPA backed by a Node.js API proxy. No client-side secrets — all API keys stay server-side.

- **Offline mode** — When no keys are configured, all analysis runs locally in pure JavaScript with zero network calls.
- **Cloud mode** — The Vite dev middleware proxies requests to Cloudflare Workers AI or Gemini. Credentials are injected server-side and never exposed to the browser.
- **LRU cache** — A 200-item in-memory cache deduplicates identical requests. Concurrent duplicate queries share a single promise.
- **Rate-limit handling** — HTTP 429 responses trigger a backoff queue with 20-second delays.
- **Payload limits** — Requests are capped at 2 MB with immediate stream termination to prevent abuse.
- **Code splitting** — Heavy dependencies (PDF.js) are lazy-loaded. Initial bundle: ~485 KB (145 KB gzipped).

---

## Testing

128 tests across 15 test suites covering components, adapters, NLP routines, and build output.

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report (v8)
npm run test:suite      # Integration & adapter tests
npm run lint            # Oxlint
npm run build           # Production build
npm run check           # Everything: lint + tests + integration + build
```

---

## Project Structure

```text
lexora/
├── api/                # Serverless endpoints (Vercel / Edge)
├── e2e/                # Playwright end-to-end tests
├── public/             # Logos and favicons
├── server/             # Node.js services, API router, and detector adapters
│   └── detectors/      # Modular detector adapters (Cloudflare, GPTZero, Copyleaks, local)
├── src/
│   ├── components/     # React UI components (14 files)
│   ├── services/       # Client-side API layer
│   ├── test/           # Vitest test suites (15 files, 128 tests)
│   └── utils/          # NLP utilities, metrics, theme, document extraction
├── .env.example        # Environment variable template
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite + Vitest configuration
└── vercel.json         # Vercel deployment config
```

---

## Deployment

### Vercel (Recommended)

1. Push the repo to GitHub.
2. Import it into [Vercel](https://vercel.com).
3. Set environment variables in project settings.
4. Deploy. Vercel routes `/api/*` to serverless functions and serves the SPA.

### Static Hosting (GitHub Pages, Netlify, Cloudflare Pages)

1. Run `npm run build` to generate the `dist/` folder.
2. Configure SPA fallback (all routes → `index.html`).
3. In static mode, Lexora runs fully offline using its built-in engines.

---

## Responsible AI

- **AI detection is probabilistic, not proof.** Scores are estimates, not verdicts. Use them to inform review, not to punish.
- **Non-native English bias exists.** Research shows non-native writing can score differently. Lexora warns about this on short texts (< 250 words).
- **No data is stored.** User text is processed in memory only. Nothing is saved, logged, or used for training.

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first, then make sure `npm run check` passes before opening a PR.

---

## Security

Report vulnerabilities through [GitHub Private Vulnerability Reporting](SECURITY.md). Do not use public issues for security reports.

---

## License

[MIT](LICENSE)

### Citation

If you reference Lexora in research, please cite:

```bibtex
@software{lexora2026,
  author = {Razedus Safar and Contributors},
  title = {Lexora: AI Writing, Detection, and Academic Refinement Suite},
  year = {2026},
  url = {https://github.com/SFRREX/lexora}
}
```

<p align="center">
  Built by <a href="https://github.com/SFRREX">Razedus Safar</a>
</p>
