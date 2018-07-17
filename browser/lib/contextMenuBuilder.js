const {remote} = require('electron')
const {Menu} = remote.require('electron')
const spellcheck = require('./spellcheck')

/**
 * Creates the context menu that is shown when there is a right click in the editor of a (not-snippet) note.
 * If the word is does not contains a spelling error (determined by the 'error style', no suggestions for corrections are requested
 * => they are not visible in the context menu
 * @param editor CodeMirror editor
 * @param {MouseEvent} event that has triggered the creation of the context menu
 * @returns {Electron.Menu} The created electron context menu
 */
const buildEditorContextMenu = function (editor, event) {
  if (editor == null || event == null || event.pageX == null || event.pageY == null) {
    return null
  }
  const cursor = editor.coordsChar({left: event.pageX, top: event.pageY})
  const wordRange = editor.findWordAt(cursor)
  const word = editor.getRange(wordRange.anchor, wordRange.head)
  const existingMarks = editor.findMarks(wordRange.anchor, wordRange.head) || []
  let isMisspelled = false
  for (const mark of existingMarks) {
    if (mark.className === spellcheck.getCSSClassName()) {
      isMisspelled = true
      break
    }
  }
  let suggestion = []
  if (isMisspelled) {
    suggestion = spellcheck.getSpellingSuggestion(word)
  }

  const selection = {
    isMisspelled: isMisspelled,
    spellingSuggestions: suggestion
  }
  const template = [{
    role: 'cut'
  }, {
    role: 'copy'
  }, {
    role: 'paste'
  }, {
    role: 'selectall'
  }]

  if (selection.isMisspelled) {
    const suggestions = selection.spellingSuggestions
    template.unshift.apply(template, suggestions.map(function (suggestion) {
      return {
        label: suggestion,
        click: function (suggestion) {
          if (editor != null) {
            editor.replaceRange(suggestion.label, wordRange.anchor, wordRange.head)
          }
        }
      }
    }).concat({
      type: 'separator'
    }))
  }
  return Menu.buildFromTemplate(template)
}

module.exports = buildEditorContextMenu
