import slugify from 'browser/lib/slugify'

test('alphabet and digit', () => {
  const upperAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowerAlphabet = 'abcdefghijklmnopqrstuvwxyz'
  const digit = '0123456789'
  const testCase = upperAlphabet + lowerAlphabet + digit
  const decodeSlug = decodeURI(slugify(testCase))

  expect(decodeSlug === testCase).toBe(true)
})

test('should delete unavailable symbols', () => {
  const availableSymbols = '_-'
  const testCase = availableSymbols + "][!'#$%&()*+,./:;<=>?@\\^{|}~`"
  const decodeSlug = decodeURI(slugify(testCase))

  expect(decodeSlug === availableSymbols).toBe(true)
})

test('should convert from white spaces between words to hyphens', () => {
  const testCase = 'This is one'
  const expectedString = 'This-is-one'
  const decodeSlug = decodeURI(slugify(testCase))

  expect(decodeSlug === expectedString).toBe(true)
})

test('should remove leading white spaces', () => {
  const testCase = '                   This is one'
  const expectedString = 'This-is-one'
  const decodeSlug = decodeURI(slugify(testCase))

  expect(decodeSlug === expectedString).toBe(true)
})

test('should remove trailing white spaces', () => {
  const testCase = 'This is one                   '
  const expectedString = 'This-is-one'
  const decodeSlug = decodeURI(slugify(testCase))

  expect(decodeSlug === expectedString).toBe(true)
})

test('2-byte charactor support', () => {
  const testCase = '菠萝芒果テストÀžƁƵ'
  const decodeSlug = decodeURI(slugify(testCase))

  expect(decodeSlug === testCase).toBe(true)
})

test('emoji', () => {
  const testCase = '🌸'
  const decodeSlug = decodeURI(slugify(testCase))

  expect(decodeSlug === testCase).toBe(true)
})
