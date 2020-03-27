/**
 * @fileoverview Unit test for browser/lib/normalizeEditorFontFamily
 */
import test from 'ava'
import normalizeEditorFontFamily from '../../browser/lib/normalizeEditorFontFamily'
import consts from '../../browser/lib/consts'
const defaultEditorFontFamily = consts.DEFAULT_EDITOR_FONT_FAMILY

test('normalizeEditorFontFamily() should return default font family (string[])', t => {
  t.is(normalizeEditorFontFamily(), defaultEditorFontFamily.join(', '))
})

test('normalizeEditorFontFamily(["hoge", "huga"]) should return default font family connected with arg.', t => {
  const arg = 'font1, font2'
  t.is(
    normalizeEditorFontFamily(arg),
    `${arg}, ${defaultEditorFontFamily.join(', ')}`
  )
})
