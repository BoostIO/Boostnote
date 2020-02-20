import CSSModules from 'react-css-modules'

export default function(component, styles) {
  return CSSModules(component, styles, { handleNotFoundStyleName: 'log' })
}
