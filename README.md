# vw-calc()

[![npm version](https://img.shields.io/npm/v/vw-calc)](https://www.npmjs.com/package/vw-calc)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`vw-calc()` is a Sass function that turns pixel-based values into fluid, accessible sizes that scale linearly with the viewport width. See it in action in the [demo](https://raymall.github.io/vw-calc/).

Instead of hardcoding breakpoints, you give it the size(s) you want and it returns a `max()` or `clamp()` expression built from `rem` and `vw` units:

```scss
.title {
  font-size: vw-calc(16 32);
}
```

```css
.title {
  font-size: max(1rem, 0.6478873239rem + 1.5023474178vw);
}
```

The output is `rem`-based, so it respects the user's browser font-size preference — that's what makes it accessible, not just responsive.

## Requirements

- [Dart Sass](https://sass-lang.com/dart-sass/) `1.33.0` or newer (the function uses `@use`, built-in Sass modules, and `math.div`; LibSass/`node-sass` are not supported)

## Installation

```sh
npm install --save-dev vw-calc
```

## Usage

Import the function with the Sass `@use` rule:

```scss
@use 'vw-calc';
```

with an alias:

```scss
@use 'vw-calc' as vw;
```

or without a namespace:

```scss
@use 'vw-calc' as *;
```

> **Note:** `@use 'vw-calc'` resolves through `node_modules`, which bundlers like Parcel, Vite, and webpack add to the Sass load path automatically. With the standalone Sass CLI, pass `--load-path=node_modules`.

Then use it anywhere a size is expected:

```scss
@use 'vw-calc' as vw;

.hero {
  // Scales from 16px at 375px viewport up to 32px at 1440px viewport
  font-size: vw.vw-calc(16 32);

  // Same, but capped at 40px on very wide screens
  padding-block: vw.vw-calc(16 32 40);
}
```

The remaining examples use the unnamespaced form (`@use 'vw-calc' as *`) for brevity.

## API

```scss
vw-calc(
  $values,
  $wide-width,
  $narrow-width,
  $narrow,
  $clamp,
  $dynamic,
  $base-font-size
)
```

### Parameters

| Name              | Type             | Default | Description |
| ----------------- | ---------------- | ------- | ----------- |
| `$values`         | `number \| list` |         | 1 to 3 space-separated pixel values: `max`, `min max`, or `min max limit`. See [behavior](#behavior) below. |
| `$wide-width`     | `number`         | `1440`  | Viewport width (px) where the scaling window ends — `max` is reached here |
| `$narrow-width`   | `number`         | `375`   | Viewport width (px) where the scaling window starts — `min` is reached here |
| `$narrow`         | `boolean`        | `false` | Moves the scaling window to `0`–`$narrow-width`, so scaling happens on narrow screens instead |
| `$clamp`          | `boolean`        | `false` | Stops the value from growing past `max` on screens wider than `$wide-width` |
| `$dynamic`        | `boolean`        | `false` | Single-value only: scales below the given value down to a proportional minimum. Ignored when 2 or 3 values are passed |
| `$base-font-size` | `number`         | `16`    | Pixels per `1rem`, used for the px→rem conversion |

Values are intended as unitless pixel numbers (`16`), but units are tolerated and stripped (`16px` works too).

### Behavior

What the function returns depends on how many values you pass and which flags are set:

| Input | Result |
| ----- | ------ |
| `vw-calc(32)` | Fixed at `32px` up to `$wide-width`, then keeps growing proportionally on wider screens |
| `vw-calc(32, $dynamic: true)` | Scales from a proportional minimum at `$narrow-width` up to `32px` at `$wide-width`, and keeps growing beyond |
| `vw-calc(32, $dynamic: true, $clamp: true)` | Same, but stops at `32px` |
| `vw-calc(16 32)` | Scales from `16px` at `$narrow-width` to `32px` at `$wide-width`, and keeps growing beyond |
| `vw-calc(16 32, $clamp: true)` | Same, but stops at `32px` |
| `vw-calc(16 32 40)` | Scales from `16px` to `32px` across the window, then keeps growing until it hits the `40px` limit. Clamping is always applied — `$clamp` is not needed |

Compiled output for each case (with default settings):

```scss
font-size: vw-calc(32);
// → max(2rem, 0rem + 2.2222222222vw)

font-size: vw-calc(32, $dynamic: true);
// → max(0.5208333333rem, 0rem + 2.2222222222vw)

font-size: vw-calc(32, $dynamic: true, $clamp: true);
// → clamp(0.5208333333rem, 0rem + 2.2222222222vw, 2rem)

font-size: vw-calc(16 32);
// → max(1rem, 0.6478873239rem + 1.5023474178vw)

font-size: vw-calc(16 32, $clamp: true);
// → clamp(1rem, 0.6478873239rem + 1.5023474178vw, 2rem)

font-size: vw-calc(16 32 40);
// → clamp(1rem, 0.6478873239rem + 1.5023474178vw, 2.5rem)
```

> **Note:** `vw-calc(32, $clamp: true)` (single value, no `$dynamic`) has nothing to scale — it emits a `@warn` and returns the plain `rem` equivalent. Use a `rem` value directly instead.

The `$narrow` flag is useful for sizes that should shrink on small screens and stay put on large ones:

```scss
padding-top: vw-calc(24, $narrow: true, $dynamic: true);
// → max(0rem, 0rem + 6.4vw)
// 24px at a 375px viewport, scaling down proportionally below it
```

### Configuring defaults

Override any default globally when importing, by prepending `$default-` to the parameter name:

```scss
@use 'vw-calc' as vw with (
  $default-wide-width: 1200,
  $default-narrow-width: 425
);
```

or per call, as named arguments:

```scss
font-size: vw-calc(16 32, $wide-width: 1200, $narrow-width: 425);
```

### Validation

The function throws a compile-time `@error` when:

- more than 3 values are passed
- `min` is greater than or equal to `max`
- `max` is greater than `limit`

## Development

```sh
npm test        # run the Jest + sass-true test suite
npm run dev     # serve the demo locally with Parcel
npm run build   # build the demo into docs/
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.
