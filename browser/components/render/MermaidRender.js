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
  var pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  var id = 'm-'
  for (var i = 0; i < 7; i++) {
    id += pool[getRandomInt(0, 16)]
  }
  return id
}

function render (element, content, theme) {
  try {
    let isDarkTheme = theme === 'dark' || theme === 'solarized-dark' || theme === 'monokai'
    mermaidAPI.initialize({
      theme: isDarkTheme ? 'dark' : 'default',
      themeCSS: isDarkTheme ? darkThemeStyling : ''
    })
    mermaidAPI.render(getId(), content, (svgGraph) => {
      element.innerHTML = svgGraph
      element.style.height = element.attributes.getNamedItem('data-height').value + 'vh'
    })
  } catch (e) {
    console.error(e)
    element.className = 'mermaid-error'
    element.innerHTML = 'mermaid diagram parse error: ' + e.message
  }
}

export default render
