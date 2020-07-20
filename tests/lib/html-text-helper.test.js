/**
 * @fileoverview Unit test for browser/lib/htmlTextHelper
 */
const htmlTextHelper = require('browser/lib/htmlTextHelper')

// Unit test
test('htmlTextHelper#decodeEntities should return encoded text (string)', () => {
  // [input, expected]
  const testCases = [
    ['&lt;a href=', '<a href='],
    ['var test = &apos;test&apos;', "var test = 'test'"],
    [
      '&lt;a href=&apos;https://boostnote.io&apos;&gt;Boostnote',
      "<a href='https://boostnote.io'>Boostnote"
    ],
    ['&lt;\\\\?php\n var = &apos;hoge&apos;;', "<\\\\?php\n var = 'hoge';"],
    ['&amp;', '&'],
    ['a&#36;&apos;', "a\\$'"]
  ]

  testCases.forEach(testCase => {
    const [input, expected] = testCase
    expect(htmlTextHelper.decodeEntities(input)).toBe(expected)
  })
})

test('htmlTextHelper#decodeEntities() should return decoded text (string)', () => {
  // [input, expected]
  const testCases = [
    ['<a href=', '&lt;a href='],
    ["var test = 'test'", 'var test = &apos;test&apos;'],
    [
      "<a href='https://boostnote.io'>Boostnote",
      '&lt;a href=&apos;https://boostnote.io&apos;&gt;Boostnote'
    ],
    ["<?php\n var = 'hoge';", '&lt;&#63;php\n var = &apos;hoge&apos;;'],
    ["a$'", 'a&#36;&apos;']
  ]

  testCases.forEach(testCase => {
    const [input, expected] = testCase
    expect(htmlTextHelper.encodeEntities(input)).toBe(expected)
  })
})

// Integration test
test(() => {
  const testCases = [
    "var test = 'test'",
    "<a href='https://boostnote.io'>Boostnote",
    "<Component styleName='test' />"
  ]

  testCases.forEach(testCase => {
    const encodedText = htmlTextHelper.encodeEntities(testCase)
    const decodedText = htmlTextHelper.decodeEntities(encodedText)
    expect(decodedText).toBe(testCase)
  })
})
