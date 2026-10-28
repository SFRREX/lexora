---
name: release-verification
description: Repeatable step-by-step checklist to verify build, lint, tests, security posture, and documentation before shipping or handing over changes in Lexora.
---

# Release Verification Checklist for Lexora

Before completing any task or preparing a release, execute and verify this checklist:

## 1. Clean Git Working Tree
Inspect tracked and untracked files:
```bash
git status --short
```
Ensure no secret `.env` files, temporary logs, or large uncommitted artifacts are tracked.

## 2. Complete Quality Gate
Run the unified verification command:
```bash
npm run check
```
Verify:
- Oxlint: 0 warnings, 0 errors.
- Vitest: 100% test files passing.
- Node test-suite: All 14 integration test suites passing.
- Node test-rules: All text rule suites passing.
- Vite build: Zero bundle errors, clean output in `dist/`.

## 3. Dependency Security Audit
Run npm audit to ensure no high or critical vulnerabilities:
```bash
npm audit --audit-level=high
```

## 4. Documentation & Schema Alignment
- Verify that `package.json` scripts match documented commands in `README.md` and `AGENTS.md`.
- Ensure new or modified endpoints in `server/apiRouter.js` are reflected in client services (`src/services/`).
- Document all genuine limitations, unresolved blockers, or required environment configurations honestly.
