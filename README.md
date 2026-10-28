<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="public/logo-light.png">
    <img src="public/logo-dark.png" alt="Lexora Logo" width="220" />
  </picture>
</p>

<h1 align="center">Lexora</h1>

<p align="center">
  <strong>The Art of Better Words.</strong><br>
  A unified, open-source AI writing suite, forensic detector, and academic humanizer.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-059669.svg?style=flat-square" alt="MIT License" /></a>
  <a href="#-testing--quality"><img src="https://img.shields.io/badge/Tests-129%20Passing-10b981.svg?style=flat-square" alt="129 Tests Passing" /></a>
  <a href="#-testing--quality"><img src="https://img.shields.io/badge/Oxlint-Clean%20(0%20errors)-38bdf8.svg?style=flat-square" alt="Oxlint Clean" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.3-2563eb.svg?style=flat-square" alt="React 19" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8.3-6366f1.svg?style=flat-square" alt="Vite 8" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-v4-06b6d4.svg?style=flat-square" alt="Tailwind CSS v4" /></a>
  <a href="#-zero-cost-ai-setup"><img src="https://img.shields.io/badge/Cloud%20AI-Zero--Cost%20Edge-f59e0b.svg?style=flat-square" alt="Zero Cost Cloud AI" /></a>
</p>

<p align="center">
  <a href="#-what-is-lexora">Overview</a> •
  <a href="#-feature-matrix">Comparison</a> •
  <a href="#-visual-tour-of-the-4-tools">Visual Tour</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-testing--quality">Testing</a>
</p>

---

## 💡 What is Lexora?

Most modern writing tools make you choose: pay expensive monthly subscriptions, send your private research to third-party servers, or jump between three different websites just to check grammar, test for AI detection, and rephrase a sentence.

**Lexora brings everything into one unified, distraction-free studio.**

It is built on a simple philosophy: **high-performance writing tools should be open, private, and free to run.**

```
┌────────────────────────────────────────────────────────────────────────┐
│                          LEXORA WRITING SUITE                          │
├───────────────────┬────────────────────┬───────────────────────────────┤
│  ✍️ Studio         │  🛡️ AI Detector     │  🎓 Academic Humanizer        │
│  Live grammar,    │  Sentence heatmap  │  Removes AI clichés, protects │
│  tone, clarity,   │  with 4-tier       │  citations, and restores      │
│  and 1-click fixes│  classification    │  natural sentence cadence     │
└───────────────────┴────────────────────┴───────────────────────────────┘
```

- **Runs 100% Offline by Default:** Instant rule-based grammar and stylometrics run right inside your browser with zero network calls and zero configuration.
- **Zero-Cost Cloud Intelligence:** Connect free-tier edge models (Cloudflare Workers AI Llama 3.1 70B & Google Gemini) without paying commercial API subscriptions.
- **Private by Design:** Your drafts never get saved to a remote database, never get logged, and never get used to train commercial models.

---

## 📊 Feature Matrix

Why teams and researchers choose Lexora over subscription products:

| Feature | Lexora | Grammarly | QuillBot | Turnitin / GPTZero |
| :--- | :---: | :---: | :---: | :---: |
| **Open Source (MIT)** | **Yes (100%)** | ❌ No | ❌ No | ❌ No |
| **Cost** | **$0 / Free Forever** | $12–$30/mo | $10–$20/mo | Enterprise Paywall |
| **Runs 100% Offline** | **Yes (Pure JS Engine)** | ❌ Cloud only | ❌ Cloud only | ❌ Cloud only |
| **Interactive Grammar Canvas** | **Yes (Inline Popovers)** | Extension only | Basic text box | ❌ No |
| **Sentence-Level AI Heatmap** | **Yes (Color-coded)** | ❌ No | ❌ No | Partial |
| **Citation Lock `[1, 2]`** | **Yes (Verbatim Restore)** | ❌ No | Corrupts formatting | ❌ No |
| **Non-Punitive Provenance** | **Yes (4-tier spectrum)** | ❌ No | ❌ No | Binary / Harsh |
| **Zero Data Retention** | **Yes (Memory only)** | ❌ Stored | ❌ Stored | ❌ Stored in database |

---

## 🎨 Visual Tour of the 4 Tools

### 1. ✍️ Focused Writing Studio
A clean, responsive workspace that combines inline proofreading speed with deep grammar analysis:
- **7 Focused Modes:** *Grammar & Spelling, Rephrase, Fluency, Shorten, Simplify, Professional Tone, Casual Tone.*
- **Inline Error Canvas:** Color-coded underlines for correctness (pink), clarity (sky blue), and punctuation (amber).
- **Floating Suggestion Cards:** Click any flagged word or phrase to see the explanation, original wording, and replace it with a single click or keyboard shortcut (`Enter`).
- **One-Click "Accept All":** Resolve every verified suggestion across your entire draft in milliseconds.
- **Word Alternatives:** Right-click or inspect any word to explore contextual synonyms grouped by register (*Professional, Casual, Stronger, Simpler*).

```
  The lead researcher have analyzed [!] the empirical data.
                     │
                     ▼
  ┌─────────────────────────────────────────────────────────┐
  │  Subject-Verb Agreement                     Dismiss     │
  │  have analyzed  ───►  [ has analyzed ↵ ]               │
  │  Singular noun "researcher" requires singular verb.     │
  └─────────────────────────────────────────────────────────┘
```

---

### 2. 🛡️ Forensic AI Detector
A multi-engine detector designed for fair, transparent analysis rather than unfair "gotcha" scores:
- **Major Neural Forensic Classifier:** Powered by Cloudflare Workers AI (**Meta Llama 3.1 70B**) to analyze stylistic entropy, burstiness, and formulaic sentence structure.
- **Built-in Local Stylometrics Engine:** Zero-latency statistical analyzer calculating sentence length variance, Zipf cadence, and vocabulary compression directly in the browser.
- **Interactive Sentence Heatmap:** Hover over any sentence to see its individual probability score:
  - 🟢 **Human Cadence:** High variance, natural rhythm, varied punctuation.
  - 🟡 **Mixed / Refined:** Hybrid structure or lightly polished text.
  - 🔴 **Uniform AI:** Low entropy, repetitive clause lengths, predictive transition density.

#### The 4-Tier Provenance Spectrum
Unlike binary detectors that label human writing as AI, Lexora categorizes text along a realistic 4-stage spectrum:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           THE PROVENANCE SPECTRUM                            │
├───────────────┬────────────────────────┬─────────────────────┬───────────────┤
│  🟢 Tier 1     │  🟡 Tier 2             │  🟠 Tier 3          │  🔴 Tier 4    │
│  Human Written│  Human + AI Refined    │  AI Draft + Edited  │  Pure AI Text │
│  Raw, natural │  Human thesis polished │  LLM draft lightly  │  Uniform, raw │
│  author voice │  for tone or clarity   │  tweaked by user    │  model output │
└───────────────┴────────────────────────┴─────────────────────┴───────────────┘
```

---

### 3. 🎓 Academic Refiner (Humanizer)
Large Language Models have predictable habits: they write in monotonous sentence lengths and constantly inject filler clichés (*"plays a pivotal role," "intricate tapestry," "delve into," "driving innovation"*).

Lexora transforms robotic AI drafts into natural, scholar-grade prose while guaranteeing **100% fact and citation safety**.

```
                               THE 5-STEP HUMANIZER PIPELINE
                               
  ┌──────────────────┐
  │  AI Draft Input  │  "Moreover, it plays a pivotal role (Smith et al., 2023)."
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ 1. Citation Lock │  Isolates citations & p-values: [[REF_1]], [[P_VAL_1]]
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ 2. Neural Rerank │  Llama 3.1 70B restructures claims with scholarly prose
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ 3. Rhythm Inject │  Alternates short statements (6 words) with deep analysis (26 words)
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ 4. Unslop Scrub  │  Strips AI buzzwords, empty adverbial bridges, and dangling clauses
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ 5. Safe Restore  │  Re-inserts citations verbatim: (Smith et al., 2023)
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  Human Output    │  "The data demonstrates this effect directly (Smith et al., 2023)."
  └──────────────────┘  [ AI Score drops from 95% ──► 12% ]
```

- **Protected Citations:** Parenthetical citations `(Jones, 2024)`, bracketed numbers `[1, 2]`, DOIs, sample sizes `(n = 450)`, and p-values `(p < 0.001)` are masked before transformation and restored verbatim.
- **Side-by-Side Review:** Compare original vs refined text side-by-side, inspect sentence diffs, or accept changes sentence-by-sentence.
- **Meaning Verification Guard:** Scans outputs to ensure negation polarity, core nouns, and numbers were never inverted during processing.

---

### 4. 🔬 Detector Research Lab
An empirical research environment for developers, researchers, and educators:
- **Pre-Loaded Benchmarking Datasets:** Test against human manuscripts, raw AI generations, and hybrid revisions.
- **Full Statistical Suite:** Calculates Precision, Recall, F1 Score, False Positive Rate (FPR), False Negative Rate (FNR), and ROC-AUC.
- **Inter-Detector Agreement:** Calculates **Cohen's Kappa ($\kappa$)** matrix across multiple detection engines to expose where detectors agree or contradict each other.
- **Interactive Threshold Exploration:** Drag decision thresholds to view real-time trade-offs between precision and recall.

---

## 🏗️ Architecture

Lexora is designed as a lightweight client-side Single Page Application backed by a zero-leak Node.js API router. All sensitive API credentials live strictly on the server and are never bundled into client assets.

```
                    ┌─────────────────────────────────────────┐
                    │          Lexora Frontend (React 19)     │
                    │   Interactive Canvas  •  Heatmap Engine │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │       Local Fast Engine (Pure JS)       │
                    │   Rule Parser  •  Stylometrics (1ms)    │
                    └────────────────────┬────────────────────┘
                                         │  (If cloud active)
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │       Server / Proxy Layer (Vite/API)   │
                    │  • In-Memory LRU Cache (200 items)      │
                    │  • Token Sanitizer & Rate-Limit Queue   │
                    │  • 2MB Stream Protection & Safe Proxy   │
                    └───────┬─────────────────────────┬───────┘
                            │                         │
                            ▼                         ▼
            ┌──────────────────────────────┐  ┌──────────────────────────────┐
            │   Cloudflare Workers AI      │  │    Google Gemini API         │
            │   Meta Llama 3.1 70B Edge    │  │    3.5 Flash / 3.8 Flash     │
            │   (Primary Zero-Cost Engine) │  │    (High-Speed Fallback)     │
            └──────────────────────────────┘  └──────────────────────────────┘
```

---

## 🚀 Quick Start

Get Lexora running on your local machine in under two minutes:

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 1. Clone the repository
```bash
git clone https://github.com/SFRREX/lexora.git
cd lexora
```

### 2. Install dependencies
```bash
npm install
```

### 3. Launch the development server
```bash
npm run dev
```

Open your browser to `http://localhost:5173`. Lexora is now live and fully functional in **Offline Mode**!

---

## ⚡ Zero-Cost AI Setup

While Lexora works offline without any configuration, connecting zero-cost cloud models unlocks the 70B neural classifier and deep humanizer:

### Step 1: Create your environment file
```bash
cp .env.example .env
```

### Step 2: Add free API credentials
Open `.env` in your text editor:

```env
# 1. Cloudflare Workers AI (10,000 free neurons every day)
# Get credentials at: https://dash.cloudflare.com/
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-70b-instruct

# 2. Google Gemini API (Generous free tier with no credit card required)
# Get a key at: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_key_here
```

Restart your dev server (`npm run dev`), and Lexora will automatically enable neural detection and academic refinement.

---

## 🧪 Testing & Quality

Lexora adheres to strict quality gates with comprehensive test coverage:

```bash
# Run unit & component tests (Vitest)
npm test

# Run tests in interactive watch mode
npm run test:watch

# Generate code coverage report
npm run test:coverage

# Run integration & AI intelligence suite
npm run test:suite

# Run lightning-fast linter (Oxlint)
npm run lint

# Build production bundle (Vite)
npm run build

# Run complete quality gate check
npm run check
```

**Quality Status:**
- ✅ **129/129 tests passing** across 15 test suites
- ✅ **0 errors, 0 warnings** reported by Oxlint on all 70 source files
- ✅ **Zero bundle bloat:** Production build completes in ~2 seconds with lazy-loaded PDF extraction

---

## 📁 Repository Structure

```text
lexora/
├── api/                     # Serverless endpoints for edge / Vercel deployment
├── e2e/                     # End-to-end Playwright tests
├── public/                  # Favicons, high-resolution logos, and SVG assets
├── server/                  # Backend intelligence layer
│   ├── detectors/           # Modular forensic detector adapters
│   │   ├── cloudflareDetector.js  # Major neural classifier (Llama 3.1 70B)
│   │   ├── geminiDetector.js      # Multi-turn neural verification
│   │   ├── localStylometrics.js   # Offline burstiness & entropy engine
│   │   └── detectorManager.js     # Unified provider orchestrator
│   ├── academicRefinerService.js  # Citation masking & academic unslop pipeline
│   ├── cloudflareAiService.js     # Edge model connector with auto-retry
│   └── apiRouter.js               # Rate limiter, cache, and request sanitizer
├── src/                     # React 19 Frontend
│   ├── components/          # Modular UI components (WritingStudio, AIChecker, Refiner, etc.)
│   ├── services/            # Frontend API client layer with fallback routing
│   ├── test/                # 15 Vitest test suites (129 unit & regression tests)
│   └── utils/               # Text heuristics, research metrics, and document extractors
├── .env.example             # Clean environment variables template
├── index.html               # Semantic HTML5 entrypoint
├── package.json             # Scripts and modern dependencies
├── vercel.json              # Zero-config serverless deployment configuration
└── vite.config.js           # Vite 8 build & testing configuration
```

---

## 🚀 Deployment

### Deploy to Vercel (One Click)
1. Fork or push this repository to your GitHub account.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Settings → Environment Variables**, add `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `GEMINI_API_KEY`.
4. Click **Deploy**. Vercel will build the frontend and serve API routes automatically.

### Deploy as a Static Site (Cloudflare Pages, Netlify, GitHub Pages)
```bash
npm run build
```
Upload the generated `dist/` directory to any static web host. Lexora's built-in offline engine will provide grammar checks, tone adjustment, and stylometric analysis right inside the client browser.

---

## 🛡️ Responsible AI & Integrity

- **Probabilistic, Not Absolute Proof:** AI detectors measure statistical regularity; they do not have omniscient knowledge. Lexora provides probability heatmaps to assist human review, not to issue definitive accusations.
- **Fairness for Non-Native Writers:** Non-native English speakers often write with consistent, formal grammar that basic commercial detectors falsely penalize. Lexora's 4-tier system and burstiness metrics are tuned to prevent unfair false positives.
- **Absolute Privacy:** User text is processed transiently in active memory. Lexora contains zero telemetry, zero analytics tracking, and zero database persistence.

---

## 📄 License & Attribution

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

If you use Lexora in your academic work or research, please cite:

```bibtex
@software{lexora2026,
  author = {Razedus Safar and Contributors},
  title = {Lexora: Open Source AI Writing Suite, Forensic Detector, and Academic Refiner},
  year = {2026},
  publisher = {GitHub},
  journal = {GitHub repository},
  howpublished = {\url{https://github.com/SFRREX/lexora}}
}
```

<p align="center">
  Crafted with care by <a href="https://github.com/SFRREX"><strong>Razedus Safar</strong></a> and contributors.
</p>
