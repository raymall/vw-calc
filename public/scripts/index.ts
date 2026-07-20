import { vwCalc, VwCalcError, VW_CALC_DEFAULTS, type VwCalcOptions } from './vw-calc'

declare global {
  interface Window {
    /** Exposed for console experiments: window.vwCalc([16, 32], { clamp: true }) */
    vwCalc: typeof vwCalc
  }
}

/** Viewport distance (px) to a breakpoint that still counts as "at" it */
const AT_TOLERANCE = 4

/** Viewport distance (px) to a breakpoint that counts as "approaching" it */
const NEAR_TOLERANCE = 64

/** Proximity of the viewport to a breakpoint guide */
type GuideState = 'at' | 'near' | 'beyond' | 'below'

const STATE_LABELS: Record<GuideState, string> = {
  at: 'at breakpoint',
  near: 'approaching',
  beyond: 'viewport beyond',
  below: 'viewport below',
}

const rootFontSize = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize) || VW_CALC_DEFAULTS.baseFontSize

const readNumber = (input: HTMLInputElement): number | null => {
  const raw = input.value.trim()

  if (raw === '') {
    return null
  }

  const value = Number(raw)

  return Number.isFinite(value) ? value : null
}

const autosize = (input: HTMLInputElement): void => {
  input.style.width = `calc(${Math.max(input.value.length, 1)}ch + 0.75em)`
}

/** The `, $clamp: true, …` tail shown after the positional values in each call */
const namedArgsSuffix = (options: Required<VwCalcOptions>): string => {
  const parts: string[] = []

  if (options.narrowWidth !== VW_CALC_DEFAULTS.narrowWidth) {
    parts.push(`$narrow-width: ${options.narrowWidth}`)
  }

  if (options.wideWidth !== VW_CALC_DEFAULTS.wideWidth) {
    parts.push(`$wide-width: ${options.wideWidth}`)
  }

  if (options.narrow) {
    parts.push('$narrow: true')
  }

  if (options.clamp) {
    parts.push('$clamp: true')
  }

  if (options.dynamic) {
    parts.push('$dynamic: true')
  }

  return parts.length > 0 ? `, ${parts.join(', ')}` : ''
}

const initExample = (section: HTMLElement): (() => void) | null => {
  const demo = section.querySelector<HTMLElement>('.js-demo')

  if (!demo) {
    return null
  }

  const argInputs = Array.from(section.querySelectorAll<HTMLInputElement>('.js-arg'))
  const declLines = Array.from(section.querySelectorAll<HTMLElement>('.js-decl'))

  const readOptions = (): Required<VwCalcOptions> => {
    const options = { ...VW_CALC_DEFAULTS }

    argInputs.forEach((input) => {
      const key = input.dataset.arg

      if (key === 'narrow' || key === 'clamp' || key === 'dynamic') {
        options[key] = input.checked
      } else if (key === 'narrowWidth' || key === 'wideWidth') {
        options[key] = readNumber(input) ?? VW_CALC_DEFAULTS[key]
      }
    })

    return options
  }

  // The message element stays in the DOM (and the accessibility tree) at all
  // times — a role="status" region that appears already populated is skipped
  // by most screen readers, so only its text may change. Rewriting identical
  // text still queues a fresh announcement, hence the early return.
  const setMessage = (property: string, kind: 'error' | 'warn' | 'note' | null, text = ''): void => {
    const message = section.querySelector<HTMLElement>(`.js-message[data-decl="${property}"]`)

    if (!message) {
      return
    }

    const nextText = kind === null ? '' : text

    if (message.textContent === nextText && message.dataset.kind === (kind ?? undefined)) {
      return
    }

    if (kind === null) {
      message.textContent = ''
      delete message.dataset.kind
    } else {
      message.dataset.kind = kind
      message.textContent = nextText
    }
  }

  const updateComputed = (): void => {
    const computedStyle = getComputedStyle(demo)

    section.querySelectorAll<HTMLElement>('.js-computed').forEach((output) => {
      const property = output.dataset.decl

      if (property) {
        output.textContent = computedStyle.getPropertyValue(property) || '–'
      }
    })
  }

  const update = (): void => {
    const options = readOptions()
    const suffix = namedArgsSuffix(options)

    declLines.forEach((line) => {
      const property = line.dataset.decl

      if (!property) {
        return
      }

      const argsSlot = line.querySelector<HTMLElement>('.js-args')

      if (argsSlot) {
        argsSlot.textContent = suffix
      }

      const values = Array.from(line.querySelectorAll<HTMLInputElement>('.js-val'))
        .map(readNumber)
        .filter((value): value is number => value !== null)
      const styled = section.querySelector<HTMLElement>(`.js-styled[data-decl="${property}"]`)

      try {
        const result = vwCalc(values, options)

        demo.style.setProperty(property, result.value)
        line.removeAttribute('data-invalid')

        if (styled) {
          styled.textContent = result.value
        }

        if (result.warning) {
          setMessage(property, 'warn', result.warning)
        } else if (options.dynamic && values.length > 1) {
          setMessage(property, 'note', '$dynamic is ignored when 2 or 3 values are passed.')
        } else {
          setMessage(property, null)
        }
      } catch (error) {
        if (!(error instanceof VwCalcError)) {
          throw error
        }

        line.setAttribute('data-invalid', '')

        if (styled) {
          styled.textContent = '–'
        }

        setMessage(property, 'error', error.message)
      }
    })

    updateComputed()
  }

  section.addEventListener('input', (event) => {
    const target = event.target

    if (target instanceof HTMLInputElement && target.type === 'number') {
      autosize(target)
    }

    update()
  })

  section.querySelectorAll<HTMLInputElement>('input[type="number"]').forEach(autosize)
  update()

  return updateComputed
}

const initPlayground = (): void => {
  const computedUpdaters = Array.from(document.querySelectorAll<HTMLElement>('.js-example'))
    .map(initExample)
    .filter((updater): updater is () => void => updater !== null)
  const guides = Array.from(document.querySelectorAll<HTMLElement>('.js-guide'))
  const viewportOutput = document.querySelector<HTMLElement>('.js-viewport')

  const updateViewportUi = (): void => {
    const width = window.innerWidth

    if (viewportOutput) {
      viewportOutput.textContent = String(Math.round(width))
    }

    // Guides are rem-sized, so their effective px position follows the
    // user's base font-size preference — the state math has to as well
    const scale = rootFontSize() / VW_CALC_DEFAULTS.baseFontSize

    guides.forEach((guide) => {
      const breakpoint = Number(guide.dataset.breakpoint) * scale

      if (!Number.isFinite(breakpoint) || breakpoint <= 0) {
        return
      }

      const delta = width - breakpoint
      const state =
        Math.abs(delta) <= AT_TOLERANCE
          ? 'at'
          : Math.abs(delta) <= NEAR_TOLERANCE
            ? 'near'
            : delta > 0
              ? 'beyond'
              : 'below'

      guide.dataset.state = state

      const stateLabel = guide.querySelector<HTMLElement>('.js-guide-state')

      if (stateLabel) {
        stateLabel.textContent = STATE_LABELS[state]
      }
    })
  }

  const handleViewportChange = (): void => {
    updateViewportUi()
    computedUpdaters.forEach((updateComputed) => updateComputed())
  }

  updateViewportUi()
  window.addEventListener('resize', handleViewportChange)

  // Some environments (device emulation, split panes) change the viewport
  // without firing a window resize event — observe the root element too
  if ('ResizeObserver' in window) {
    new ResizeObserver(handleViewportChange).observe(document.documentElement)
  }
}

initPlayground()
window.vwCalc = vwCalc
