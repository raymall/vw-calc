# vw-calc() Demo Playground — Feature Suggestions

Proposed on 2026-07-17, following the interactive playground redesign of the demo page
(`public/`). Each feature builds on the existing runtime mirror of the Sass function
(`public/scripts/vw-calc.ts`), so none of them require changes to `src/` or new dependencies
unless noted.

---

## 1. Viewport scrubber

**Description:**
A horizontal slider (e.g. 320–1920px) that simulates a viewport width without resizing the
browser. The demo elements and computed readouts re-evaluate against the scrubbed width
instead of `window.innerWidth` — either by recomputing the expressions at the simulated width
and applying resolved px values, or by rendering the demo stage inside a width-constrained,
scaled container. The breakpoint guides and the masthead viewport readout follow the scrubbed
value, with a "live" toggle to snap back to the real viewport.

**Benefits:**
- Visitors on phones and tablets (who can't resize their window at all) can finally explore
  the entire scaling window — today the core interaction is desktop-only.
- Makes the guide states (below / approaching / at / beyond) discoverable in seconds by
  sweeping across both breakpoints.
- Enables precise inspection ("what exactly happens at 1024px?") that dragging a window edge
  can't do reliably.

---

## 2. Scaling-curve graph

**Description:**
A small SVG chart per example (or one shared chart) plotting rendered size (y, px) against
viewport width (x, px): flat segment before `$narrow-width`, the linear slope across the
scaling window, and the plateau produced by `$clamp` or a `limit` value. A marker tracks the
current (or scrubbed) viewport position, and the curve re-draws as values, flags, and
breakpoints are edited.

**Benefits:**
- Turns the abstract slope/y-intercept math into a picture — the single most effective way to
  teach what `max(0.6479rem + 1.5023vw, …)` actually does.
- Differences between `max()` and `clamp()` behavior (growing forever vs. stopping) become
  visually obvious, as does what the three-value form adds.
- Marketing value: a distinctive visual that screenshots well in the README and on social.

---

## 3. Copy buttons

**Description:**
A copy-to-clipboard button on each Input and Styled output panel: one grabs the authored SCSS
call (`font-size: vw-calc(16 32, $clamp: true);`), the other the compiled CSS expression
(`font-size: clamp(1rem, 0.6478873239rem + 1.5023474178vw, 2rem);`). Uses the async Clipboard
API with a brief "copied" state on the button.

**Benefits:**
- Turns the demo from a showcase into an authoring tool — designers can dial in values and
  paste the result straight into their project, even one that doesn't use Sass (via the
  compiled CSS).
- Very low implementation cost relative to its utility; no layout changes required.
- Encourages adoption: the copied SCSS line is itself a tiny advertisement for the API.

---

## 4. Base font-size simulator

**Description:**
A page-level control (e.g. 12 / 16 / 20 / 24px presets) that sets `font-size` on `<html>`,
simulating a user who has changed their browser's default font size. Computed readouts and
demo elements update live; an annotation explains that the `rem` term is what makes the
output respond. Optionally paired with a `$base-font-size` field per example to show the
compile-time counterpart.

**Benefits:**
- Demonstrates the package's central accessibility claim — "respects the reader's font-size
  preference" — instead of merely stating it; today nothing on the page proves it.
- Clarifies the difference between the user's preference (runtime `rem` behavior) and
  `$base-font-size` (compile-time px→rem conversion), a common point of confusion.
- Strengthens the a11y story that differentiates vw-calc() from plain `vw`-based sizing.

---

## 5. Shareable URLs

**Description:**
Serialize each example's state (values, flags, breakpoint widths) into the query string or
hash (e.g. `?01=16,32,,clamp`) — debounced as the user edits — and hydrate state from the URL
on load. A "share" button copies the current link.

**Benefits:**
- Lets users link an exact configuration in bug reports, code reviews, docs, and tweets —
  "here's the curve I mean" becomes one URL.
- Makes the README's behavior table linkable: each documented case can point at a live,
  pre-configured example.
- Free persistence: reloading the page no longer loses a dialed-in setup.

---

## 6. `@use … with (…)` defaults panel

**Description:**
A global panel above the examples mirroring the configure-time API:
`@use 'vw-calc' as vw with ($default-wide-width: …, $default-narrow-width: …)`. Editing it
updates every example's defaults (individual example overrides still win), the rendered
`@use` snippet, and repositions the breakpoint guides to the configured widths.

**Benefits:**
- Showcases an entire README section ("Configuring defaults") that the demo currently doesn't
  exercise at all.
- Teaches the defaults-vs-named-arguments precedence model interactively, which is hard to
  convey in prose.
- Moving the guides with the configured widths reinforces that the breakpoints are a project
  design decision, not magic constants.

---

## 7. Fixed-px comparison toggle

**Description:**
A per-example toggle that renders a static twin of the demo element beside the fluid one —
same markup, but sized with the plain `max` px value (`font-size: 32px`). Labels mark which
is which; resizing (or scrubbing) makes the divergence visible, including the fluid version's
behavior beyond `$wide-width`.

**Benefits:**
- Shows what fluidity buys instead of asking visitors to imagine it — the value proposition
  becomes self-evident at any narrow width.
- Highlights the "no media queries" pitch: the static twin is exactly what you'd otherwise
  need breakpoint CSS to fix.
- Cheap to build (one extra element and a class toggle per example) with high explanatory
  payoff for newcomers.
