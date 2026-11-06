# Playful tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add image palettes, a weighted decision wheel and downloadable code cards to HandyBox.

**Architecture:** Dedicated lazy-loaded tool modules reuse UI/download helpers and image validation. Pure algorithm modules support unit tests; Canvas is the single preview/export rendering path.

**Tech Stack:** Astro, browser Canvas/Web Crypto, JavaScript, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-07-playful-tools-design.md`

## Global Constraints

- Static GitHub Pages site; all inputs and processing stay in the browser.
- Bilingual UI, technical explanations, responsive layout, theme support, no input persistence.
- Images: static JPEG/PNG/WebP, 25 MiB, 24 MP, 8192 px per side; sample edge 160 px.
- Wheel: 2–50 initial entries, label <=60 code points, integer weights 1–100; allow one remaining entry.
- Code: <=12,000 characters / 200 lines, bounded 2x PNG export.

## Review Focus

- Transparent and single-color images should not invent invisible colors or duplicate swatches.
- Editing or clearing during file loading must not restore stale image results.
- Weighted drawing, winner text and pointer must agree, including a single remaining choice.
- No-repeat mode must survive language switching and stop on exhaustion without silently restoring entries.
- Long Unicode code, HTML-like text and oversized output must be safe and must not silently truncate.

### Task 1: Algorithms

**Files:** Create `src/tools/play/palette-core.mjs`, `wheel-core.mjs`, `code-core.mjs`, and `tests/playful.test.mjs`.

**Interfaces:** `extractPalette(rgba,count)` -> `{hex,rgb,ratio}[]`; `paletteCSS(colors)` -> string. `parseEntries(text)` -> `{id,label,weight}[]`; `pickEntry(entries,unitRandom)` -> index; `wheelTarget(entries,index,currentAngle,unitRandom)` -> degrees. `prepareCode(text)` -> normalized string; `wrapTokens(tokens,maxWidth,measure)` -> visual lines of typed tokens.

- [x] Add failing behavioral tests for color/count/alpha handling, weighted boundaries/landing, input validation and Unicode wrapping.
- [x] Run `node --test tests/playful.test.mjs`, confirm missing functionality fails.
- [x] Implement pure modules and run the tests to green.

### Task 2: Workbenches and catalog

**Files:** Create `src/tools/play/{shared,palette,wheel,code-card}.mjs`, `src/styles/playful.css`, `src/data/principles-playful.mjs`. Modify catalog, loader, principles aggregation, layout counts and catalog/browser tests.

**Interfaces:** Each module exports `mount(root)`; consumes Task 1 functions and `src/lib/ui.mjs` helpers.

- [x] Add browser assertions for palette fixture/download, wheel weighted/no-repeat outcomes, code export and unsafe text.
- [x] Implement three bilingual workbenches, accessible controls, responsive visual previews, examples and reset actions.
- [x] Register D17/I06/T08 and technical explanations. Use computed catalog totals.
- [x] Build and run targeted browser checks, including language preservation and mobile overflow.

### Task 3: Delivery verification

**Files:** Update `README.md`, `功能规划.md`, this plan and the implementation ledger.

- [x] Run all unit tests, Astro build/link checks and all browser checks.
- [x] Inspect desktop/mobile screenshots and actual downloaded PNG/CSS files.
- [x] Obtain a fresh whole-change code review, address material findings with regression checks.
- [x] Report the implemented features and verified results; leave changes locally reviewable.

## Verification result

65 unit tests passed. Astro generated 35 pages and all local links passed checks. Browser integration passed for all 33 tools, including bilingual explanations, downloads, mobile/dark screenshots, no-repeat exhaustion, unsafe text, PNG keyword pixels and persisted-pagehide restoration. A fresh reviewer found one material lifecycle issue; reproduced it and its analogous wheel/timer cases, fixed all three, then reran the full suite successfully. No deferred findings. Changes remain local; no publication was requested.
