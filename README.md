<p align="center">
  <img src="public/logo.png" alt="Lexora AI Intelligence Suite" width="220" />
</p>

<h1 align="center">Lexora Intelligence Suite</h1>

<p align="center">
  <strong>The Art of Better Words.</strong><br>
  A production-grade AI writing enhancement, neural text detection, academic unslop, and empirical detector research suite built with React 19, Vite 8, and Tailwind CSS v4.
</p>

---

## 🌟 Highlights & Capabilities

Lexora is designed as a modular, research-informed suite with 4 dedicated workspace views and complete system-aware light & dark themes.

### 1. Writing Studio (`#studio`)
- **7 AI Writing Tools:**
  - *Grammar & Spelling Correction:* Fixes orthographic, syntactical, and punctuation errors.
  - *Sentence Rephrasing:* Generates natural, flowing variations of your thoughts.
  - *Fluency Improvement:* Smooths awkward phrasing and improves rhythm.
  - *Shorten Text:* Eliminates wordiness and tightens structure without losing meaning.
  - *Simplify Text:* Replaces dense jargon with plain, direct vocabulary.
  - *Professional Tone:* Transforms informal notes into polished business and workplace correspondence.
  - *Casual Tone:* Relaxes rigid phrasing into friendly, conversational communication.
- **Word Enhancer:** Real-time contextual synonym lookup categorized by tone (*Professional*, *Casual*, *Stronger*, *Simpler*).
- **Interactive Diff & Output Modes:** Live visual diff highlighting inserted and deleted words, side-by-side comparison, and one-click clipboard copying.

### 2. AI Checker (`#ai-checker`)
- **100% Free Default Detectors:**
  - **Lexora Neural AI Detector (Free):** Powered by Google Gemini with multi-model fallback (`gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.8-flash`), performing deep linguistic perplexity evaluation, sentence cadence analysis, and generative trope detection at zero subscription cost.
  - **Lexora Local Stylometrics Engine (Free & Offline):** Pure JavaScript statistical NLP analyzer that evaluates sentence length variance (burstiness index), type-token lexical diversity (TTR), and n-gram uniformity with zero API keys required.
- **Commercial Provider Adapters (Optional):** Supports [GPTZero](https://docs.gptzero.me/) and [Copyleaks](https://docs.copyleaks.com/) for multi-provider benchmarking when credentials are provided.
- **Sentence-Level Interactive Heatmap:** Color-coded sentence breakdown (*Human*, *Mixed*, *AI*) with hover inspection displaying per-sentence perplexity and classification.
- **Multi-Provider Cross-Verification:** Real-time matrix and automated inter-detector agreement categorization (*Providers agree*, *Partially disagree*, *Strongly disagree*).
- **Ethical & Scientific Disclosures:** Clear documentation of statistical limitations, word-count sensitivity (&ge;250 words recommended), and non-native English false-positive risks.

### 3. Academic Refiner (`#academic-refiner`)
- **Scholarly Clarity & Rigor:** Refines drafts according to 4 editing goals: *Academic Writing*, *Natural Writing*, *Grammar & Clarity*, and *Concise Writing*.
- **Editing Intensities:** *Conservative* (preserves exact sentence structures; fixes syntax errors only) and *Balanced* (elevates cadence and strips stock tropes).
- **Nature-Standard Unslop Engine:** Strips repetitive generative AI clichés (*"delve into"*, *"intricate tapestry"*, *"pivotal role"*, *"testament to"*, *"underscores the importance"*, *"sheds light on"*, *"groundbreaking"*) based on academic editorial guidelines.
- **Citation & Factual Safeguards:** Guarantees 100% preservation of bracketed citations `[1, 2]`, author-year citations `(Smith et al., 2023)`, DOIs, empirical values, and statistical notations.
- **Strict Decoupling:** Strictly decoupled from detector scoring; never serves as an adversarial evasion loop.

### 4. Detector Research Lab (`#detector-lab`)
- **Curated Benchmark Datasets:** Test corpus across verified Human-written (pre-LLM corpus), AI-generated (Gemini, GPT-4, Claude), and Mixed collaborative texts.
- **Empirical Evaluation Metrics:** Computes Precision (PPV), Recall (Sensitivity), Specificity (TNR), F1 Score, False Positive Rate (FPR), False Negative Rate (FNR), ROC-AUC, and Cohen's Kappa.
- **Controlled Editing Robustness Tests:** Benchmarks how detector output shifts when documents undergo legitimate scholarly revisions.
- **Peer-Reviewed Literature Integration:** Summarizes foundational literature on detector limitations:
  1. *Tufts, Zhao, & Li (2025)*, Findings of NAACL.
  2. *Schneider et al. (2025)*, Cambridge University Press (*Data & Policy*).
  3. *Erol et al. (2025)*, Acta Neurochirurgica (*Springer*).
  4. *OpenAI (2023)*, AI Classifier Discontinuation Notice.

---

## 🎨 Theme & Accessibility Design System

- **Complete Light & Dark Themes:** Seamless dark palette built on warm stone neutrals (`#0c0a09`, `#1c1917`, `#292524`) paired with rich emerald/teal accents.
- **System Preference Sync & Anti-FOUT:** Inline head script synchronously evaluates user preference and system media query before render, preventing flash of unstyled theme.
- **WCAG 2.2 AA Compliance:** High contrast text (exceeding 4.5:1 ratio for normal text and 3:1 for large text), visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-teal-500`), and accessible ARIA attributes.
- **Responsive Layout:** Optimized across mobile (320px+), tablet, laptop, and desktop viewports.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** Pure React 19 + JSX (zero TypeScript compilation overhead), Vite 8, Tailwind CSS v4, Lucide React, Framer Motion.
- **Backend API Proxy:** Vite dev/preview server middleware (`server/vitePluginGemini.js`), keeping all external provider API keys strictly server-side.
- **Deterministic Offline Fallbacks:** Fast local regex and dictionary rules (`src/utils/textRules.js`) ensure the application works even when offline or disconnected.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/SFRREX/lexora.git
cd lexora

# Install dependencies
npm install
```

### Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Google Gemini API key:

```env
# Google Gemini API Key (Free key from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: GPTZero and Copyleaks credentials
GPTZERO_API_KEY=your_gptzero_api_key_here
COPYLEAKS_EMAIL=your_copyleaks_email_here
COPYLEAKS_API_KEY=your_copyleaks_api_key_here
```

*(Note: If no API key is provided, Lexora automatically runs in offline mode using its built-in local rules engine and local stylometrics detector.)*

### Running Locally

```bash
# Start Vite development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🧪 Verification & Automated Testing

Lexora includes automated test suites covering adapters, statistical metrics, unslop patterns, citation protection, and local rules:

```bash
# Run all unit and integration test suites
npm test

# Run code linter
npm run lint

# Build production bundle
npm run build
```

---

## 🔒 Security & Privacy

- **No Client-Side Secrets:** API keys are never exposed in frontend bundles or client network requests.
- **Safe Environment Handling:** `.env` is excluded in `.gitignore`. Only `.env.example` with safe placeholder keys is version-controlled.
- **Zero Data Logging:** User inputs are processed in-memory during active sessions and never persisted to external databases.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

