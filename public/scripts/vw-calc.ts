/**
 * Runtime mirror of `src/vw-calc.scss` so the playground can re-evaluate
 * calls live without a Sass compile. Keep the math, validation messages,
 * and number formatting in sync with the Sass source.
 */

export type VwCalcOptions = {
  wideWidth?: number
  narrowWidth?: number
  narrow?: boolean
  clamp?: boolean
  dynamic?: boolean
  baseFontSize?: number
}

export type VwCalcResult = {
  /** CSS expression, e.g. `max(1rem, 0.6478873239rem + 1.5023474178vw)` */
  value: string
  /** Mirror of the Sass `@warn` for the single-value `$clamp` case */
  warning?: string
}

/** Mirror of the Sass `@error` cases — thrown for invalid input */
export class VwCalcError extends Error {}

export const VW_CALC_DEFAULTS = {
  wideWidth: 1440,
  narrowWidth: 375,
  narrow: false,
  clamp: false,
  dynamic: false,
  baseFontSize: 16,
}

/**
 * Sass-style number output: Dart Sass serializes the double's shortest
 * round-trip decimal representation rounded half-up at 10 decimal digits
 * (toFixed(10) rounds the binary expansion instead and can differ in the
 * last digit), with trailing zeros trimmed and no exponential notation.
 */
const formatNumber = (value: number): string => {
  const negative = value < 0
  let digits = Math.abs(value).toString()

  const exponential = digits.match(/^(\d+)(?:\.(\d+))?e([+-]\d+)$/)

  if (exponential) {
    const [, intPart, fracPart = '', exponentRaw] = exponential
    const allDigits = intPart + fracPart
    const pointIndex = intPart.length + Number(exponentRaw)

    if (pointIndex <= 0) {
      digits = `0.${'0'.repeat(-pointIndex)}${allDigits}`
    } else if (pointIndex >= allDigits.length) {
      digits = allDigits + '0'.repeat(pointIndex - allDigits.length)
    } else {
      digits = `${allDigits.slice(0, pointIndex)}.${allDigits.slice(pointIndex)}`
    }
  }

  let [whole, fraction = ''] = digits.split('.')

  if (fraction.length > 10) {
    const roundUp = fraction.charCodeAt(10) >= 53
    fraction = fraction.slice(0, 10)

    if (roundUp) {
      const bumped = (BigInt(whole + fraction) + 1n).toString().padStart(whole.length + 10, '0')
      whole = bumped.slice(0, -10)
      fraction = bumped.slice(-10)
    }
  }

  fraction = fraction.replace(/0+$/, '')

  const result = fraction ? `${whole}.${fraction}` : whole

  return result === '0' ? '0' : negative ? `-${result}` : result
}

/** Px-based value to its unitless rem number, e.g. 24 -> 1.5 */
const remNumber = (value: number, baseFontSize: number): number => value / baseFontSize

/**
 * Fluid "preferred value" for max()/clamp(): the line through
 * (min-width-px, min-rem) and (max-width-px, max-rem).
 */
const fluidValue = (
  minRem: number,
  maxRem: number,
  minWidthPx: number,
  maxWidthPx: number,
  baseFontSize: number
): string => {
  const minWidthRem = minWidthPx / baseFontSize
  const maxWidthRem = maxWidthPx / baseFontSize
  const slope = (maxRem - minRem) / (maxWidthRem - minWidthRem)
  const yIntercept = -minWidthRem * slope + minRem

  return `${formatNumber(yIntercept)}rem + ${formatNumber(slope * 100)}vw`
}

/**
 * Fluid size that scales linearly with the viewport width.
 * @param values - `max`, `min max`, or `min max limit` sizes (px)
 * @returns the max()/clamp() rem+vw expression, or plain rem
 * @throws {VwCalcError} on the same cases the Sass function `@error`s on
 */
export const vwCalc = (values: number[], options: VwCalcOptions = {}): VwCalcResult => {
  const { wideWidth, narrowWidth, narrow, clamp, dynamic, baseFontSize } = {
    ...VW_CALC_DEFAULTS,
    ...options,
  }
  const count = values.length

  if (count > 3) {
    throw new VwCalcError(
      `(${values.map(formatNumber).join(' ')}) | Maximum of 3 (three) values allowed.`
    )
  }

  if (count < 1) {
    throw new VwCalcError('At least 1 (one) value required.')
  }

  let minWidthPx = narrowWidth
  let maxWidthPx = wideWidth

  if (narrow) {
    minWidthPx = 0
    maxWidthPx = narrowWidth
  }

  // Not in the Sass source (which would emit an unusable Infinity value):
  // an empty scaling window has to be rejected up front at runtime
  if (!(maxWidthPx > minWidthPx)) {
    throw new VwCalcError(
      `${formatNumber(minWidthPx)} < ${formatNumber(maxWidthPx)} = false | {{wide-width}} must be greater than {{narrow-width}}.`
    )
  }

  if (count === 1) {
    const value = values[0]
    const proportionalMinPx = (minWidthPx * value) / maxWidthPx
    const minRem = remNumber(proportionalMinPx, baseFontSize)
    const maxRem = remNumber(value, baseFontSize)
    const fluid = fluidValue(minRem, maxRem, minWidthPx, maxWidthPx, baseFontSize)

    if (clamp && dynamic) {
      return { value: `clamp(${formatNumber(minRem)}rem, ${fluid}, ${formatNumber(maxRem)}rem)` }
    }

    if (clamp) {
      return {
        value: `${formatNumber(maxRem)}rem`,
        warning: `Unnecessary declaration: vw-calc(${formatNumber(value)}) === ${formatNumber(maxRem)}rem, use rem value directly instead.`,
      }
    }

    if (dynamic) {
      return { value: `max(${formatNumber(minRem)}rem, ${fluid})` }
    }

    return { value: `max(${formatNumber(maxRem)}rem, ${fluid})` }
  }

  const minValue = values[0]
  const maxValue = values[1]

  if (minValue > maxValue) {
    throw new VwCalcError(
      `${formatNumber(minValue)} < ${formatNumber(maxValue)} = false | {{max-value}} can't be lower than {{min-value}}.`
    )
  }

  if (count === 3) {
    const limitValue = values[2]

    if (maxValue > limitValue) {
      throw new VwCalcError(
        `${formatNumber(maxValue)} < ${formatNumber(limitValue)} = false | {{limit-value}} can't be lower than {{max-value}}.`
      )
    }

    if (minValue === maxValue) {
      throw new VwCalcError(
        `${formatNumber(minValue)} === ${formatNumber(maxValue)} | {{min-value}} cannot be equal to {{max-value}}.`
      )
    }

    const minRem = remNumber(minValue, baseFontSize)
    const maxRem = remNumber(maxValue, baseFontSize)
    const limitRem = remNumber(limitValue, baseFontSize)
    const fluid = fluidValue(minRem, maxRem, minWidthPx, maxWidthPx, baseFontSize)

    return { value: `clamp(${formatNumber(minRem)}rem, ${fluid}, ${formatNumber(limitRem)}rem)` }
  }

  if (minValue === maxValue) {
    throw new VwCalcError(
      `${formatNumber(minValue)} === ${formatNumber(maxValue)} | {{min-value}} cannot be equal to {{max-value}}.`
    )
  }

  const minRem = remNumber(minValue, baseFontSize)
  const maxRem = remNumber(maxValue, baseFontSize)
  const fluid = fluidValue(minRem, maxRem, minWidthPx, maxWidthPx, baseFontSize)

  if (clamp) {
    return { value: `clamp(${formatNumber(minRem)}rem, ${fluid}, ${formatNumber(maxRem)}rem)` }
  }

  return { value: `max(${formatNumber(minRem)}rem, ${fluid})` }
}
