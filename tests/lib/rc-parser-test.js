const test = require('ava')
const path = require('path')
const { parse } = require('browser/lib/RcParser')

// Unit test
test('RcParser should return a json object', t => {
  const validJson = { 'editor': { 'keyMap': 'vim', 'switchPreview': 'BLUR', 'theme': 'monokai' }, 'hotkey': { 'toggleMain': 'Control + L' }, 'listWidth': 135, 'navWidth': 135 }
  const allJson = { 'amaEnabled': true, 'editor': { 'fontFamily': 'Monaco, Consolas', 'fontSize': '14', 'indentSize': '2', 'indentType': 'space', 'keyMap': 'vim', 'switchPreview': 'BLUR', 'theme': 'monokai' }, 'hotkey': { 'toggleFinder': 'Cmd + Alt + S', 'toggleMain': 'Cmd + Alt + L' }, 'isSideNavFolded': false, 'listStyle': 'DEFAULT', 'listWidth': 174, 'navWidth': 200, 'preview': { 'codeBlockTheme': 'dracula', 'fontFamily': 'Lato', 'fontSize': '14', 'lineNumber': true }, 'sortBy': 'UPDATED_AT', 'ui': { 'defaultNote': 'ALWAYS_ASK', 'disableDirectWrite': false, 'theme': 'default' }, 'zoom': 1 }

  // [input, expected]
  const validTestCases = [
    ['.boostnoterc.valid', validJson],
    ['.boostnoterc.all', allJson]
  ]

  const invalidTestCases = [
    ['.boostnoterc.invalid', {}]
  ]

  validTestCases.forEach(validTestCase => {
    const [input, expected] = validTestCase
    t.is(parse(filePath(input)).editor.keyMap, expected.editor.keyMap, `Test for getTodoStatus() input: ${input} expected: ${expected.keyMap}`)
  })

  invalidTestCases.forEach(invalidTestCase => {
    const [input, expected] = invalidTestCase
    t.is(parse(filePath(input)).editor, expected.editor, `Test for getTodoStatus() input: ${input} expected: ${expected.editor}`)
  })
})

function filePath (filename) {
  return path.join('boostnoterc', filename)
}
