# QuillBot-Style Grammar Studio & Academic Humanizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul Lexora's Grammar Studio into an interactive QuillBot/Grammarly-grade editor with in-situ color-coded squiggly underlines, anchored popovers, and a health inspector sidebar, while embedding the open-source Academic Humanizer pipeline (citation shielding, contraction expansion, transitions, and intensity-controlled synonym replacement) into the Academic Refiner.

**Architecture:** A mirrored backdrop-highlight canvas synchronizes character-accurate squiggly underlines with a transparent foreground textarea. An anchored React popover enables one-click suggestion acceptance with keyboard shortcuts, synchronized with a right-hand Document Health inspector. The Academic Refiner integrates a multi-stage humanization pipeline isolating citations before performing contraction expansion, AI-unslop, transition insertion, and intensity-scaled synonym upgrades.

**Tech Stack:** React 19, Vite 8, Vanilla CSS / Tailwind utilities, Google GenAI SDK (`@google/genai`), Vitest v8, Oxlint.

**Spec:** [`docs/superpowers/specs/2026-10-28-quillbot-grammar-and-academic-humanizer-design.md`](file:///c:/Users/Razedus%20Safar/Desktop/Projects/Lexora/docs/superpowers/specs/2026-10-28-quillbot-grammar-and-academic-humanizer-design.md)

## Global Constraints
- **Stack:** React 19 + Vite 8 + JavaScript (JSX). Strictly NO TypeScript (`tsconfig.json`), fake tsc scripts, or `.tsx`/`.ts` migration.
- **Package Manager:** `npm`.
- **Preserve Application Views:** Retain all four views (`#studio`, `#ai-checker`, `#academic-refiner`, `#detector-lab`) and existing light/dark mode support.
- **Zero Secret Exposure:** Never commit or print secrets.
- **Offline / Local Fallback:** When Gemini API is unavailable or unconfigured, the local deterministic rule engine must power underlines, popovers, and humanization.
- **Standard Verification Workflow:** `npm run check` (runs oxlint, vitest, integration test suites, and vite build) must exit 0.

## Review Focus
- **Fast typing without layout shift:** Backdrop text overlay must exactly match textarea padding, font size, line-height, and scroll offset.
- **Reverse index substitution:** When clicking "Accept All", edits must be applied in descending start index order (`b.startIndex - a.startIndex`) so earlier offsets remain valid.
- **Citation Preservation:** Citations formatted like `(Smith et al., 2023, pp. 12-14)` must never be modified by contractions, unslop, or synonym replacement.
- **Keyboard navigation:** Pressing `Enter` on an active popover applies the suggestion; `Esc` dismisses it without applying.
- **No overlapping spans:** Span sanitizer must ensure no overlapping character intervals are highlighted or substituted.

---

### Task 1: Backend Grammar Analysis & Local Rules Engine Enhancement

**Files:**
- Modify: `server/geminiService.js:315-385`
- Modify: `src/utils/textRules.js:180-260`
- Modify: `server/apiRouter.js:260-295`
- Test: `src/test/grammarSpans.test.js`

**Interfaces:**
- Consumes: Raw text string
- Produces: `{ corrections: Array<{ original, replacement, explanation, type: 'grammar'|'spelling'|'punctuation'|'clarity', startIndex, endIndex }>, count: number, source: 'gemini'|'local', healthScore: number }`

- [ ] **Step 1: Write unit tests for grammar span detection and categorization**
Create `src/test/grammarSpans.test.js` verifying that subject-verb agreement (`they was` -> `they were`), homophones (`their are` -> `there are`), redundant phrases (`in order to` -> `to`), and missing commas are caught with exact `startIndex` and `endIndex`.

- [ ] **Step 2: Run test to verify initial failures**
Run: `npx vitest run src/test/grammarSpans.test.js`
Expected: FAIL on newly asserted rule patterns.

- [ ] **Step 3: Implement enhanced local rules in `src/utils/textRules.js` and prompt updates in `server/geminiService.js`**
Expand `extractRuleBasedGrammarSpans` in `src/utils/textRules.js` with comprehensive patterns for:
- Subject-verb agreement (e.g. `the researcher have` -> `the researcher has`)
- Common homophones (e.g. `its a` -> `it is a`, `effect` vs `affect`)
- Redundant connectors (`due to the fact that` -> `because`, `in order to` -> `to`)
- Punctuation spacing (e.g. `word ,` -> `word,`)
Ensure spans are sorted and non-overlapping.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/grammarSpans.test.js`
Expected: PASS

- [ ] **Step 5: Run full test suite check**
Run: `npm run test:suite`
Expected: All suites exit 0.

---

### Task 2: Interactive Canvas Component with Squiggly Underlines & Anchored Popover

**Files:**
- Create: `src/components/InteractiveGrammarCanvas.jsx`
- Create: `src/components/SuggestionPopover.jsx`
- Modify: `src/index.css` (add squiggly underline animations & styles)
- Test: `src/test/InteractiveCanvas.test.jsx`

**Interfaces:**
- Consumes: `text`, `onChange`, `corrections`, `onApplyCorrection`, `onDismissCorrection`, `onSelectCorrection`
- Produces: Live synced editable canvas with interactive error spans and floating popover

- [ ] **Step 1: Write component test for `InteractiveGrammarCanvas`**
Create `src/test/InteractiveCanvas.test.jsx` testing that spans render with proper styling classes (`lexora-underline-grammar`, `lexora-underline-clarity`), clicking an underline calls `onSelectCorrection`, and `SuggestionPopover` displays the replacement and explanation.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/InteractiveCanvas.test.jsx`
Expected: FAIL because components do not exist yet.

- [ ] **Step 3: Implement `SuggestionPopover.jsx` and `InteractiveGrammarCanvas.jsx`**
- Implement `SuggestionPopover.jsx` with:
  - Category badge (e.g. "Grammar", "Clarity")
  - Strikethrough of `c.original` $\to$ green replacement button `c.replacement`
  - Keyboard listener: `Enter` applies, `Escape` dismisses
  - Plain-English `c.explanation`
- Implement `InteractiveGrammarCanvas.jsx` with mirrored backdrop overlay:
  - Background container mirrors text with highlighted `<mark>` spans
  - Foreground `<textarea>` with matching font, padding, line-height, and synchronized scrolling
  - Click on `<mark>` coordinates calculates popover anchor position.

- [ ] **Step 4: Add squiggly underline styles in `src/index.css`**
Add styles:
- `.lexora-underline-grammar { text-decoration: underline wavy #ef4444; text-decoration-thickness: 2px; text-underline-offset: 4px; cursor: pointer; }`
- `.lexora-underline-spelling { text-decoration: underline wavy #f43f5e; text-decoration-thickness: 2px; text-underline-offset: 4px; cursor: pointer; }`
- `.lexora-underline-clarity { text-decoration: underline wavy #0284c7; text-decoration-thickness: 2px; text-underline-offset: 4px; cursor: pointer; }`
- `.lexora-underline-punctuation { text-decoration: underline wavy #d97706; text-decoration-thickness: 2px; text-underline-offset: 4px; cursor: pointer; }`
- `.lexora-underline-style { text-decoration: underline wavy #7c3aed; text-decoration-thickness: 2px; text-underline-offset: 4px; cursor: pointer; }`

- [ ] **Step 5: Run tests to verify they pass**
Run: `npx vitest run src/test/InteractiveCanvas.test.jsx`
Expected: PASS

---

### Task 3: Grammar Inspector Sidebar & WritingEditor Studio Integration

**Files:**
- Create: `src/components/GrammarInspector.jsx`
- Modify: `src/components/WritingEditor.jsx`
- Test: `src/test/WritingEditor.test.jsx`

**Interfaces:**
- Consumes: `corrections`, `onApplyCorrection`, `onApplyAll`, `onDismissCorrection`, `onFocusCorrection`, `textStats`
- Produces: Integrated studio with score dial, category pills, live deck, and instant batch acceptance

- [ ] **Step 1: Write unit tests for `GrammarInspector`**
Test score computation (100 for clean text, lower for dense errors), category filter counts, and triggering `onApplyAll`.

- [ ] **Step 2: Implement `GrammarInspector.jsx`**
Build the right-side inspector panel:
- Circular score meter showing calculated Document Health (0–100)
- Categorized summary chips (Correctness, Clarity, Punctuation, Style) with count badges
- "Accept All (N)" button
- Scrollable list of actionable cards synchronized with the canvas

- [ ] **Step 3: Integrate `InteractiveGrammarCanvas` & `GrammarInspector` into `WritingEditor.jsx`**
- Replace the legacy dual-box layout in Grammar mode with the unified canvas + inspector layout
- Implement typing debounce (600ms) that automatically calls `checkGrammarSpans` when user stops typing
- Implement reverse descending order substitution in `handleApplyAllCorrections`
- Retain traditional rewrite tools (Improve, Simplify, Tone) via seamless tab switching

- [ ] **Step 4: Run component tests**
Run: `npx vitest run src/test/WritingEditor.test.jsx`
Expected: PASS

---

### Task 4: Academic Humanizer Engine Core (DadaNanjesha Integration)

**Files:**
- Modify: `server/academicRefinerService.js`
- Modify: `src/utils/textRules.js`
- Test: `src/test/academicRefinerService.test.js`

**Interfaces:**
- Consumes: `{ text, intensity: number (0-100), preserveCitations: boolean }`
- Produces: `{ refined: string, citationsProtected: number, contractionsExpanded: number, transitionsAdded: number, synonymsReplaced: number, diffOps: Array }`

- [ ] **Step 1: Write unit test for the academic humanizer engine**
Create tests verifying:
- APA/MLA citations (`(Johnson et al., 2021)`, `(Miller, 2019, p. 45)`) remain 100% unaltered.
- Contractions (`can't`, `it's`, `didn't`) are expanded (`cannot`, `it is`, `did not`) with case preservation.
- Transition connectors (`Moreover,`, `Furthermore,`, `Consequently,`) are inserted at sentence boundaries.
- Intensity slider modulates the degree of academic synonym substitution.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/academicRefinerService.test.js`
Expected: FAIL

- [ ] **Step 3: Implement Humanizer Pipeline in `server/academicRefinerService.js` & `src/utils/textRules.js`**
Port and enhance the algorithms from DadaNanjesha's `AI-content-detector-Humanizer`:
- `extractCitations(text)` and `restoreCitations(text, placeholderMap)` with enhanced regex
- Contractions expansion dictionary
- Academic transitions pool and contextual placement algorithm
- Synonyms replacement engine modulated by `intensity` percentage (0.0 to 1.0)
- Local client-side mirror in `src/utils/textRules.js` for zero-latency offline demo execution.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/academicRefinerService.test.js`
Expected: PASS

---

### Task 5: Academic Refiner UI Upgrade with Intensity Controls & Citation Shield

**Files:**
- Modify: `src/components/AcademicRefiner.jsx`
- Test: `src/test/AcademicRefiner.test.jsx`

**Interfaces:**
- Consumes: User academic text, preset mode, slider values
- Produces: Enhanced UI with slider, citation shield meter, stats diff, and refined output

- [ ] **Step 1: Write test for AcademicRefiner UI controls**
Test that changing the intensity slider updates the request payload, citation shield counter displays protected references, and diff preview renders without errors.

- [ ] **Step 2: Implement UI controls in `src/components/AcademicRefiner.jsx`**
- Add Humanizer Intensity Slider (0% to 100%) with presets:
  - *Light Touch (35%)*
  - *Balanced Scholar (65%)*
  - *Maximum Humanize (90%)*
- Add Citation Shield status card with detected citation chips
- Add real-time statistics comparison: Word Count, Sentence Count, Average Sentence Length
- Add "Apply to Studio" button to pass humanized text back into Grammar Studio for fine polish.

- [ ] **Step 3: Run component tests**
Run: `npx vitest run src/test/AcademicRefiner.test.jsx`
Expected: PASS

---

### Task 6: Comprehensive Verification & Quality Gates

**Files:**
- Entire repository

- [ ] **Step 1: Run linter**
Run: `npm run lint`
Expected: Exit code 0, 0 errors, 0 warnings.

- [ ] **Step 2: Run Vitest test suite**
Run: `npm test`
Expected: All test suites pass.

- [ ] **Step 3: Run Node integration test suite**
Run: `npm run test:suite`
Expected: All integration tests pass.

- [ ] **Step 4: Run production build**
Run: `npm run build`
Expected: Vite build completes with 0 errors.

- [ ] **Step 5: Run full unified check**
Run: `npm run check`
Expected: Exit code 0.
