# AGENTS.md — Agent & Contributor Guidelines for Lexora

This document provides operational context, constraints, and architecture guidance for AI coding agents (and human contributors) working on the **Lexora AI Intelligence Suite**.

---

## 🚫 Non-Negotiable Constraints

1. **Stack: React 19 + Vite 8 + JavaScript + JSX**
   - **Strictly NO TypeScript or TSX migration.** Do not add TypeScript configs (`tsconfig.json`), pretend to type-check via fake `tsc` scripts, or convert `.jsx`/`.js` files to `.tsx`/`.ts`.
2. **Package Manager: npm**
   - Use `npm` consistently. Do not introduce `pnpm-lock.yaml`, `yarn.lock`, or `bun.lockb`. Use `npm ci` for reproducible installations.
3. **Preserve Application Features & Identity**
   - Preserve all four core views (`#studio`, `#ai-checker`, `#academic-refiner`, `#detector-lab`), existing UI styling, themes (Light/Dark/System), and responsive behavior.
4. **Secret Hygiene**
   - Never commit or print secrets. `.env` and `.env.*` are excluded via `.gitignore`.
   - Never add `VITE_` prefixed secret credentials intended for client-side bundle access.
5. **No Hallucinated Claims or Metrics**
   - Never invent test results, fake coverage numbers, benchmarks, or unverified claims. All reported checks must reflect actual executed commands.

---

## 🏗️ Repository Architecture

- **`src/`** — React 19 client application:
  - `src/components/`: Modular UI views and components (`WritingEditor.jsx`, `AIChecker.jsx`, `AcademicRefiner.jsx`, `DetectorResearchLab.jsx`, `WordEnhancer.jsx`, `Navbar.jsx`, `Footer.jsx`, `ResultPanel.jsx`).
  - `src/services/`: Client-side data fetching and API communication (`textProcessor.js`).
  - `src/utils/`: Pure JavaScript utilities:
    - `textRules.js`: Deterministic grammar, spelling, and tone transformation rules.
    - `researchMetrics.js`: Classification statistics (Precision, Recall, F1, Cohen's Kappa, ROC-AUC).
    - `researchDataset.js`: Curated empirical text dataset for the Research Lab.
    - `theme.js`: System, light, and dark mode coordinator.
  - `src/test/`: Vitest test suites and testing setup (`setup.js`).
- **`server/`** — Node.js service logic and Vite dev middleware:
  - `server/apiRouter.js`: Unified API router shared between local development and production.
  - `server/vitePluginGemini.js`: Vite development middleware proxying `/api/*` endpoints.
  - `server/geminiService.js`: Multi-model Gemini client (`gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.8-flash`) with LRU caching and 429 backoff.
  - `server/academicRefinerService.js`: Scholarly unslop, citation isolation, and passive voice engine.
  - `server/detectors/`: Detector adapters (`geminiDetector.js`, `stylometrics.js`, `copyleaks.js`, `gptzero.js`, `detectorManager.js`).
- **`api/`** — Vercel/serverless serverless functions routing to `server/apiRouter.js`.
- **`test-suite.js` & `test-rules.js`** — Node.js integration verification suites for detectors and rules.

---

## 🧪 Standard Verification Workflow

Before completing any task, execute the full verification suite:

```bash
# Unified check command: runs oxlint, vitest, integration suites, and vite build
npm run check
```

Or individual commands:
```bash
npm run lint          # Oxlint (must exit 0 with 0 errors/warnings)
npm test              # Vitest unit & component test suite (all pass)
npm run test:coverage # Vitest v8 coverage report
npm run test:suite    # Node integration test suites
npm run build         # Vite production build (verify zero bundle errors)
```
