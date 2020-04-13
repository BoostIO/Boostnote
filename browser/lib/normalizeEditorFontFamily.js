import consts from 'browser/lib/consts'
import isString from 'lodash/isString'

export default function normalizeEditorFontFamily(fontFamily) {
  const defaultEditorFontFamily = consts.DEFAULT_EDITOR_FONT_FAMILY
  return isString(fontFamily) && fontFamily.length > 0
    ? [fontFamily].concat(defaultEditorFontFamily).join(', ')
    : defaultEditorFontFamily.join(', ')
}
