# vw-calc()

A `Sass` function to scale pixel-based value(s) proportionally and accessible.

## Getting Started

Follow these steps to setup your project.

### Installation

1. Install the package
   ```sh
   npm install --save-dev vw-calc
   ```
   
### Parameters
```
  vw-calc(
    $values,
    $wide-width,
    $narrow-width,
    $clamp,
    $narrow,
    $dynamic,
    $base-font-size
  )
```

| Name              | Type                                              | Default | Description                                        |
| ---------------   | ------------------------------------------------- | ------- | -------------------------------------------------- |
| `$values`         | `number - ($min-value, $max-value, $limit-value)` |         | One parameter required. Up to 3 (three) parameters allowed |
| `$wide-width`     | `number`                                          | `1440`  | Unitless pixel-based value for wide screens |
| `$narrow-width`   | `number`                                          | `375`   | Unitless pixel-based value for narrow screens |
| `$clamp`          | `boolean`                                         | `false` | Enable to avoid the returned value to scale beyond `$wide-width` |
| `$narrow`         | `boolean`                                         | `false` | If enabled `$values` MUST have 1 (one) parameter, which will be treated as the `$max-value`, then it will set `$min-value` to `0`. This helpful when the scaling will happen on narrow screens. |
| `$dynamic`        | `boolean`                                         | `false` | If enabled `$values` MUST have 1 (one) parameter, which will be treated as the `$max-value`, then it will apply a mathematical rule of three to calculate `$min-value` |
| `$base-font-size` | `number`                                          | `16`    | Default base font size for most browsers |

### Usage

1. Import the function with Sass `@use` rule
   ```sh
   @use 'vw-calc' as vw;
   ```

2. Change the default values as needed prepending `$default-` to the parameter name, e.g:
   ```sh
    @use 'vw-calc' as vw with (
      $default-wide-width: 1200,
      $default-narrow-width: 425
    );
   ```

   OR

3. Passing the values directly in the Sass function, e.g:
   ```sh
    vw-calc(16 32, wide-width: 1200, narrow-width: 425);
   ```

