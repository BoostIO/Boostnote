/**
 * @fileoverview Unit test for browser/lib/findTitle
 */

const { findNoteTitle } = require('browser/lib/findNoteTitle')

// Unit test
test('findNoteTitle#find  should return a correct title (string)', () => {
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
    expect(findNoteTitle(input, false)).toBe(expected)
  })
})

test('findNoteTitle#find  should ignore front matter when enableFrontMatterTitle=false', () => {
  // [input, expected]
  const testCases = [
    ['---\nlayout: test\ntitle:  hoge hoge hoge  \n---\n# fuga', '# fuga'],
    ['---\ntitle:hoge\n---\n# fuga', '# fuga'],
    ['title: fuga\n# hoge', '# hoge']
  ]

  testCases.forEach(testCase => {
    const [input, expected] = testCase
    expect(findNoteTitle(input, false)).toBe(expected)
  })
})

test('findNoteTitle#find  should respect front matter when enableFrontMatterTitle=true', () => {
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
    expect(findNoteTitle(input, true)).toBe(expected)
  })
})

test('findNoteTitle#find  should respect frontMatterTitleField when provided', () => {
  // [input, expected]
  const testCases = [
    ['---\ntitle: hoge\n---\n# fuga', '# fuga'],
    ['---\ncustom: hoge\n---\n# fuga', 'hoge']
  ]

  testCases.forEach(testCase => {
    const [input, expected] = testCase
    expect(findNoteTitle(input, true, 'custom')).toBe(expected)
  })
})
