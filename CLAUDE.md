## Project

vw-calc is a published npm Sass library: one public function `vw-calc()` that turns 1–3 unitless px values into fluid, accessible CSS — `max()`/`clamp()` expressions of the form `calc(<y-intercept>rem + <slope>vw)`, linearly interpolated between `$narrow-width` (375) and `$wide-width` (1440). The `rem` term preserves the reader's font-size preference; the `vw` term scales with the viewport. `rem-calc()` (px→rem) is also public. Defaults are module-level `$default-*` `!default` variables, overridable globally via `@use 'vw-calc' with (...)` or per call as named arguments. Requires Dart Sass >= 1.33.0 (peer dependency); LibSass/node-sass unsupported. Zero runtime dependencies — the published artifact is pure SCSS (`_index.scss` forwarding `src/`).

## Commands

Use pnpm for everything (lockfile and CI are pnpm; the README's `npm` examples are consumer-facing).

- `pnpm install --frozen-lockfile` — install. `pnpm-workspace.yaml` is not a monorepo marker; it only records the build-script allowlist. If pnpm reports blocked build scripts after a dependency change, use `pnpm approve-builds`.
- `pnpm test` — full Jest suite (TS specs run through the @swc/jest transform).
- `pnpm test tests/errors.spec.ts` — single test file. Sass specs all run through the `tests/scss.spec.ts` bridge, so narrow those with a name filter: `pnpm test -t 'vw-calc'` (no `--` — pnpm forwards args directly, and a literal `--` reaches Jest and misparses).
- `pnpm typecheck` — `tsc --noEmit` over `public/scripts/` and `tests/`. Must be green; CI runs it.
- `pnpm dev` — Parcel dev server for the playground (`public/`).
- `pnpm build` — production playground build into the committed `docs/`.

## Architecture

**Library** — `_index.scss` forwards `src/vw-calc.scss`: the `$default-*` config variables, public `vw-calc()` (branches on value count: 1 → `max()` / plain rem `@warn` / `clamp()` with `$dynamic`; 2 → `max()` or `clamp()`; 3 → always `clamp()`), private helpers `-rem-number` / `-fluid-value`. `src/_utils.scss` holds `strip-unit`, `get-unit`, `value-to-rem`, `rem-calc`. Naming trap (noted in source): private helpers keep the leading `-`, but never the shape `-*-calc` / `-*-expression` / `-*-element` — Sass parses those as legacy CSS special functions and emits them as raw text.

**Tests** — Jest is the runner; `.ts` specs are transpiled by @swc/jest while `pnpm typecheck` does the actual type-checking. `tests/scss.spec.ts` is a bridge that globs `tests/**/*.spec.scss` and runs each through sass-true, so Sass assertions live in `.spec.scss` files (`describe`/`it`/`assert` blocks). `tests/errors.spec.ts` compiles snippets with `sass.compileString` to assert `@error` cases.

**Playground** — `public/` is the source (HTML/TS/SCSS, dogfooding the library); Parcel builds it into the **committed** `docs/`, the GitHub Pages site. `output-namer.mjs` (registered in `.parcelrc`) pins production output names to `styles.css`/`scripts.js` (dev builds fall through to default naming). Never hand-edit `docs/` — edit `public/` and run `pnpm build`. `dist/` is stray gitignored Parcel output.

**Runtime mirror** — `public/scripts/vw-calc.ts` re-implements the Sass function in TypeScript (same math, validation messages, and Dart Sass's 10-digit number serialization) so the playground computes results live without compiling Sass. It drifts silently if forgotten.

**Sync rule** — any behavior or API change to `src/vw-calc.scss` must, in the same change: update the TS runtime mirror; update the README `Parameters`/`Behavior`/`Validation` tables; update the playground UI (`public/index.html` + `public/scripts/index.ts`) when parameters or defaults change; and rebuild `docs/` with `pnpm build`.

**Releases** — pushing to `main` with a not-yet-published `package.json` version auto-publishes to npm (`publish.yml`, OIDC + provenance). Never bump the version, push to `main`, or publish unless explicitly asked — a version bump is a release action. `ci.yml` runs typecheck + tests on every push and PR.

## TypeScript

`tsconfig.json` is `strict` plus: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUncheckedSideEffectImports`, `noUnusedLocals`/`noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, unreachable code/labels as errors, and the single-file-transpiler set (`isolatedModules`, `verbatimModuleSyntax`, `erasableSyntaxOnly`). `noEmit` — tsc only type-checks; Parcel and @swc/jest transpile. `noPropertyAccessFromIndexSignature` is deliberately off: `dataset.arg` dot-access is the house style. TypeScript 7 does not auto-load `@types` packages, hence the explicit `"types": ["node", "jest"]`. Don't loosen or add flags without asking.

## Code style

**General** — 2-space indentation in every language; kebab-case filenames; SCSS partials prefixed `_`; tests named `*.spec.ts` / `*.spec.scss`. Single quotes in SCSS and TS/JS; no semicolons in TS/JS. Files predating these rules (double quotes in `src/*.scss` and the `@use` lines of `public/styles/index.scss`; semicolons in `output-namer.mjs`) migrate when a change already touches them — no reformat-only commits.

**Library Sass (`src/`)** — kebab-case functions/variables; configurable defaults use the `$default-` prefix with `!default`; private helpers are `-`-prefixed. SASSDoc (`///`, `@param`, `@return`, `@access`) on every function and config variable, including private helpers.

**Demo TS (`public/scripts/`)** — camelCase variables/functions; SCREAMING_SNAKE_CASE module constants; PascalCase types/classes. Idiom: `const` arrow functions with explicit return types (no `function` declarations); `type` aliases over `interface` (interface only where declaration merging requires it, e.g. the `Window` augmentation); inline type imports (`import { type X }`). JSDoc on exported functions.

**Demo HTML/CSS naming (`public/`)** — BEM classes (`block__element--modifier`) for styling. `js-*` classes exist solely as JS hooks and are never styled. JS-driven state lives in `data-*` attributes (`data-state`, `data-kind`, `data-invalid`) styled via attribute selectors — not modifier classes. IDs are kebab-case and exist only for accessibility relationships (`aria-labelledby`, label wiring) — never styled, never queried from JS. `data-*` values mirror their consumer: camelCase when read as TS option keys (`data-arg="narrowWidth"`), CSS-form when naming properties (`data-decl="font-size"`). HTML attributes double-quoted.

**Demo SCSS (`public/styles/`)** — dogfood the library: every size goes through `u.rem-calc()` / `vw.vw-calc()`, no raw px literals. Kebab-case palette variables grouped under `///` comments; BEM written via `&__` / `&--` nesting; state styled via `[data-*]` selectors; declaration order layout → box model → visual → typography; lowercase 6-digit hex colors; transitions honor `prefers-reduced-motion`.

## Testing policy

A behavior change in `src/` requires a matching test in the same change — sass-true `.spec.scss` for compiled output, `errors.spec.ts` for `@error` paths. `pnpm test` and `pnpm typecheck` must pass locally before the work is considered done.

## Commits

Imperative, sentence-case, descriptive one-line summaries; no type prefixes (e.g. "Convert all comments to JSDoc/SASSDoc style").
