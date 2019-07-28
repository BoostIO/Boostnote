import mermaidAPI from 'mermaid'

// fixes bad styling in the mermaid dark theme
const darkThemeStyling = `
.loopText tspan {
  fill: white;
}`

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

function getId () {
  const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = 'm-'
  for (let i = 0; i < 7; i++) {
    id += pool[getRandomInt(0, 16)]
  }
  return id
}

function render (element, content, theme, enableHTMLLabel) {
  try {
    const height = element.attributes.getNamedItem('data-height')
    if (height && height.value !== 'undefined') {
      element.style.height = height.value + 'vh'
    }
    const isDarkTheme = theme === 'dark' || theme === 'solarized-dark' || theme === 'monokai' || theme === 'dracula'
    mermaidAPI.initialize({
      theme: isDarkTheme ? 'dark' : 'default',
      themeCSS: isDarkTheme ? darkThemeStyling : '',
      useMaxWidth: false,
      flowchart: { htmlLabels: enableHTMLLabel }
    })
    mermaidAPI.render(getId(), content, (svgGraph) => {
      element.innerHTML = svgGraph
    })
  } catch (e) {
    element.className = 'mermaid-error'
    element.innerHTML = 'mermaid diagram parse error: ' + e.message
  }
}

export default render
