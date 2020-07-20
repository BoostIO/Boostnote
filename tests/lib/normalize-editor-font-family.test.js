/**
 * @fileoverview Unit test for browser/lib/normalizeEditorFontFamily
 */
import normalizeEditorFontFamily from '../../browser/lib/normalizeEditorFontFamily'
import consts from '../../browser/lib/consts'
const defaultEditorFontFamily = consts.DEFAULT_EDITOR_FONT_FAMILY

test('normalizeEditorFontFamily() should return default font family (string[])', () => {
  expect(normalizeEditorFontFamily()).toBe(defaultEditorFontFamily.join(', '))
})

test('normalizeEditorFontFamily(["hoge", "huga"]) should return default font family connected with arg.', () => {
  const arg = 'font1, font2'
  expect(normalizeEditorFontFamily(arg)).toBe(
    `${arg}, ${defaultEditorFontFamily.join(', ')}`
  )
})
