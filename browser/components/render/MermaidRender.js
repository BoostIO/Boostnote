import mermaidAPI from 'mermaid'
import uiThemes from 'browser/lib/ui-themes'

// fixes bad styling in the mermaid dark theme
const darkThemeStyling = `
.loopText tspan {
  fill: white;
}`

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

function getId() {
  const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = 'm-'
  for (let i = 0; i < 7; i++) {
    id += pool[getRandomInt(0, 16)]
  }
  return id
}

function render(element, content, theme, enableHTMLLabel) {
  try {
    const height = element.attributes.getNamedItem('data-height')
    const isPredefined = height && height.value !== 'undefined'

    if (isPredefined) {
      element.style.height = height.value + 'vh'
    }

    const isDarkTheme = uiThemes.some(
      item => item.name === theme && item.isDark
    )

    mermaidAPI.initialize({
      theme: isDarkTheme ? 'dark' : 'default',
      themeCSS: isDarkTheme ? darkThemeStyling : '',
      flowchart: {
        htmlLabels: enableHTMLLabel
      },
      gantt: {
        useWidth: element.clientWidth
      }
    })

    mermaidAPI.render(getId(), content, svgGraph => {
      element.innerHTML = svgGraph

      if (!isPredefined) {
        const el = element.firstChild
        const viewBox = el.getAttribute('viewBox').split(' ')

        let ratio = viewBox[2] / viewBox[3]

        if (el.style.maxWidth) {
          const maxWidth = parseFloat(el.style.maxWidth)

          ratio *= el.parentNode.clientWidth / maxWidth
        }

        el.setAttribute('ratio', ratio)
        el.setAttribute('height', el.parentNode.clientWidth / ratio)
        console.log(el)
      }
    })
  } catch (e) {
    element.className = 'mermaid-error'
    element.innerHTML = 'mermaid diagram parse error: ' + e.message
  }
}

export default render
