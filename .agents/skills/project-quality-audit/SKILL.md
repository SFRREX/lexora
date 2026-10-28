---
name: project-quality-audit
description: Executes the complete quality verification pipeline for the Lexora AI Intelligence Suite, including oxlint, vitest, node integration suites, and vite production build.
---

# Project Quality Audit for Lexora

Follow this workflow to audit and verify project quality without hallucinating metrics:

## 1. Static Linting
Execute oxlint to ensure zero lint errors and zero warnings:
```bash
npm run lint
```
Target: Exit code 0, 0 errors, 0 warnings.

## 2. Unit & Component Test Suite
Execute Vitest across all component and utility test suites:
```bash
npm test
```
Target: 100% pass across all test files.

## 3. Node Integration & Rule Suites
Execute the multi-detector adapter and rule transformation test suites:
```bash
npm run test:suite
```
Target: All 14 integration test suites and 7 textRule tests must output PASS.

## 4. Production Build Verification
Execute the Vite production build:
```bash
npm run build
```
Target: Zero build errors. Ensure chunk sizes remain optimized and no unresolved imports exist.

## 5. Unified Verification Command
Run the unified command that executes all four steps:
```bash
npm run check
```
Only report success if `npm run check` exits with code 0.
