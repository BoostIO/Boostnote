import styles from '../components/CodeEditor.styl'
import i18n from 'browser/lib/i18n'

const Typo = require('typo-js')

const CSS_ERROR_CLASS = 'codeEditor-typo'
const SPELLCHECK_DISABLED = 'NONE'
const DICTIONARY_PATH = '../dictionaries'
let dictionary = null

function getAvailableDictionaries () {
  return [
    {label: i18n.__('Disabled'), value: SPELLCHECK_DISABLED},
    {label: i18n.__('English'), value: 'en_GB'},
    {label: i18n.__('German'), value: 'de_DE'},
    {label: i18n.__('French'), value: 'fr_FR'}
  ]
}

/**
 * Only to be used in the tests :)
 */
function setDictionaryForTestsOnly (newDictionary) {
  dictionary = newDictionary
}

/**
 * @description Initializes the spellcheck. It removes all existing marks of the current editor.
 * If a language was given (i.e. lang !== this.SPELLCHECK_DISABLED) it will load the stated dictionary and use it to check the whole document.
 * @param {Codemirror} editor CodeMirror-Editor
 * @param {String} lang on of the values from getAvailableDictionaries()-Method
 */
function setLanguage (editor, lang) {
  dictionary = null
  if (editor != null) {
    const existingMarks = editor.getAllMarks() || []
    for (const mark of existingMarks) {
      mark.clear()
    }
  }
  if (lang !== SPELLCHECK_DISABLED) {
    dictionary = new Typo(lang, false, false, {
      dictionaryPath: DICTIONARY_PATH,
      asyncLoad: true,
      loadedCallback: () =>
        checkWholeDocument(this, editor)
    })
  }
}

/**
 * Checks the whole content of the editor for typos
 * @param thisReference a reference to <code>this</code>. Needed because this is null if called from parent method
 * @param {Codemirror} editor CodeMirror-Editor
 */
function checkWholeDocument (thisReference, editor) {
  const lastLine = editor.lineCount() - 1
  const textOfLastLine = editor.getLine(lastLine) || ''
  const lastChar = textOfLastLine.length
  const from = {line: 0, ch: 0}
  const to = {line: lastLine, ch: lastChar}
  checkMultiLineRange(thisReference, editor, from, to)
}

/**
 * Checks the given range for typos
 * @param thisReference a reference to <code>this</code>. Needed because this is null if called from parent method
 * @param {Codemirror} editor CodeMirror-Editor
 * @param {line, ch} from starting position of the spellcheck
 * @param {line, ch} to end position of the spellcheck
 */
function checkMultiLineRange (thisReference, editor, from, to) {
  const currentText = editor.getRange(from, to) || ''
  const lines = currentText.split('\n')
  for (let l = from.line; l <= to.line; l++) {
    const line = lines[l] || ''
    let w = 0
    if (l === from.line) {
      w = from.ch
    }
    let wEnd = line.length
    if (l === to.line) {
      wEnd = to.ch
    }
    while (w < wEnd) {
      const wordRange = editor.findWordAt({line: l, ch: w})
      thisReference.checkWord(editor, wordRange)
      w += (wordRange.head.ch - wordRange.anchor.ch) + 1
    }
  }
}

/**
 * @description Checks whether a certain range of characters in the editor (i.e. a word) contains a typo.
 * If so the ranged will be marked with the class CSS_ERROR_CLASS.
 * Note: Due to performance considerations, only words with more then 3 signs are checked.
 * @param {Codemirror} editor CodeMirror-Editor
 * @param wordRange Object specifying the range that should be checked.
 * Having the following structure: <code>{anchor: {line: integer, ch: integer}, head: {line: integer, ch: integer}}</code>
 */
function checkWord (editor, wordRange) {
  const word = editor.getRange(wordRange.anchor, wordRange.head)
  if (word == null || word.length <= 3) {
    return
  }
  if (!dictionary.check(word)) {
    editor.markText(wordRange.anchor, wordRange.head, {className: styles[CSS_ERROR_CLASS]})
  }
}

/**
 * Checks the changes recently made (aka live check)
 * @param {Codemirror} editor CodeMirror-Editor
 * @param changeObject codeMirror changeObject
 */
function liveSpellcheck (editor, changeObject) {
  /**
   * Returns the range that is smaller (i.e. that is before the other in the editor)
   */
  function getLesserRange (from, to) {
    if (from.line > to.line) {
      return to
    } else {
      if (from.ch > to.ch) {
        return to
      }
    }
    return from
  }

  function calcTo (from) {
    const to = {line: from.line, ch: from.ch}
    const changeArray = changeObject.text || ['']
    to.line += changeArray.length - 1
    const charactersInLastLineOfChange = changeArray[changeArray.length - 1].length
    if (from.line === to.line) {
      to.ch += charactersInLastLineOfChange
    } else {
      to.ch = charactersInLastLineOfChange
    }
    return to
  }

  if (dictionary === null || editor == null) { return }
  try {
    let rangeCheck = true
    let from = getLesserRange(changeObject.from, changeObject.to)
    let to = calcTo(from)

    const newTextLastLine = changeObject.text[changeObject.text.length - 1]
    if (from.line === to.line && newTextLastLine.length <= 1) {
      if (newTextLastLine === '' || newTextLastLine === ' ') {
        from.ch = Math.max(0, from.ch - 1)
      }
      const wordRange = editor.findWordAt({line: from.line, ch: from.ch})
      from = wordRange.anchor
      to = wordRange.head
      rangeCheck = false
    }
    const existingMarks = editor.findMarks(from, to) || []
    for (const mark of existingMarks) {
      mark.clear()
    }

    if (rangeCheck) {
      this.checkMultiLineRange(this, editor, from, to)
    } else {
      this.checkWord(editor, {anchor: from, head: to})
    }
  } catch (e) {
    console.info('Error during the spell check. It might be due to problems figuring out the range of the new text..', e)
  }
}

/**
 * Returns an array of spelling suggestions for the given (wrong written) word.
 * Returns an empty array if the dictionary is null (=> spellcheck is disabled) or the given word was null
 * @param word word to be checked
 * @returns {String[]} Array of suggestions
 */
function getSpellingSuggestion (word) {
  if (dictionary == null || word == null) {
    return []
  }
  return dictionary.suggest(word)
}

/**
 * Returns the name of the CSS class used for errors
 */
function getCSSClassName () {
  return styles[CSS_ERROR_CLASS]
}

module.exports = {
  DICTIONARY_PATH,
  CSS_ERROR_CLASS,
  SPELLCHECK_DISABLED,
  getAvailableDictionaries,
  setLanguage,
  liveSpellcheck,
  getSpellingSuggestion,
  checkWord,
  checkMultiLineRange,
  checkWholeDocument,
  setDictionaryForTestsOnly,
  getCSSClassName
}
