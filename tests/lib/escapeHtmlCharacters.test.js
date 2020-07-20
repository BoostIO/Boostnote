const { escapeHtmlCharacters } = require('browser/lib/utils')

test('escapeHtmlCharacters should return the original string if nothing needed to escape', () => {
  const input = 'Nothing to be escaped'
  const expected = 'Nothing to be escaped'
  const actual = escapeHtmlCharacters(input)
  expect(actual).toBe(expected)
})

test('escapeHtmlCharacters should skip code block if that option is enabled', () => {
  const input = `    <no escape>
<escapeMe>`
  const expected = `    <no escape>
&lt;escapeMe&gt;`
  const actual = escapeHtmlCharacters(input, { detectCodeBlock: true })
  expect(actual).toBe(expected)
})

test('escapeHtmlCharacters should NOT skip character not in code block but start with 4 spaces', () => {
  const input = '4 spaces    &'
  const expected = '4 spaces    &amp;'
  const actual = escapeHtmlCharacters(input, { detectCodeBlock: true })
  expect(actual).toBe(expected)
})

test('escapeHtmlCharacters should NOT skip code block if that option is NOT enabled', () => {
  const input = `    <no escape>
<escapeMe>`
  const expected = `    &lt;no escape&gt;
&lt;escapeMe&gt;`
  const actual = escapeHtmlCharacters(input)
  expect(actual).toBe(expected)
})

test("escapeHtmlCharacters should NOT escape & character if it's a part of an escaped character", () => {
  const input = 'Do not escape &amp; or &quot; but do escape &'
  const expected = 'Do not escape &amp; or &quot; but do escape &amp;'
  const actual = escapeHtmlCharacters(input)
  expect(actual).toBe(expected)
})

test('escapeHtmlCharacters should skip char if in code block', () => {
  const input = `
\`\`\`
<dontescapeme>
\`\`\`
das<das>dasd
dasdasdasd
\`\`\`
<dontescapeme>
\`\`\`
`
  const expected = `
\`\`\`
<dontescapeme>
\`\`\`
das&lt;das&gt;dasd
dasdasdasd
\`\`\`
<dontescapeme>
\`\`\`
`
  const actual = escapeHtmlCharacters(input, { detectCodeBlock: true })
  expect(actual).toBe(expected)
})

test('escapeHtmlCharacters should return the correct result', () => {
  const input = '& < > " \''
  const expected = '&amp; &lt; &gt; &quot; &#39;'
  const actual = escapeHtmlCharacters(input)
  expect(actual).toBe(expected)
})
