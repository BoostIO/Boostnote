let menuBuilderParameter
jest.mock('electron', () => {
  return {
    remote: {
      require: jest.fn(() => {
        return {
          Menu: {
            buildFromTemplate: jest.fn(param => {
              menuBuilderParameter = param
            })
          }
        }
      })
    }
  }
})

const spellcheck = require('browser/lib/spellcheck')
const buildEditorContextMenu = require('browser/lib/contextMenuBuilder')
  .buildEditorContextMenu
const buildMarkdownPreviewContextMenu = require('browser/lib/contextMenuBuilder')
  .buildMarkdownPreviewContextMenu

beforeEach(() => {
  menuBuilderParameter = null
})

// Editor Context Menu
it('should make sure that no context menu is build if the passed editor instance was null', function() {
  const event = {
    pageX: 12,
    pageY: 12
  }
  buildEditorContextMenu(null, event)
  expect(menuBuilderParameter).toEqual(null)
})

it('should make sure that word suggestions are only requested if the word contained a typo', function() {
  spellcheck.getSpellingSuggestion = jest.fn()
  const editor = jest.fn()
  editor.coordsChar = jest.fn()
  editor.findWordAt = jest.fn(() => {
    return { anchor: {}, head: {} }
  })
  editor.getRange = jest.fn()
  editor.findMarks = jest.fn(() => [])
  const event = {
    pageX: 12,
    pageY: 12
  }
  const expectedMenuParameter = [
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { role: 'selectall' }
  ]
  buildEditorContextMenu(editor, event)
  expect(menuBuilderParameter).toEqual(expectedMenuParameter)
  expect(spellcheck.getSpellingSuggestion).not.toHaveBeenCalled()
})

it('should make sure that word suggestions are only requested if the word contained a typo and no other mark', function() {
  spellcheck.getSpellingSuggestion = jest.fn()
  spellcheck.getCSSClassName = jest.fn(() => 'dummyErrorClassName')
  const editor = jest.fn()
  editor.coordsChar = jest.fn()
  editor.findWordAt = jest.fn(() => {
    return { anchor: {}, head: {} }
  })
  editor.getRange = jest.fn()
  const dummyMarks = [{ className: 'someStupidClassName' }]
  editor.findMarks = jest.fn(() => dummyMarks)
  const event = {
    pageX: 12,
    pageY: 12
  }
  const expectedMenuParameter = [
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { role: 'selectall' }
  ]
  buildEditorContextMenu(editor, event)
  expect(menuBuilderParameter).toEqual(expectedMenuParameter)
  expect(spellcheck.getSpellingSuggestion).not.toHaveBeenCalled()
})

it('should make sure that word suggestions calls the right editor functions', function() {
  spellcheck.getSpellingSuggestion = jest.fn()
  spellcheck.getCSSClassName = jest.fn(() => 'dummyErrorClassName')
  const dummyCursor = { dummy: 'dummy' }
  const dummyRange = { anchor: { test: 'test' }, head: { test2: 'test2' } }
  const editor = jest.fn()
  editor.coordsChar = jest.fn(() => dummyCursor)
  editor.findWordAt = jest.fn(() => dummyRange)
  editor.getRange = jest.fn()
  const dummyMarks = [{ className: 'someStupidClassName' }]
  editor.findMarks = jest.fn(() => dummyMarks)
  const event = {
    pageX: 12,
    pageY: 21
  }

  const expectedCoordsCharCall = { left: event.pageX, top: event.pageY }

  buildEditorContextMenu(editor, event)

  expect(editor.coordsChar).toHaveBeenCalledWith(expectedCoordsCharCall)
  expect(editor.findWordAt).toHaveBeenCalledWith(dummyCursor)
  expect(editor.getRange).toHaveBeenCalledWith(
    dummyRange.anchor,
    dummyRange.head
  )
})

it('should make sure that word suggestions creates a correct menu if there was an error', function() {
  const suggestions = ['test1', 'test2', 'Pustekuchen']
  const errorClassName = 'errorCSS'
  const wordToCorrect = 'pustekuchen'
  const dummyMarks = [{ className: errorClassName }]
  spellcheck.getSpellingSuggestion = jest.fn(() => suggestions)
  spellcheck.getCSSClassName = jest.fn(() => errorClassName)
  const editor = jest.fn()
  editor.coordsChar = jest.fn()
  editor.findWordAt = jest.fn(() => {
    return { anchor: {}, head: {} }
  })
  editor.getRange = jest.fn(() => wordToCorrect)
  editor.findMarks = jest.fn(() => [])

  editor.findMarks = jest.fn(() => dummyMarks)
  const event = {
    pageX: 12,
    pageY: 12
  }
  buildEditorContextMenu(editor, event)
  expect(menuBuilderParameter[0].label).toEqual(suggestions[0])
  expect(menuBuilderParameter[0].click).not.toBeNull()
  expect(menuBuilderParameter[1].label).toEqual(suggestions[1])
  expect(menuBuilderParameter[1].click).not.toBeNull()
  expect(menuBuilderParameter[2].label).toEqual(suggestions[2])
  expect(menuBuilderParameter[2].click).not.toBeNull()
  expect(menuBuilderParameter[3].type).toEqual('separator')
  expect(menuBuilderParameter[4].role).toEqual('cut')
  expect(menuBuilderParameter[5].role).toEqual('copy')
  expect(menuBuilderParameter[6].role).toEqual('paste')
  expect(menuBuilderParameter[7].role).toEqual('selectall')
  expect(spellcheck.getSpellingSuggestion).toHaveBeenCalledWith(wordToCorrect)
})

// Markdown Preview Context Menu
it('should make sure that no context menu is built if the Markdown Preview instance was null', function() {
  const event = {
    pageX: 12,
    pageY: 12
  }
  buildMarkdownPreviewContextMenu(null, event)
  expect(menuBuilderParameter).toEqual(null)
})
