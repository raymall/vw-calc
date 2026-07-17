# Project Audit — vw-calc
*Audited on July 15, 2026*

## 1. Summary & Purpose

vw-calc is a small, published npm package (`vw-calc@1.0.7`) providing a single Sass function that converts pixel values into fluid, viewport-scaled CSS using `rem` + `vw` math (the "linearly scale with clamp" technique, credited in the source to a CSS-Tricks article). Given one to three pixel values, it emits `max()` or `clamp()` expressions so typography and spacing scale smoothly between a narrow width (default 375) and a wide width (default 1440) while staying accessible (rem-based, so user font-size preferences are respected).

The repo also contains a Parcel-built demo site (`public/`, compiled into `docs/` for GitHub Pages) and a sass-true/Jest test harness. The core function works and compiles correctly for its documented main use cases — verified by compiling it directly during this audit.

Honest one-sentence state: the core library is sound and focused, but the test suite is currently broken (0 tests can run), two utility/parameter bugs ship in the package, and the README's main usage example doesn't compile.

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | SCSS (Dart Sass ^1.87.0) | Modern module syntax (`@use`, `sass:math`) — no deprecated `@import`/`/` division in `src/` |
| Package manager | pnpm | `pnpm-lock.yaml` v9.0 |
| Demo bundler | Parcel ^2.14.4 | Builds `public/` → `docs/` for GitHub Pages |
| Demo scripting | TypeScript (via Parcel) | `public/scripts/index.ts`, no `tsconfig.json` |
| Testing | Jest ^29.7.0 + sass-true ^8.0.0 | Currently non-functional (see §5) |
| CI/CD | None | No `.github/workflows` or other CI config |

All dependencies are dev-only; the published artifact is pure SCSS (`main: "src/vw-calc.scss"`). Dependency versions date to spring 2025 (~14 months old at audit time) — no known issue found, but worth a refresh pass.

## 3. Project Structure

```
src/vw-calc.scss    The public API: vw-calc() function + configurable $default-* vars
src/_utils.scss     Helpers: strip-unit(), get-unit(), value-to-rem(), rem-calc()
public/             Demo site source (HTML + SCSS + TS) — consumes the library itself
docs/               Committed Parcel build of the demo (GitHub Pages)
tests/              Jest runner (scss.spec.ts) + sass-true spec (vw-calc.spec.scss)
```

Flow: `vw-calc()` normalizes its 1–3 input values to rem via `u.rem-calc()`, computes a linear slope between the narrow and wide breakpoints, and returns `max(min, slope)` or `clamp(min, slope, limit)` depending on `$clamp`/`$narrow`/`$dynamic` flags and value count. The demo (`public/styles/index.scss`) imports the library and its utils directly, and `public/scripts/index.ts` reads the compiled CSS rules at runtime to display styled vs. computed output as the viewport resizes — a nice self-documenting demo.

## 4. Code Analysis & Improvement Opportunities

**`vw-calc()` is one 100-line function with flag-driven branching.** The `$count` × `$clamp` × `$narrow` × `$dynamic` combinations (src/vw-calc.scss:49–125) are hard to reason about, and some combinations are undefined (e.g., `$narrow` with 2–3 values is accepted but untested/undocumented). Extracting the slope math into a helper and validating flag combinations up front would make the branches auditable.

**Argument validation runs late.** The `$count > 3` guard is the last statement (src/vw-calc.scss:123–125), after the slope math has already executed on the value list. Move validation to the top of the function.

**Unused module imports.** `src/vw-calc.scss:2–7` loads `sass:color`, `sass:map`, `sass:meta`, `sass:selector`, and `sass:string`, none of which are used. Same for `sass:meta`/`sass:string` in `_utils.scss` (meta is used, string is used — only vw-calc.scss has dead imports). Trim them.

**Loud comment leaks into consumers' CSS.** The `/*** Inspired by... ***/` block (src/vw-calc.scss:10–14) is a loud comment, so every project that `@use`s the library gets it injected into compiled output — verified during audit. Change to silent `//` comments.

**README `@use 'vw-calc'` needs load-path context.** The import examples only work if `node_modules` is on the Sass load path (Parcel/Vite do this; plain `sass` CLI doesn't). A one-line note, or documenting the `pkg:` importer syntax, would prevent the most common consumer confusion.

**Minor:** `$limit-value-size` is initialized twice (src/vw-calc.scss:36 and :42); `package.json` lacks `repository`, `engines`, and `files` fields — without `files`, the npm tarball ships `docs/` build output and `tests/`.

## 5. Risks, Caveats & Technical Debt

| Severity | Finding | Location | Why it matters |
|----------|---------|----------|----------------|
| 🟠 High | Test suite cannot run — 0 tests execute | `tests/scss.spec.ts:3`, `package.json` | The library's only safety net is dead; regressions ship silently |
| 🟠 High | `rem-calc()` negates multi-value lists: `rem-calc(16 32)` → `-1rem -2rem` | `src/_utils.scss:51` | Silent wrong CSS for any consumer passing shorthand lists |
| 🟠 High | `$base-font-size` applied inconsistently — changes the vw slope but not the rem values | `src/vw-calc.scss:40–42` vs `:87–88` | Documented parameter produces mathematically wrong output when changed |
| 🟡 Medium | README's primary usage example is invalid Sass (`wide-width: 1200` — missing `$`) | `README.md` Usage §3 | First thing new users copy fails to compile |
| 🟡 Medium | License mismatch: `package.json` says ISC, LICENSE.md/README say MIT | `package.json:25`, `LICENSE.md` | Ambiguous licensing on a published package |
| 🟡 Medium | Single test case; `clamp`/`narrow`/`dynamic` modes, error paths, and all utils untested | `tests/vw-calc.spec.scss` | Even with the runner fixed, coverage is one happy path |
| 🟡 Medium | No CI | repo root | Explains how a broken test suite went unnoticed across releases |
| 🟡 Medium | `.gitignore` lists `/public` and `/dist` but `public/` is tracked source | `.gitignore` | New files added under `public/` are silently ignored by git |
| 🟢 Low | Loud comment injected into consumers' compiled CSS | `src/vw-calc.scss:10–14` | Output pollution |
| 🟢 Low | No `files` field — tarball includes `docs/` builds and `tests/` | `package.json` | Package bloat (small: ~28K) |
| 🟢 Low | Committed `docs/` build can drift from `src/` | `docs/` | Demo may not reflect current behavior |
| 🟢 Low | Dev dependencies ~14 months old; no `engines` field | `package.json` | Refresh and pin supported Node range |

**Test suite broken (verified):** `npm test` fails with `Cannot find module 'glob'`. `tests/scss.spec.ts` requires `glob`, which isn't in `devDependencies`; pnpm's strict `node_modules` layout doesn't hoist it. Fix: `pnpm add -D glob` (one line). Note the fix will surface a second issue: the spec's expected output should be re-verified once tests run.

**`rem-calc()` negation bug (verified):** `src/_utils.scss:51` reads `list.append($rem-values, - value-to-rem(...))` — the stray unary `-` negates every value in the multi-value branch. Compiling `rem-calc(16 32)` returns `-1rem -2rem`. `vw-calc()` itself is unaffected (it only passes single values), and the demo only uses single values, so this is latent — but it ships in the package. Fix: delete the `-`, add a test.

**`$base-font-size` inconsistency (verified):** breakpoint widths are divided by `$base-font-size` (src/vw-calc.scss:87–88), but the pixel values are converted to rem by `u.rem-calc()` at its own hard-coded default base of 16 (src/vw-calc.scss:40–42, `_utils.scss:42`). Compiling `vw-calc(16 32, $base-font-size: 8)` yields `max(1rem, 0.647rem + 0.751vw)` — the rem terms still assume base 16 while the slope assumes base 8. Fix: pass `$base-font-size` through as `rem-calc()`'s `$base` argument.

## 6. Recommended Next Steps

1. `pnpm add -D glob` to un-break the test suite, and confirm the existing spec passes.
2. Fix the `rem-calc()` unary-minus bug (`src/_utils.scss:51`) and thread `$base-font-size` through the `rem-calc()` calls in `vw-calc()`; publish a patch release.
3. Expand `tests/vw-calc.spec.scss` to cover 2- and 3-value forms, `$clamp`/`$narrow`/`$dynamic`, `$base-font-size`, error cases, and `rem-calc()` lists — sass-true makes each of these ~10 lines.
4. Fix the README usage example (`$wide-width:`, not `wide-width:`) and align `package.json` license to MIT.
5. Add a minimal GitHub Actions workflow running `pnpm install && pnpm test` on push.
6. Housekeeping: remove `/public` from `.gitignore`, add `files: ["src"]`, `repository`, and `engines` to `package.json`, drop unused `@use` imports, convert the header comment to `//`.
