# vw-calc()

vw-calc() is a `SASS` function that scales pixel-based value(s) proportionally and accessible. See example [demo](https://raymall.github.io/vw-calc/).

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
    $narrow,
    $clamp,
    $dynamic,
    $base-font-size
  )
```

| Name              | Type                                              | Default | Description                                        |
| ---------------   | ------------------------------------------------- | ------- | -------------------------------------------------- |
| `$values`         | `number - ($min-value, $max-value, $limit-value)` |         | One parameter required. Up to 3 (three) parameters allowed |
| `$wide-width`     | `number`                                          | `1440`  | Unitless pixel-based value for wide screens |
| `$narrow-width`   | `number`                                          | `375`   | Unitless pixel-based value for narrow screens |
| `$narrow`         | `boolean`                                         | `false` | If enabled `$values` MUST have 1 (one) parameter, which will be treated as the `$max-value`, then it will set `$min-value` to `0`. This helpful when the scaling will happen on narrow screens. |
| `$clamp`          | `boolean`                                         | `false` | Enable to avoid the returned value to scale beyond `$wide-width` |
| `$dynamic`        | `boolean`                                         | `false` | If enabled `$values` MUST have 1 (one) parameter, which will be treated as the `$max-value`, then it will apply a mathematical rule of three to calculate `$min-value` |
| `$base-font-size` | `number`                                          | `16`    | Default base font size for most browsers |

### Usage

1. Import the function with SASS `@use` rule
   ```sh 
   @use 'vw-calc';
   ```
   
   OR with an alias:

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

3. Passing the values directly in the SASS function, e.g:
   ```sh
    vw-calc(16 32, wide-width: 1200, narrow-width: 425);
   ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

