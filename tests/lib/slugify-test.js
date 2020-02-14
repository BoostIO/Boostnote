import test from 'ava'
import slugify from 'browser/lib/slugify'

test('alphabet and digit', t => {
  const upperAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowerAlphabet = 'abcdefghijklmnopqrstuvwxyz'
  const digit = '0123456789'
  const testCase = upperAlphabet + lowerAlphabet + digit
  const decodeSlug = decodeURI(slugify(testCase))

  t.true(decodeSlug === testCase)
})

test('should delete unavailable symbols', t => {
  const availableSymbols = '_-'
  const testCase = availableSymbols + "][!'#$%&()*+,./:;<=>?@\\^{|}~`"
  const decodeSlug = decodeURI(slugify(testCase))

  t.true(decodeSlug === availableSymbols)
})

test('should convert from white spaces between words to hyphens', t => {
  const testCase = 'This is one'
  const expectedString = 'This-is-one'
  const decodeSlug = decodeURI(slugify(testCase))

  t.true(decodeSlug === expectedString)
})

test('should remove leading white spaces', t => {
  const testCase = '                   This is one'
  const expectedString = 'This-is-one'
  const decodeSlug = decodeURI(slugify(testCase))

  t.true(decodeSlug === expectedString)
})

test('should remove trailing white spaces', t => {
  const testCase = 'This is one                   '
  const expectedString = 'This-is-one'
  const decodeSlug = decodeURI(slugify(testCase))

  t.true(decodeSlug === expectedString)
})

test('2-byte charactor support', t => {
  const testCase = '菠萝芒果テストÀžƁƵ'
  const decodeSlug = decodeURI(slugify(testCase))

  t.true(decodeSlug === testCase)
})

test('emoji', t => {
  const testCase = '🌸'
  const decodeSlug = decodeURI(slugify(testCase))

  t.true(decodeSlug === testCase)
})
