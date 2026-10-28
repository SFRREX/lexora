---
description: Operational guardrails, stack constraints, and quality standards for AI coding agents maintaining Lexora.
trigger: always_on
---

# Agent Reliability & Guardrails for Lexora

These rules prevent recurring failure modes when AI coding agents maintain the Lexora Intelligence Suite.

---

## 1. Stack & Architecture Guardrails
- **JavaScript + JSX only**: Never introduce TypeScript files (`.ts`, `.tsx`), `tsconfig.json`, or fake typecheck scripts.
- **Vite 8 + React 19**: Adhere to React purity rules. Do not mutate state or props. Never call impure functions (e.g. `Date.now()`, `Math.random()`) during render.
- **npm only**: Always use `npm` (`npm ci` or `npm run check`). Never create `yarn.lock`, `pnpm-lock.yaml`, or `bun.lockb`.
- **Preserve View Architecture**: The application has 4 views:
  1. `#studio` (`WritingEditor.jsx`)
  2. `#ai-checker` (`AIChecker.jsx`)
  3. `#academic-refiner` (`AcademicRefiner.jsx`)
  4. `#detector-lab` (`DetectorResearchLab.jsx`)
  Never remove or combine these views without explicit user instruction.

---

## 2. Cross-View State Handoffs
- When handing text from one view to another (e.g., Academic Refiner to AI Checker, or Studio to Refiner):
  - Store text in `sessionStorage` with standard keys:
    - `lexora_checker_text` for AI Checker
    - `lexora_academic_draft` for Academic Refiner
    - `lexora_studio_draft` for Writing Studio
  - Listen for `focus` and `hashchange` events to hydrate drafts when navigating.
  - When text changes in a view, flag previously generated results as outdated.

---

## 3. Honest Verification & Metrics
- **Never fabricate test results, benchmarks, or coverage percentages.** All reported results must originate from executed shell commands.
- **Never manipulate detector scores.** If text scores 95% AI, report it truthfully. Do not apply arbitrary score reductions to create the false illusion of success.
- **No silent error conversions**: Never convert a 500/timeout error into 0% or 100% AI. Display the error transparently.

---

## 4. UI/UX & Accessibility Standards
- Ensure all interactive elements (`<button>`, interactive `<mark>`, `<input>`, card buttons) are operable via keyboard (`tabIndex={0}`, `Enter`/`Space` handlers).
- Adhere to WCAG 2.2 AA contrast standards in both Light and Dark themes.
- Touch target minimum: At least 24×24px, preferably 44×44px for primary interactive targets.
- Include explicit `aria-label`, `role="button"`, and visible focus rings (`focus-visible:ring-2`).

---

## 5. Security & Secret Hygiene
- Never commit `.env` or print secret keys.
- Never prefix server-only API keys with `VITE_`.
- Avoid logging sensitive user text in server or production console logs.
- Sanitize and validate all document uploads (PDF, TXT, MD) before processing.
