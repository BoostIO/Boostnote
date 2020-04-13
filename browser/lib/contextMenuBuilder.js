import i18n from 'browser/lib/i18n'
import fs from 'fs'

const { remote } = require('electron')
const { Menu } = remote.require('electron')
const { clipboard } = remote.require('electron')
const { shell } = remote.require('electron')
const spellcheck = require('./spellcheck')
const uri2path = require('file-uri-to-path')

/**
 * Creates the context menu that is shown when there is a right click in the editor of a (not-snippet) note.
 * If the word is does not contains a spelling error (determined by the 'error style'), no suggestions for corrections are requested
 * => they are not visible in the context menu
 * @param editor CodeMirror editor
 * @param {MouseEvent} event that has triggered the creation of the context menu
 * @returns {Electron.Menu} The created electron context menu
 */
const buildEditorContextMenu = function(editor, event) {
  if (
    editor == null ||
    event == null ||
    event.pageX == null ||
    event.pageY == null
  ) {
    return null
  }
  const cursor = editor.coordsChar({ left: event.pageX, top: event.pageY })
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
  const template = [
    {
      role: 'cut'
    },
    {
      role: 'copy'
    },
    {
      role: 'paste'
    },
    {
      role: 'selectall'
    }
  ]

  if (selection.isMisspelled) {
    const suggestions = selection.spellingSuggestions
    template.unshift.apply(
      template,
      suggestions
        .map(function(suggestion) {
          return {
            label: suggestion,
            click: function(suggestion) {
              if (editor != null) {
                editor.replaceRange(
                  suggestion.label,
                  wordRange.anchor,
                  wordRange.head
                )
              }
            }
          }
        })
        .concat({
          type: 'separator'
        })
    )
  }
  return Menu.buildFromTemplate(template)
}

/**
 * Creates the context menu that is shown when there is a right click Markdown preview of a (not-snippet) note.
 * @param {MarkdownPreview} markdownPreview
 * @param {MouseEvent} event that has triggered the creation of the context menu
 * @returns {Electron.Menu} The created electron context menu
 */
const buildMarkdownPreviewContextMenu = function(markdownPreview, event) {
  if (
    markdownPreview == null ||
    event == null ||
    event.pageX == null ||
    event.pageY == null
  ) {
    return null
  }

  // Default context menu inclusions
  const template = [
    {
      role: 'copy'
    },
    {
      role: 'selectall'
    }
  ]

  if (
    event.target.tagName.toLowerCase() === 'a' &&
    event.target.getAttribute('href')
  ) {
    // Link opener for files on the local system pointed to by href
    const href = event.target.href
    const isLocalFile = href.startsWith('file:')
    if (isLocalFile) {
      const absPath = uri2path(href)
      try {
        if (fs.lstatSync(absPath).isFile()) {
          template.push({
            label: i18n.__('Show in explorer'),
            click: e => shell.showItemInFolder(absPath)
          })
        }
      } catch (e) {
        console.log(
          'Error while evaluating if the file is locally available',
          e
        )
      }
    }

    // Add option to context menu to copy url
    template.push({
      label: i18n.__('Copy Url'),
      click: e => clipboard.writeText(href)
    })
  }
  return Menu.buildFromTemplate(template)
}

module.exports = {
  buildEditorContextMenu: buildEditorContextMenu,
  buildMarkdownPreviewContextMenu: buildMarkdownPreviewContextMenu
}
