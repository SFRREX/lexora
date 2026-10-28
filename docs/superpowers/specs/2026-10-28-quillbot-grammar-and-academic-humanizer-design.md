# Design Specification: QuillBot-Style Grammar Studio & Academic Humanizer Engine

- **Date:** 2026-10-28
- **Status:** Draft / Review
- **Target Products:** 
  1. Lexora Studio (`src/components/WritingEditor.jsx`, `src/services/textProcessor.js`, `server/geminiService.js`)
  2. Academic Refiner (`src/components/AcademicRefiner.jsx`, `server/academicRefinerService.js`, `src/utils/textRules.js`)

---

## 1. Intent & The Why

Users are dissatisfied with basic "submit text, get whole-block text back" grammar tools. Leading writing tools like **QuillBot** and **Grammarly** succeed because they provide:
1. **Interactive In-Situ Proofreading**: Subtle color-coded wavy underlines placed directly inside the user's text on the live writing canvas without shifting layout or jumping cursor focus.
2. **Instant Micro-Decisions**: Clicking or tapping an underlined error reveals an anchored popover with a 1-click replacement, rule explanation, and ignore action, as well as an "Accept All" batch mechanism.
3. **Scholarly Humanization**: Transforming rough or AI-generated prose into publication-grade academic writing with citation shielding, contraction expansion, academic transition weaving, and intensity control (adapted from DadaNanjesha's open-source humanizer architectures).

Lexora will upgrade both the Grammar Studio and Academic Refiner to match this benchmark.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Unified Document Canvas**: Replace the static dual-box pattern in Grammar mode with an interactive document canvas supporting real-time colored squiggly underlines:
  - **Red (#ef4444)**: Grammar, agreement, and spelling errors.
  - **Blue (#0284c7)**: Wordiness, redundant phrasing, and clarity improvements.
  - **Amber (#d97706)**: Punctuation and spacing issues.
  - **Purple (#7c3aed)**: Style, vocabulary, and register.
- **Anchored Suggestion Popovers**: Clicking or hovering any underlined token renders an anchored card showing:
  - Strikethrough of original token $\to$ Emerald green 1-click replacement button.
  - Keyboard shortcut support: `Enter` to apply replacement, `Esc` to dismiss popover.
  - Plain-English explanation of why the rule fired (under 15 words).
- **Assistant Sidebar with Text Health**:
  - 0–100 Document Health Score based on error density and readability metrics.
  - Category breakdown badges (Correctness, Clarity, Punctuation, Style).
  - Primary "Fix All (N)" button that applies all pending non-conflicting fixes in one click.
- **Academic Humanizer Engine (DadaNanjesha integration)**:
  - **Citation Isolation & Shielding**: APA/MLA/Chicago citations (`(Author, Year)`, `(Smith et al., 2023, p. 14)`) are extracted to placeholders (`[[REF_1]]`), protected during transformation, and restored verbatim.
  - **Contraction Expansion**: Full dictionary of English contractions expanded to formal academic English with casing preservation.
  - **Academic Transitions**: Natural injection of discourse markers (*Moreover*, *Furthermore*, *Consequently*, *Nonetheless*, *In contrast*).
  - **Adjustable Intensity Slider (0%–100%)**: Controls the rate of synonym replacement and syntactic restructuring.
  - **Token-Level Diff View**: Visual side-by-side or inline diff showing additions in green and removals in strikethrough red.

### Non-Goals
- Migrating to TypeScript or introducing `tsconfig.json` (strictly prohibited by repository policy).
- Replacing standard React state with heavy external libraries like Redux or draft.js/slate.js (keep it lightweight and high-performance within React 19).
- Modifying or removing the other core Lexora views (`#ai-checker`, `#detector-lab`).

### Anti-Goals
- No loss of local offline demo fallback: If Gemini API keys are absent or network requests time out, the local rule engine must still power the underlines, suggestions, and humanizer seamlessly.
- No editor text flicker or cursor reset while typing.
- No alteration of factual statements, formulas, code snippets, or protected citations.

---

## 3. System Architecture & Component Design

### 3.1 Grammar Studio (`src/components/WritingEditor.jsx`)
- **Interactive Canvas Component (`InteractiveCanvas.jsx` or integrated inside `WritingEditor.jsx`)**:
  - Uses an overlay/contentEditable or mirrored span-highlight architecture where the background highlights map 1:1 to character indices of the textarea without cursor desync.
  - For each detected correction span `[startIndex, endIndex]`, renders an interactive highlight tag `<mark className="lexora-span-{type}">`.
  - When active, opens the `<SuggestionPopover>` anchored via coordinate bounds.
- **Assistant Sidebar (`GrammarInspector.jsx`)**:
  - Circular Score Gauge: Computes `100 - min(40, (errors / words) * 300)`.
  - Filter tabs: `All`, `Correctness`, `Clarity`, `Punctuation`.
  - Suggestion List: Scrollable deck of issue cards synchronized with canvas highlights.
  - "Accept All" button applying all corrections from end of text to start.

### 3.2 Backend Grammar Engine (`server/geminiService.js` & `server/apiRouter.js`)
- Refines `GRAMMAR_SPAN_INSTRUCTION` and `checkGrammarSpansWithGemini` to ensure minimal character spans:
  - Categorization into `grammar`, `spelling`, `punctuation`, and `style`.
  - Strict Chicago Manual of Style rule enforcement.
  - Local rule engine in `src/utils/textRules.js` augmented with regex patterns for common grammatical mistakes (subject-verb agreement, dangling modifiers, comma splices, homophone confusion).

### 3.3 Academic Refiner & Humanizer (`src/components/AcademicRefiner.jsx` & `server/academicRefinerService.js`)
- **Citation Shielding (`extractCitations` / `restoreCitations`)**:
  - Robust regex covering author-date, multi-author et al., page numbers, and brackets.
- **Humanizer Transformation Pipeline**:
  - Step 1: Extract citations $\to$ placeholder map.
  - Step 2: Expand contractions.
  - Step 3: Unslop and remove AI cliches (via existing `UNSLOP_CATALOG`).
  - Step 4: Insert academic transition connectors when sentence rhythm permits.
  - Step 5: Synonym replacement governed by the `intensity` slider (0% to 100%).
  - Step 6: Restore citations.
- **UI Enhancements in `AcademicRefiner.jsx`**:
  - Humanization Intensity Slider (0–100%).
  - Preset modes: *Standard Humanize*, *Formal Academic*, *High-Scoring Scholarly*.
  - Token diff viewer comparing input vs output.

---

## 4. Architectural & Implementation Decisions (Builder's Calls)

- **Canvas Highlight Synchronization**: Uses a mirrored backdrop overlay (`<div className="grammar-backdrop">`) aligned 1:1 with a transparent foreground `<textarea>`. This guarantees zero cursor positioning glitches, native undo/redo (`Ctrl+Z`), full clipboard fidelity, and mobile keyboard support.
- **Analysis Debounce**: Real-time grammar analysis debounced at 600ms after user pauses typing, with instant processing on `Ctrl+Enter` or manual trigger button.
- **Humanizer Default Intensity**: Set to 65% by default for the optimal balance between natural human cadence and academic formality without aggressive over-thesaurization.
- **Backwards Substitution for "Accept All"**: When applying all corrections simultaneously, substitutions are executed in reverse descending index order (`b.startIndex - a.startIndex`) to prevent index drift.

---

## 5. Verification & Testing

- Oxlint must pass with 0 errors and 0 warnings: `npm run lint`.
- Vitest unit tests in `src/test/` for text processing, citation preservation, contraction expansion, and UI interaction must pass with 100% success: `npm test`.
- Integration test suite: `npm run test:suite`.
- Production bundle verification: `npm run build`.
- Full unified check: `npm run check`.

