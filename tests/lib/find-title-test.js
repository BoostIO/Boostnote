/**
 * @fileoverview Unit test for browser/lib/findTitle
 */

const test = require('ava')
const { findNoteTitle } = require('browser/lib/findNoteTitle')

// Unit test
test('findNoteTitle#find  should return a correct title (string)', t => {
  // [input, expected]
  const testCases = [
    ['# hoge\nfuga', '# hoge'],
    ['# hoge_hoge_hoge', '# hoge_hoge_hoge'],
    ['hoge\n====\nfuga', 'hoge'],
    ['====', '===='],
    ['```\n# hoge\n```', '```'],
    ['hoge', 'hoge'],
    ['---\nlayout: test\n---\n # hoge', '# hoge']
  ]

  testCases.forEach(testCase => {
    const [input, expected] = testCase
    t.is(
      findNoteTitle(input, false),
      expected,
      `Test for find() input: ${input} expected: ${expected}`
    )
  })
})

test('findNoteTitle#find  should ignore front matter when enableFrontMatterTitle=false', t => {
  // [input, expected]
  const testCases = [
    ['---\nlayout: test\ntitle:  hoge hoge hoge  \n---\n# fuga', '# fuga'],
    ['---\ntitle:hoge\n---\n# fuga', '# fuga'],
    ['title: fuga\n# hoge', '# hoge']
  ]

  testCases.forEach(testCase => {
    const [input, expected] = testCase
    t.is(
      findNoteTitle(input, false),
      expected,
      `Test for find() input: ${input} expected: ${expected}`
    )
  })
})

test('findNoteTitle#find  should respect front matter when enableFrontMatterTitle=true', t => {
  // [input, expected]
  const testCases = [
    [
      '---\nlayout: test\ntitle:  hoge hoge hoge  \n---\n# fuga',
      'hoge hoge hoge'
    ],
    ['---\ntitle:hoge\n---\n# fuga', 'hoge'],
    ['title: fuga\n# hoge', '# hoge']
  ]

  testCases.forEach(testCase => {
    const [input, expected] = testCase
    t.is(
      findNoteTitle(input, true),
      expected,
      `Test for find() input: ${input} expected: ${expected}`
    )
  })
})

test('findNoteTitle#find  should respect frontMatterTitleField when provided', t => {
  // [input, expected]
  const testCases = [
    ['---\ntitle: hoge\n---\n# fuga', '# fuga'],
    ['---\ncustom: hoge\n---\n# fuga', 'hoge']
  ]

  testCases.forEach(testCase => {
    const [input, expected] = testCase
    t.is(
      findNoteTitle(input, true, 'custom'),
      expected,
      `Test for find() input: ${input} expected: ${expected}`
    )
  })
})
