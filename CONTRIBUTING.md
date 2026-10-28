# Contributing to Lexora

Thank you for your interest in contributing to the **Lexora AI Intelligence Suite**. We welcome bug reports, improvements, documentation updates, and new features that align with our mission of transparent, research-grounded, and ethical language tooling.

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **Git**

### Getting Started

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/lexora.git
cd lexora

# 2. Install dependencies (clean reproducible install)
npm ci

# 3. Configure local environment
cp .env.example .env

# 4. Start the local Vite development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

> **Offline Note:** You do not need any API keys to develop or test Lexora. The application automatically operates using its built-in local deterministic rules engine and offline stylometrics NLP analyzer.

---

## 📜 Coding Conventions & Architectural Guidelines

### 1. Technology Stack: React 19 + Vite + JavaScript + JSX
- **Strict JavaScript only:** Do not add TypeScript (`.ts`, `.tsx`) files or pretend to type-check this codebase.
- Use idiomatic JavaScript (ES2022+) with standard JSX syntax.

### 2. React Best Practices
- Adhere strictly to the [React Rules of Hooks](https://react.dev/reference/rules).
- Keep state local to the component that needs it. Avoid unnecessary prop-drilling or premature global state.
- Ensure all list items use stable, unique keys (avoid raw array indices when content can change).
- Manage side effects and event subscriptions cleanly: always return cleanup functions from `useEffect`.

### 3. Styling & Accessibility (a11y)
- We use **Tailwind CSS v4** design tokens and custom utility classes.
- Ensure all interactive elements have accessible names (`aria-label`, visible text, or associated `<label>`).
- Test contrast ratios across both Light and Dark themes to maintain WCAG 2.2 AA conformance.
- Ensure keyboard navigability (focus rings, Enter/Space activation, Escape key dismissals on modals/menus).

### 4. Deterministic Offline Fallbacks
- Every cloud-dependent intelligence feature must have a graceful, transparent fallback when API keys are absent or rate limits are reached.
- Cloudflare Workers AI (`llama-3.3-70b-instruct`, `llama-3.1-8b-instruct`, `qwen2.5-7b-instruct`) and Google Gemini automatically fallback to local deterministic rules when credentials are unconfigured or unavailable.
- Never fail silently or crash the UI when an external service is unreachable.

### 5. Meaning & Fact Preservation Guardrails
- Refinements and rewrites must never fabricate, alter, or drop numerical statistics, p-values, percentages, citations, or technical terminology.
- All refiner transforms must validate outputs with `validateMeaningAndFacts` and verify negation polarity integrity to prevent semantic hallucinations.
- Never implement detector-evasion loops or make claims of 100% human score / Turnitin bypass.

---

## 🧪 Testing & Quality Verification

Before submitting any code, all automated checks must pass cleanly:

```bash
# 1. Run Oxlint (0 errors, 0 warnings required)
npm run lint

# 2. Run unit & component tests (Vitest)
npm test

# 3. Check code coverage
npm run test:coverage

# 4. Run integration & rule test suites
npm run test:suite

# 5. Verify production build output
npm run build

# 6. Or run the combined quality gate:
npm run check
```

---

## 📬 Submitting a Pull Request

1. Create a focused branch for your changes:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. Commit your changes with clear, descriptive commit messages.
3. Verify that your branch introduces no regressions by running `npm run check`.
4. Push your branch to your fork and open a Pull Request against `main`.
5. Provide a clear summary in your PR description explaining the problem, the solution, and verification steps.
