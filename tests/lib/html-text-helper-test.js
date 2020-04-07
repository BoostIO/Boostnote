/**
 * @fileoverview Unit test for browser/lib/htmlTextHelper
 */
const test = require('ava')
const htmlTextHelper = require('browser/lib/htmlTextHelper')

// Unit test
test('htmlTextHelper#decodeEntities should return encoded text (string)', t => {
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
    t.is(
      htmlTextHelper.decodeEntities(input),
      expected,
      `Test for decodeEntities() input: ${input} expected: ${expected}`
    )
  })
})

test('htmlTextHelper#decodeEntities() should return decoded text (string)', t => {
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
    t.is(
      htmlTextHelper.encodeEntities(input),
      expected,
      `Test for encodeEntities() input: ${input} expected: ${expected}`
    )
  })
})

// Integration test
test(t => {
  const testCases = [
    "var test = 'test'",
    "<a href='https://boostnote.io'>Boostnote",
    "<Component styleName='test' />"
  ]

  testCases.forEach(testCase => {
    const encodedText = htmlTextHelper.encodeEntities(testCase)
    const decodedText = htmlTextHelper.decodeEntities(encodedText)
    t.is(
      decodedText,
      testCase,
      'Integration test through encodedText() and decodedText()'
    )
  })
})
