import isString from 'lodash/isString'

export default function normalizeBackgroundImage (backgroundPath) {
  const defaultEditorBackground = 'none'
  let value = isString(backgroundPath) && backgroundPath.trim().length > 0
    ? 'url(' + backgroundPath + ')'
    : defaultEditorBackground
  return value
}
