const initSite = () => {
  const TARGET_INPUT = document.querySelectorAll('.js-target-input')

  const updateValues = () => {
    TARGET_INPUT.forEach((target) => {
      const TARGET = target?.getAttribute('data-target')
      const TARGET_STYLED_OUTPUT = document.querySelectorAll(`.js-target-styled-output[data-target="${TARGET}"]`)
      const TARGET_COMPUTED_OUTPUT = document.querySelectorAll(`.js-target-computed-output[data-target="${TARGET}"]`)
    
      if (
        !TARGET_STYLED_OUTPUT ||
        !TARGET_COMPUTED_OUTPUT
      ) {
        return
      }
      
      const CSS_STYLE_RULES = document.styleSheets[0].cssRules

      for (let i = 0; i < CSS_STYLE_RULES.length; i++) {
        const CSS_STYLE_RULE = CSS_STYLE_RULES[i]
        
        if (!(CSS_STYLE_RULE instanceof CSSStyleRule)) {
          return
        }

        if (CSS_STYLE_RULE.selectorText === `.${TARGET}`) {
          TARGET_STYLED_OUTPUT.forEach((targetStyledOutput) => {
            const targetPropertyAttr = targetStyledOutput.getAttribute('data-property')
            targetPropertyAttr ?
              targetStyledOutput.textContent = CSS_STYLE_RULE.style[targetPropertyAttr] : null
          })
        }
      }
      
      TARGET_COMPUTED_OUTPUT.forEach((targetComputedOutput) => {
        const targetPropertyAttr = targetComputedOutput.getAttribute('data-property')
        targetPropertyAttr ?
          targetComputedOutput.textContent = getComputedStyle(target)[targetPropertyAttr] : null
      })
    })
  }

  updateValues()

  window.addEventListener('resize', updateValues)
}

initSite()