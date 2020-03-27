import styles from '../components/CodeEditor.styl'
import i18n from 'browser/lib/i18n'

const Typo = require('typo-js')
const _ = require('lodash')

const CSS_ERROR_CLASS = 'codeEditor-typo'
const SPELLCHECK_DISABLED = 'NONE'
const DICTIONARY_PATH = '../dictionaries'
const MILLISECONDS_TILL_LIVECHECK = 500

let dictionary = null
let self

function getAvailableDictionaries() {
  return [
    { label: i18n.__('Spellcheck disabled'), value: SPELLCHECK_DISABLED },
    { label: i18n.__('English'), value: 'en_GB' },
    { label: i18n.__('German'), value: 'de_DE' },
    { label: i18n.__('French'), value: 'fr_FR' }
  ]
}

/**
 * Only to be used in the tests :)
 */
function setDictionaryForTestsOnly(newDictionary) {
  dictionary = newDictionary
}

/**
 * @description Initializes the spellcheck. It removes all existing marks of the current editor.
 * If a language was given (i.e. lang !== this.SPELLCHECK_DISABLED) it will load the stated dictionary and use it to check the whole document.
 * @param {Codemirror} editor CodeMirror-Editor
 * @param {String} lang on of the values from getAvailableDictionaries()-Method
 */
function setLanguage(editor, lang) {
  self = this
  dictionary = null

  if (editor == null) {
    return
  }

  const existingMarks = editor.getAllMarks() || []
  for (const mark of existingMarks) {
    mark.clear()
  }
  if (lang !== SPELLCHECK_DISABLED) {
    dictionary = new Typo(lang, false, false, {
      dictionaryPath: DICTIONARY_PATH,
      asyncLoad: true,
      loadedCallback: () => checkWholeDocument(editor)
    })
  }
}

/**
 * Checks the whole content of the editor for typos
 * @param {Codemirror} editor CodeMirror-Editor
 */
function checkWholeDocument(editor) {
  const lastLine = editor.lineCount() - 1
  const textOfLastLine = editor.getLine(lastLine) || ''
  const lastChar = textOfLastLine.length
  const from = { line: 0, ch: 0 }
  const to = { line: lastLine, ch: lastChar }
  checkMultiLineRange(editor, from, to)
}

/**
 * Checks the given range for typos
 * @param {Codemirror} editor CodeMirror-Editor
 * @param {line, ch} from starting position of the spellcheck
 * @param {line, ch} to end position of the spellcheck
 */
function checkMultiLineRange(editor, from, to) {
  function sortRange(pos1, pos2) {
    if (
      pos1.line > pos2.line ||
      (pos1.line === pos2.line && pos1.ch > pos2.ch)
    ) {
      return { from: pos2, to: pos1 }
    }
    return { from: pos1, to: pos2 }
  }

  const { from: smallerPos, to: higherPos } = sortRange(from, to)
  for (let l = smallerPos.line; l <= higherPos.line; l++) {
    const line = editor.getLine(l) || ''
    let w = 0
    if (l === smallerPos.line) {
      w = smallerPos.ch
    }
    let wEnd = line.length
    if (l === higherPos.line) {
      wEnd = higherPos.ch
    }
    while (w <= wEnd) {
      const wordRange = editor.findWordAt({ line: l, ch: w })
      self.checkWord(editor, wordRange)
      w += wordRange.head.ch - wordRange.anchor.ch + 1
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
function checkWord(editor, wordRange) {
  const word = editor.getRange(wordRange.anchor, wordRange.head)
  if (word == null || word.length <= 3) {
    return
  }
  if (!dictionary.check(word)) {
    editor.markText(wordRange.anchor, wordRange.head, {
      className: styles[CSS_ERROR_CLASS]
    })
  }
}

/**
 * Checks the changes recently made (aka live check)
 * @param {Codemirror} editor CodeMirror-Editor
 * @param fromChangeObject codeMirror changeObject describing the start of the editing
 * @param toChangeObject codeMirror changeObject describing the end of the editing
 */
function checkChangeRange(editor, fromChangeObject, toChangeObject) {
  /**
   * Calculate the smallest respectively largest position as a start, resp. end, position and return it
   * @param start CodeMirror change object
   * @param end CodeMirror change object
   * @returns {{start: {line: *, ch: *}, end: {line: *, ch: *}}}
   */
  function getStartAndEnd(start, end) {
    const possiblePositions = [start.from, start.to, end.from, end.to]
    let smallest = start.from
    let biggest = end.to
    for (const currentPos of possiblePositions) {
      if (
        currentPos.line < smallest.line ||
        (currentPos.line === smallest.line && currentPos.ch < smallest.ch)
      ) {
        smallest = currentPos
      }
      if (
        currentPos.line > biggest.line ||
        (currentPos.line === biggest.line && currentPos.ch > biggest.ch)
      ) {
        biggest = currentPos
      }
    }
    return { start: smallest, end: biggest }
  }

  if (dictionary === null || editor == null) {
    return
  }

  try {
    const { start, end } = getStartAndEnd(fromChangeObject, toChangeObject)

    // Expand the range to include words after/before whitespaces
    start.ch = Math.max(start.ch - 1, 0)
    end.ch = end.ch + 1

    // clean existing marks
    const existingMarks = editor.findMarks(start, end) || []
    for (const mark of existingMarks) {
      mark.clear()
    }

    self.checkMultiLineRange(editor, start, end)
  } catch (e) {
    console.info(
      'Error during the spell check. It might be due to problems figuring out the range of the new text..',
      e
    )
  }
}

function saveLiveSpellCheckFrom(changeObject) {
  liveSpellCheckFrom = changeObject
}
let liveSpellCheckFrom
const debouncedSpellCheckLeading = _.debounce(
  saveLiveSpellCheckFrom,
  MILLISECONDS_TILL_LIVECHECK,
  {
    leading: true,
    trailing: false
  }
)
const debouncedSpellCheck = _.debounce(
  checkChangeRange,
  MILLISECONDS_TILL_LIVECHECK,
  {
    leading: false,
    trailing: true
  }
)

/**
 * Handles a keystroke. Buffers the input and performs a live spell check after a certain time. Uses _debounce from lodash to buffer the input
 * @param {Codemirror} editor CodeMirror-Editor
 * @param changeObject codeMirror changeObject
 */
function handleChange(editor, changeObject) {
  if (dictionary === null) {
    return
  }
  debouncedSpellCheckLeading(changeObject)
  debouncedSpellCheck(editor, liveSpellCheckFrom, changeObject)
}

/**
 * Returns an array of spelling suggestions for the given (wrong written) word.
 * Returns an empty array if the dictionary is null (=> spellcheck is disabled) or the given word was null
 * @param word word to be checked
 * @returns {String[]} Array of suggestions
 */
function getSpellingSuggestion(word) {
  if (dictionary == null || word == null) {
    return []
  }
  return dictionary.suggest(word)
}

/**
 * Returns the name of the CSS class used for errors
 */
function getCSSClassName() {
  return styles[CSS_ERROR_CLASS]
}

module.exports = {
  DICTIONARY_PATH,
  CSS_ERROR_CLASS,
  SPELLCHECK_DISABLED,
  getAvailableDictionaries,
  setLanguage,
  checkChangeRange,
  handleChange,
  getSpellingSuggestion,
  checkWord,
  checkMultiLineRange,
  checkWholeDocument,
  setDictionaryForTestsOnly,
  getCSSClassName
}
