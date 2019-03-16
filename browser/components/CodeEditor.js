import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'
import CodeMirror from 'codemirror'
import hljs from 'highlight.js'
import 'codemirror-mode-elixir'
import attachmentManagement from 'browser/main/lib/dataApi/attachmentManagement'
import convertModeName from 'browser/lib/convertModeName'
import {
  options,
  TableEditor,
  Alignment
} from '@susisu/mte-kernel'
import TextEditorInterface from 'browser/lib/TextEditorInterface'
import eventEmitter from 'browser/main/lib/eventEmitter'
import iconv from 'iconv-lite'
import crypto from 'crypto'
import consts from 'browser/lib/consts'
import styles from '../components/CodeEditor.styl'
import fs from 'fs'
const { ipcRenderer, remote, clipboard } = require('electron')
import normalizeEditorFontFamily from 'browser/lib/normalizeEditorFontFamily'
const spellcheck = require('browser/lib/spellcheck')
const buildEditorContextMenu = require('browser/lib/contextMenuBuilder')
import TurndownService from 'turndown'
import {
  gfm
} from 'turndown-plugin-gfm'

CodeMirror.modeURL = '../node_modules/codemirror/mode/%N/%N.js'

const buildCMRulers = (rulers, enableRulers) =>
  (enableRulers ? rulers.map(ruler => ({
    column: ruler
  })) : [])

function translateHotkey (hotkey) {
  return hotkey.replace(/\s*\+\s*/g, '-').replace(/Command/g, 'Cmd').replace(/Control/g, 'Ctrl')
}

export const languageMaps = {
  brainfuck: 'Brainfuck',
  cpp: 'C++',
  cs: 'C#',
  clojure: 'Clojure',
  'clojure-repl': 'ClojureScript',
  cmake: 'CMake',
  coffeescript: 'CoffeeScript',
  crystal: 'Crystal',
  css: 'CSS',
  d: 'D',
  dart: 'Dart',
  delphi: 'Pascal',
  diff: 'Diff',
  django: 'Django',
  dockerfile: 'Dockerfile',
  ebnf: 'EBNF',
  elm: 'Elm',
  erlang: 'Erlang',
  'erlang-repl': 'Erlang',
  fortran: 'Fortran',
  fsharp: 'F#',
  gherkin: 'Gherkin',
  go: 'Go',
  groovy: 'Groovy',
  haml: 'HAML',
  haskell: 'Haskell',
  haxe: 'Haxe',
  http: 'HTTP',
  ini: 'toml',
  java: 'Java',
  javascript: 'JavaScript',
  json: 'JSON',
  julia: 'Julia',
  kotlin: 'Kotlin',
  less: 'LESS',
  livescript: 'LiveScript',
  lua: 'Lua',
  markdown: 'Markdown',
  mathematica: 'Mathematica',
  nginx: 'Nginx',
  nsis: 'NSIS',
  objectivec: 'Objective-C',
  ocaml: 'Ocaml',
  perl: 'Perl',
  php: 'PHP',
  powershell: 'PowerShell',
  properties: 'Properties files',
  protobuf: 'ProtoBuf',
  python: 'Python',
  puppet: 'Puppet',
  q: 'Q',
  r: 'R',
  ruby: 'Ruby',
  rust: 'Rust',
  sas: 'SAS',
  scala: 'Scala',
  scheme: 'Scheme',
  scss: 'SCSS',
  shell: 'Shell',
  smalltalk: 'Smalltalk',
  sml: 'SML',
  sql: 'SQL',
  stylus: 'Stylus',
  swift: 'Swift',
  tcl: 'Tcl',
  tex: 'LaTex',
  typescript: 'TypeScript',
  twig: 'Twig',
  vbnet: 'VB.NET',
  vbscript: 'VBScript',
  verilog: 'Verilog',
  vhdl: 'VHDL',
  xml: 'HTML',
  xquery: 'XQuery',
  yaml: 'YAML',
  elixir: 'Elixir'
}

export default class CodeEditor extends React.Component {
  constructor (props) {
    super(props)

    this.scrollHandler = _.debounce(this.handleScroll.bind(this), 100, {
      leading: false,
      trailing: true
    })
    this.changeHandler = (editor, changeObject) => this.handleChange(editor, changeObject)
    this.highlightHandler = (editor, changeObject) => this.handleHighlight(editor, changeObject)
    this.focusHandler = () => {
      ipcRenderer.send('editor:focused', true)
    }
    this.blurHandler = (editor, e) => {
      ipcRenderer.send('editor:focused', false)
      if (e == null) return null
      let el = e.relatedTarget
      while (el != null) {
        if (el === this.refs.root) {
          return
        }
        el = el.parentNode
      }
      this.props.onBlur != null && this.props.onBlur(e)

      const {
        storageKey,
        noteKey
      } = this.props
      attachmentManagement.deleteAttachmentsNotPresentInNote(
        this.editor.getValue(),
        storageKey,
        noteKey
      )
    }
    this.pasteHandler = (editor, e) => {
      e.preventDefault()

      this.handlePaste(editor, false)
    }
    this.loadStyleHandler = e => {
      this.editor.refresh()
    }
    this.searchHandler = (e, msg) => this.handleSearch(msg)
    this.searchState = null
    this.scrollToLineHandeler = this.scrollToLine.bind(this)

    this.formatTable = () => this.handleFormatTable()

    if (props.switchPreview !== 'RIGHTCLICK') {
      this.contextMenuHandler = function (editor, event) {
        const menu = buildEditorContextMenu(editor, event)
        if (menu != null) {
          setTimeout(() => menu.popup(remote.getCurrentWindow()), 30)
        }
      }
    }

    this.editorActivityHandler = () => this.handleEditorActivity()

    this.turndownService = new TurndownService()
  }

  handleSearch (msg) {
    const cm = this.editor
    const component = this

    if (component.searchState) cm.removeOverlay(component.searchState)
    if (msg.length < 3) return

    cm.operation(function () {
      component.searchState = makeOverlay(msg, 'searching')
      cm.addOverlay(component.searchState)

      function makeOverlay (query, style) {
        query = new RegExp(
          query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'),
          'gi'
        )
        return {
          token: function (stream) {
            query.lastIndex = stream.pos
            var match = query.exec(stream.string)
            if (match && match.index === stream.pos) {
              stream.pos += match[0].length || 1
              return style
            } else if (match) {
              stream.pos = match.index
            } else {
              stream.skipToEnd()
            }
          }
        }
      }
    })
  }

  handleFormatTable () {
    this.tableEditor.formatAll(options({
      textWidthOptions: {}
    }))
  }

  handleEditorActivity () {
    if (!this.textEditorInterface.transaction) {
      this.updateTableEditorState()
    }
  }

  updateDefaultKeyMap () {
    const { hotkey } = this.props
    const expandSnippet = this.expandSnippet.bind(this)

    this.defaultKeyMap = CodeMirror.normalizeKeyMap({
      Tab: function (cm) {
        const cursor = cm.getCursor()
        const line = cm.getLine(cursor.line)
        const cursorPosition = cursor.ch
        const charBeforeCursor = line.substr(cursorPosition - 1, 1)
        if (cm.somethingSelected()) cm.indentSelection('add')
        else {
          const tabs = cm.getOption('indentWithTabs')
          if (line.trimLeft().match(/^(-|\*|\+) (\[( |x)] )?$/)) {
            cm.execCommand('goLineStart')
            if (tabs) {
              cm.execCommand('insertTab')
            } else {
              cm.execCommand('insertSoftTab')
            }
            cm.execCommand('goLineEnd')
          } else if (
            !charBeforeCursor.match(/\t|\s|\r|\n/) &&
            cursor.ch > 1
          ) {
            // text expansion on tab key if the char before is alphabet
            const snippets = JSON.parse(
              fs.readFileSync(consts.SNIPPET_FILE, 'utf8')
            )
            if (expandSnippet(line, cursor, cm, snippets) === false) {
              if (tabs) {
                cm.execCommand('insertTab')
              } else {
                cm.execCommand('insertSoftTab')
              }
            }
          } else {
            if (tabs) {
              cm.execCommand('insertTab')
            } else {
              cm.execCommand('insertSoftTab')
            }
          }
        }
      },
      'Cmd-Left': function (cm) {
        cm.execCommand('goLineLeft')
      },
      'Cmd-T': function (cm) {
        // Do nothing
      },
      Enter: 'boostNewLineAndIndentContinueMarkdownList',
      'Ctrl-C': cm => {
        if (cm.getOption('keyMap').substr(0, 3) === 'vim') {
          document.execCommand('copy')
        }
        return CodeMirror.Pass
      },
      [translateHotkey(hotkey.pasteSmartly)]: cm => {
        this.handlePaste(cm, true)
      }
    })
  }

  updateTableEditorState () {
    const active = this.tableEditor.cursorIsInTable(this.tableEditorOptions)
    if (active) {
      if (this.extraKeysMode !== 'editor') {
        this.extraKeysMode = 'editor'
        this.editor.setOption('extraKeys', this.editorKeyMap)
      }
    } else {
      if (this.extraKeysMode !== 'default') {
        this.extraKeysMode = 'default'
        this.editor.setOption('extraKeys', this.defaultKeyMap)
        this.tableEditor.resetSmartCursor()
      }
    }
  }

  componentDidMount () {
    const { rulers, enableRulers } = this.props
    eventEmitter.on('line:jump', this.scrollToLineHandeler)

    const defaultSnippet = [
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Dummy text',
        prefix: ['lorem', 'ipsum'],
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
      }
    ]
    if (!fs.existsSync(consts.SNIPPET_FILE)) {
      fs.writeFileSync(
        consts.SNIPPET_FILE,
        JSON.stringify(defaultSnippet, null, 4),
        'utf8'
      )
    }

    this.updateDefaultKeyMap()

    this.value = this.props.value
    this.editor = CodeMirror(this.refs.root, {
      rulers: buildCMRulers(rulers, enableRulers),
      value: this.props.value,
      linesHighlighted: this.props.linesHighlighted,
      lineNumbers: this.props.displayLineNumbers,
      lineWrapping: true,
      theme: this.props.theme,
      indentUnit: this.props.indentSize,
      tabSize: this.props.indentSize,
      indentWithTabs: this.props.indentType !== 'space',
      keyMap: this.props.keyMap,
      scrollPastEnd: this.props.scrollPastEnd,
      inputStyle: 'textarea',
      dragDrop: false,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      autoCloseBrackets: {
        pairs: this.props.matchingPairs,
        triples: this.props.matchingTriples,
        explode: this.props.explodingPairs,
        override: true
      },
      extraKeys: this.defaultKeyMap
    })

    if (!this.props.mode && this.props.value && this.props.autoDetect) {
      this.autoDetectLanguage(this.props.value)
    } else {
      this.setMode(this.props.mode)
    }

    this.editor.on('focus', this.focusHandler)
    this.editor.on('blur', this.blurHandler)
    this.editor.on('change', this.changeHandler)
    this.editor.on('gutterClick', this.highlightHandler)
    this.editor.on('paste', this.pasteHandler)
    if (this.props.switchPreview !== 'RIGHTCLICK') {
      this.editor.on('contextmenu', this.contextMenuHandler)
    }
    eventEmitter.on('top:search', this.searchHandler)

    eventEmitter.emit('code:init')
    this.editor.on('scroll', this.scrollHandler)

    const editorTheme = document.getElementById('editorTheme')
    editorTheme.addEventListener('load', this.loadStyleHandler)

    CodeMirror.Vim.defineEx('quit', 'q', this.quitEditor)
    CodeMirror.Vim.defineEx('q!', 'q!', this.quitEditor)
    CodeMirror.Vim.defineEx('wq', 'wq', this.quitEditor)
    CodeMirror.Vim.defineEx('qw', 'qw', this.quitEditor)
    CodeMirror.Vim.map('ZZ', ':q', 'normal')

    this.textEditorInterface = new TextEditorInterface(this.editor)
    this.tableEditor = new TableEditor(this.textEditorInterface)
    if (this.props.spellCheck) {
      this.editor.addPanel(this.createSpellCheckPanel(), {position: 'bottom'})
    }

    eventEmitter.on('code:format-table', this.formatTable)

    this.tableEditorOptions = options({
      smartCursor: true
    })

    this.editorKeyMap = CodeMirror.normalizeKeyMap({
      'Tab': () => {
        this.tableEditor.nextCell(this.tableEditorOptions)
      },
      'Shift-Tab': () => {
        this.tableEditor.previousCell(this.tableEditorOptions)
      },
      'Enter': () => {
        this.tableEditor.nextRow(this.tableEditorOptions)
      },
      'Ctrl-Enter': () => {
        this.tableEditor.escape(this.tableEditorOptions)
      },
      'Cmd-Enter': () => {
        this.tableEditor.escape(this.tableEditorOptions)
      },
      'Shift-Ctrl-Left': () => {
        this.tableEditor.alignColumn(Alignment.LEFT, this.tableEditorOptions)
      },
      'Shift-Cmd-Left': () => {
        this.tableEditor.alignColumn(Alignment.LEFT, this.tableEditorOptions)
      },
      'Shift-Ctrl-Right': () => {
        this.tableEditor.alignColumn(Alignment.RIGHT, this.tableEditorOptions)
      },
      'Shift-Cmd-Right': () => {
        this.tableEditor.alignColumn(Alignment.RIGHT, this.tableEditorOptions)
      },
      'Shift-Ctrl-Up': () => {
        this.tableEditor.alignColumn(Alignment.CENTER, this.tableEditorOptions)
      },
      'Shift-Cmd-Up': () => {
        this.tableEditor.alignColumn(Alignment.CENTER, this.tableEditorOptions)
      },
      'Shift-Ctrl-Down': () => {
        this.tableEditor.alignColumn(Alignment.NONE, this.tableEditorOptions)
      },
      'Shift-Cmd-Down': () => {
        this.tableEditor.alignColumn(Alignment.NONE, this.tableEditorOptions)
      },
      'Ctrl-Left': () => {
        this.tableEditor.moveFocus(0, -1, this.tableEditorOptions)
      },
      'Cmd-Left': () => {
        this.tableEditor.moveFocus(0, -1, this.tableEditorOptions)
      },
      'Ctrl-Right': () => {
        this.tableEditor.moveFocus(0, 1, this.tableEditorOptions)
      },
      'Cmd-Right': () => {
        this.tableEditor.moveFocus(0, 1, this.tableEditorOptions)
      },
      'Ctrl-Up': () => {
        this.tableEditor.moveFocus(-1, 0, this.tableEditorOptions)
      },
      'Cmd-Up': () => {
        this.tableEditor.moveFocus(-1, 0, this.tableEditorOptions)
      },
      'Ctrl-Down': () => {
        this.tableEditor.moveFocus(1, 0, this.tableEditorOptions)
      },
      'Cmd-Down': () => {
        this.tableEditor.moveFocus(1, 0, this.tableEditorOptions)
      },
      'Ctrl-K Ctrl-I': () => {
        this.tableEditor.insertRow(this.tableEditorOptions)
      },
      'Cmd-K Cmd-I': () => {
        this.tableEditor.insertRow(this.tableEditorOptions)
      },
      'Ctrl-L Ctrl-I': () => {
        this.tableEditor.deleteRow(this.tableEditorOptions)
      },
      'Cmd-L Cmd-I': () => {
        this.tableEditor.deleteRow(this.tableEditorOptions)
      },
      'Ctrl-K Ctrl-J': () => {
        this.tableEditor.insertColumn(this.tableEditorOptions)
      },
      'Cmd-K Cmd-J': () => {
        this.tableEditor.insertColumn(this.tableEditorOptions)
      },
      'Ctrl-L Ctrl-J': () => {
        this.tableEditor.deleteColumn(this.tableEditorOptions)
      },
      'Cmd-L Cmd-J': () => {
        this.tableEditor.deleteColumn(this.tableEditorOptions)
      },
      'Alt-Shift-Ctrl-Left': () => {
        this.tableEditor.moveColumn(-1, this.tableEditorOptions)
      },
      'Alt-Shift-Cmd-Left': () => {
        this.tableEditor.moveColumn(-1, this.tableEditorOptions)
      },
      'Alt-Shift-Ctrl-Right': () => {
        this.tableEditor.moveColumn(1, this.tableEditorOptions)
      },
      'Alt-Shift-Cmd-Right': () => {
        this.tableEditor.moveColumn(1, this.tableEditorOptions)
      },
      'Alt-Shift-Ctrl-Up': () => {
        this.tableEditor.moveRow(-1, this.tableEditorOptions)
      },
      'Alt-Shift-Cmd-Up': () => {
        this.tableEditor.moveRow(-1, this.tableEditorOptions)
      },
      'Alt-Shift-Ctrl-Down': () => {
        this.tableEditor.moveRow(1, this.tableEditorOptions)
      },
      'Alt-Shift-Cmd-Down': () => {
        this.tableEditor.moveRow(1, this.tableEditorOptions)
      }
    })

    if (this.props.enableTableEditor) {
      this.editor.on('cursorActivity', this.editorActivityHandler)
      this.editor.on('changes', this.editorActivityHandler)
    }

    this.setState({
      clientWidth: this.refs.root.clientWidth
    })

    this.initialHighlighting()
  }

  expandSnippet (line, cursor, cm, snippets) {
    const wordBeforeCursor = this.getWordBeforeCursor(
      line,
      cursor.line,
      cursor.ch
    )
    const templateCursorString = ':{}'
    for (let i = 0; i < snippets.length; i++) {
      if (snippets[i].prefix.indexOf(wordBeforeCursor.text) !== -1) {
        if (snippets[i].content.indexOf(templateCursorString) !== -1) {
          const snippetLines = snippets[i].content.split('\n')
          let cursorLineNumber = 0
          let cursorLinePosition = 0

          let cursorIndex
          for (let j = 0; j < snippetLines.length; j++) {
            cursorIndex = snippetLines[j].indexOf(templateCursorString)

            if (cursorIndex !== -1) {
              cursorLineNumber = j
              cursorLinePosition = cursorIndex

              break
            }
          }

          cm.replaceRange(
            snippets[i].content.replace(templateCursorString, ''),
            wordBeforeCursor.range.from,
            wordBeforeCursor.range.to
          )
          cm.setCursor({
            line: cursor.line + cursorLineNumber,
            ch: cursorLinePosition + cursor.ch - wordBeforeCursor.text.length
          })
        } else {
          cm.replaceRange(
            snippets[i].content,
            wordBeforeCursor.range.from,
            wordBeforeCursor.range.to
          )
        }
        return true
      }
    }

    return false
  }

  getWordBeforeCursor (line, lineNumber, cursorPosition) {
    let wordBeforeCursor = ''
    const originCursorPosition = cursorPosition
    const emptyChars = /\t|\s|\r|\n/

    // to prevent the word to expand is long that will crash the whole app
    // the safeStop is there to stop user to expand words that longer than 20 chars
    const safeStop = 20

    while (cursorPosition > 0) {
      const currentChar = line.substr(cursorPosition - 1, 1)
      // if char is not an empty char
      if (!emptyChars.test(currentChar)) {
        wordBeforeCursor = currentChar + wordBeforeCursor
      } else if (wordBeforeCursor.length >= safeStop) {
        throw new Error('Your snippet trigger is too long !')
      } else {
        break
      }
      cursorPosition--
    }

    return {
      text: wordBeforeCursor,
      range: {
        from: {
          line: lineNumber,
          ch: originCursorPosition
        },
        to: {
          line: lineNumber,
          ch: cursorPosition
        }
      }
    }
  }

  quitEditor () {
    document.querySelector('textarea').blur()
  }

  componentWillUnmount () {
    this.editor.off('focus', this.focusHandler)
    this.editor.off('blur', this.blurHandler)
    this.editor.off('change', this.changeHandler)
    this.editor.off('paste', this.pasteHandler)
    eventEmitter.off('top:search', this.searchHandler)
    this.editor.off('scroll', this.scrollHandler)
    this.editor.off('contextmenu', this.contextMenuHandler)
    const editorTheme = document.getElementById('editorTheme')
    editorTheme.removeEventListener('load', this.loadStyleHandler)

    spellcheck.setLanguage(null, spellcheck.SPELLCHECK_DISABLED)
    eventEmitter.off('code:format-table', this.formatTable)
  }

  componentDidUpdate (prevProps, prevState) {
    let needRefresh = false
    const {
      rulers,
      enableRulers
    } = this.props
    if (prevProps.mode !== this.props.mode) {
      this.setMode(this.props.mode)
    }
    if (prevProps.theme !== this.props.theme) {
      this.editor.setOption('theme', this.props.theme)
      // editor should be refreshed after css loaded
    }
    if (prevProps.fontSize !== this.props.fontSize) {
      needRefresh = true
    }
    if (prevProps.fontFamily !== this.props.fontFamily) {
      needRefresh = true
    }
    if (prevProps.keyMap !== this.props.keyMap) {
      needRefresh = true
    }

    if (
      prevProps.enableRulers !== enableRulers ||
      prevProps.rulers !== rulers
    ) {
      this.editor.setOption('rulers', buildCMRulers(rulers, enableRulers))
    }

    if (prevProps.indentSize !== this.props.indentSize) {
      this.editor.setOption('indentUnit', this.props.indentSize)
      this.editor.setOption('tabSize', this.props.indentSize)
    }
    if (prevProps.indentType !== this.props.indentType) {
      this.editor.setOption('indentWithTabs', this.props.indentType !== 'space')
    }

    if (prevProps.displayLineNumbers !== this.props.displayLineNumbers) {
      this.editor.setOption('lineNumbers', this.props.displayLineNumbers)
    }

    if (prevProps.scrollPastEnd !== this.props.scrollPastEnd) {
      this.editor.setOption('scrollPastEnd', this.props.scrollPastEnd)
    }

    if (prevProps.matchingPairs !== this.props.matchingPairs ||
      prevProps.matchingTriples !== this.props.matchingTriples ||
      prevProps.explodingPairs !== this.props.explodingPairs) {
      const bracketObject = {
        pairs: this.props.matchingPairs,
        triples: this.props.matchingTriples,
        explode: this.props.explodingPairs,
        override: true
      }
      this.editor.setOption('autoCloseBrackets', bracketObject)
    }

    if (prevProps.enableTableEditor !== this.props.enableTableEditor) {
      if (this.props.enableTableEditor) {
        this.editor.on('cursorActivity', this.editorActivityHandler)
        this.editor.on('changes', this.editorActivityHandler)
      } else {
        this.editor.off('cursorActivity', this.editorActivityHandler)
        this.editor.off('changes', this.editorActivityHandler)
      }

      this.extraKeysMode = 'default'
      this.editor.setOption('extraKeys', this.defaultKeyMap)
    }

    if (prevProps.hotkey !== this.props.hotkey) {
      this.updateDefaultKeyMap()

      if (this.extraKeysMode === 'default') {
        this.editor.setOption('extraKeys', this.defaultKeyMap)
      }
    }

    if (this.state.clientWidth !== this.refs.root.clientWidth) {
      this.setState({
        clientWidth: this.refs.root.clientWidth
      })

      needRefresh = true
    }

    if (prevProps.spellCheck !== this.props.spellCheck) {
      if (this.props.spellCheck === false) {
        spellcheck.setLanguage(this.editor, spellcheck.SPELLCHECK_DISABLED)
        const elem = document.getElementById('editor-bottom-panel')
        elem.parentNode.removeChild(elem)
      } else {
        this.editor.addPanel(this.createSpellCheckPanel(), {position: 'bottom'})
      }
    }

    if (needRefresh) {
      this.editor.refresh()
    }
  }

  setMode (mode) {
    let syntax = CodeMirror.findModeByName(convertModeName(mode || 'text'))
    if (syntax == null) syntax = CodeMirror.findModeByName('Plain Text')

    this.editor.setOption('mode', syntax.mime)
    CodeMirror.autoLoadMode(this.editor, syntax.mode)
  }

  handleChange (editor, changeObject) {
    spellcheck.handleChange(editor, changeObject)

    this.updateHighlight(editor, changeObject)

    this.value = editor.getValue()
    if (this.props.onChange) {
      this.props.onChange(editor)
    }
  }

  incrementLines (start, linesAdded, linesRemoved, editor) {
    const highlightedLines = editor.options.linesHighlighted

    const totalHighlightedLines = highlightedLines.length

    const offset = linesAdded - linesRemoved

    // Store new items to be added as we're changing the lines
    const newLines = []

    let i = totalHighlightedLines

    while (i--) {
      const lineNumber = highlightedLines[i]

      // Interval that will need to be updated
      // Between start and (start + offset) remove highlight
      if (lineNumber >= start) {
        highlightedLines.splice(highlightedLines.indexOf(lineNumber), 1)

        // Lines that need to be relocated
        if (lineNumber >= (start + linesRemoved)) {
          newLines.push(lineNumber + offset)
        }
      }
    }

    // Adding relocated lines
    highlightedLines.push(...newLines)

    if (this.props.onChange) {
      this.props.onChange(editor)
    }
  }

  handleHighlight (editor, changeObject) {
    const lines = editor.options.linesHighlighted

    if (!lines.includes(changeObject)) {
      lines.push(changeObject)
      editor.addLineClass(changeObject, 'text', 'CodeMirror-activeline-background')
    } else {
      lines.splice(lines.indexOf(changeObject), 1)
      editor.removeLineClass(changeObject, 'text', 'CodeMirror-activeline-background')
    }
    if (this.props.onChange) {
      this.props.onChange(editor)
    }
  }

  updateHighlight (editor, changeObject) {
    const linesAdded = changeObject.text.length - 1
    const linesRemoved = changeObject.removed.length - 1

    // If no lines added or removed return
    if (linesAdded === 0 && linesRemoved === 0) {
      return
    }

    let start = changeObject.from.line

    switch (changeObject.origin) {
      case '+insert", "undo':
        start += 1
        break

      case 'paste':
      case '+delete':
      case '+input':
        if (changeObject.to.ch !== 0 || changeObject.from.ch !== 0) {
          start += 1
        }
        break

      default:
        return
    }

    this.incrementLines(start, linesAdded, linesRemoved, editor)
  }

  moveCursorTo (row, col) {}

  scrollToLine (event, num) {
    const cursor = {
      line: num,
      ch: 1
    }
    this.editor.setCursor(cursor)
  }

  focus () {
    this.editor.focus()
  }

  blur () {
    this.editor.blur()
  }

  reload () {
    // Change event shouldn't be fired when switch note
    this.editor.off('change', this.changeHandler)
    this.value = this.props.value
    this.editor.setValue(this.props.value)
    this.editor.clearHistory()
    this.restartHighlighting()
    this.editor.on('change', this.changeHandler)
    this.editor.refresh()
  }

  setValue (value) {
    const cursor = this.editor.getCursor()
    this.editor.setValue(value)
    this.editor.setCursor(cursor)
  }

  handleDropImage (dropEvent) {
    dropEvent.preventDefault()
    const {
      storageKey,
      noteKey
    } = this.props
    attachmentManagement.handleAttachmentDrop(
      this,
      storageKey,
      noteKey,
      dropEvent
    )
  }

  insertAttachmentMd (imageMd) {
    this.editor.replaceSelection(imageMd)
  }

  autoDetectLanguage (content) {
    const res = hljs.highlightAuto(content, Object.keys(languageMaps))
    this.setMode(languageMaps[res.language])
  }

  handlePaste (editor, forceSmartPaste) {
    const { storageKey, noteKey, fetchUrlTitle, enableSmartPaste } = this.props

    const isURL = str => /(?:^\w+:|^)\/\/(?:[^\s\.]+\.\S{2}|localhost[\:?\d]*)/.test(str)

    const isInLinkTag = editor => {
      const startCursor = editor.getCursor('start')
      const prevChar = editor.getRange({
        line: startCursor.line,
        ch: startCursor.ch - 2
      }, {
        line: startCursor.line,
        ch: startCursor.ch
      })
      const endCursor = editor.getCursor('end')
      const nextChar = editor.getRange({
        line: endCursor.line,
        ch: endCursor.ch
      }, {
        line: endCursor.line,
        ch: endCursor.ch + 1
      })
      return prevChar === '](' && nextChar === ')'
    }

    const isInFencedCodeBlock = editor => {
      const cursor = editor.getCursor()

      let token = editor.getTokenAt(cursor)
      if (token.state.fencedState) {
        return true
      }

      let line = line = cursor.line - 1
      while (line >= 0) {
        token = editor.getTokenAt({
          ch: 3,
          line
        })

        if (token.start === token.end) {
          --line
        } else if (token.type === 'comment') {
          if (line > 0) {
            token = editor.getTokenAt({
              ch: 3,
              line: line - 1
            })

            return token.type !== 'comment'
          } else {
            return true
          }
        } else {
          return false
        }
      }

      return false
    }

    const pastedTxt = clipboard.readText()

    if (isInFencedCodeBlock(editor)) {
      this.handlePasteText(editor, pastedTxt)
    } else if (fetchUrlTitle && isURL(pastedTxt) && !isInLinkTag(editor)) {
      this.handlePasteUrl(editor, pastedTxt)
    } else if (attachmentManagement.isAttachmentLink(pastedTxt)) {
      attachmentManagement
        .handleAttachmentLinkPaste(storageKey, noteKey, pastedTxt)
        .then(modifiedText => {
          this.editor.replaceSelection(modifiedText)
        })
    } else {
      const image = clipboard.readImage()
      if (!image.isEmpty()) {
        attachmentManagement.handlePasteNativeImage(
          this,
          storageKey,
          noteKey,
          image
        )
      } else if (enableSmartPaste || forceSmartPaste) {
        const pastedHtml = clipboard.readHTML()
        if (pastedHtml.length > 0) {
          this.handlePasteHtml(editor, pastedHtml)
        } else {
          this.handlePasteText(editor, pastedTxt)
        }
      } else {
        this.handlePasteText(editor, pastedTxt)
      }
    }

    if (!this.props.mode && this.props.autoDetect) {
      this.autoDetectLanguage(editor.doc.getValue())
    }
  }

  handleScroll (e) {
    if (this.props.onScroll) {
      this.props.onScroll(e)
    }
  }

  handlePasteUrl (editor, pastedTxt) {
    const taggedUrl = `<${pastedTxt}>`
    editor.replaceSelection(taggedUrl)

    const isImageReponse = response => {
      return (
        response.headers.has('content-type') &&
        response.headers.get('content-type').match(/^image\/.+$/)
      )
    }
    const replaceTaggedUrl = replacement => {
      const value = editor.getValue()
      const cursor = editor.getCursor()
      const newValue = value.replace(taggedUrl, replacement)
      const newCursor = Object.assign({}, cursor, {
        ch: cursor.ch + newValue.length - value.length
      })
      editor.setValue(newValue)
      editor.setCursor(newCursor)
    }

    fetch(pastedTxt, {
      method: 'get'
    })
      .then(response => {
        if (isImageReponse(response)) {
          return this.mapImageResponse(response, pastedTxt)
        } else {
          return this.mapNormalResponse(response, pastedTxt)
        }
      })
      .then(replacement => {
        replaceTaggedUrl(replacement)
      })
      .catch(e => {
        replaceTaggedUrl(pastedTxt)
      })
  }

  handlePasteHtml (editor, pastedHtml) {
    const markdown = this.turndownService.turndown(pastedHtml)
    editor.replaceSelection(markdown)
  }

  handlePasteText (editor, pastedTxt) {
    editor.replaceSelection(pastedTxt)
  }

  mapNormalResponse (response, pastedTxt) {
    return this.decodeResponse(response).then(body => {
      return new Promise((resolve, reject) => {
        try {
          const parsedBody = new window.DOMParser().parseFromString(
            body,
            'text/html'
          )
          const escapePipe = (str) => {
            return str.replace('|', '\\|')
          }
          const linkWithTitle = `[${escapePipe(parsedBody.title)}](${pastedTxt})`
          resolve(linkWithTitle)
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  initialHighlighting () {
    if (this.editor.options.linesHighlighted == null) {
      return
    }

    const totalHighlightedLines = this.editor.options.linesHighlighted.length
    const totalAvailableLines = this.editor.lineCount()

    for (let i = 0; i < totalHighlightedLines; i++) {
      const lineNumber = this.editor.options.linesHighlighted[i]
      if (lineNumber > totalAvailableLines) {
        // make sure that we skip the invalid lines althrough this case should not be happened.
        continue
      }
      this.editor.addLineClass(lineNumber, 'text', 'CodeMirror-activeline-background')
    }
  }

  restartHighlighting () {
    this.editor.options.linesHighlighted = this.props.linesHighlighted
    this.initialHighlighting()
  }

  mapImageResponse (response, pastedTxt) {
    return new Promise((resolve, reject) => {
      try {
        const url = response.url
        const name = url.substring(url.lastIndexOf('/') + 1)
        const imageLinkWithName = `![${name}](${pastedTxt})`
        resolve(imageLinkWithName)
      } catch (e) {
        reject(e)
      }
    })
  }

  decodeResponse (response) {
    const headers = response.headers
    const _charset = headers.has('content-type')
      ? this.extractContentTypeCharset(headers.get('content-type'))
      : undefined
    return response.arrayBuffer().then(buff => {
      return new Promise((resolve, reject) => {
        try {
          const charset = _charset !== undefined &&
            iconv.encodingExists(_charset)
            ? _charset
            : 'utf-8'
          resolve(iconv.decode(Buffer.from(buff), charset).toString())
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  extractContentTypeCharset (contentType) {
    return contentType
      .split(';')
      .filter(str => {
        return str.trim().toLowerCase().startsWith('charset')
      })
      .map(str => {
        return str.replace(/['"]/g, '').split('=')[1]
      })[0]
  }

  render () {
    const {
      className,
      fontSize
    } = this.props
    const fontFamily = normalizeEditorFontFamily(this.props.fontFamily)
    const width = this.props.width
    return (<
      div className={
        className == null ? 'CodeEditor' : `CodeEditor ${className}`
      }
      ref='root'
      tabIndex='-1'
      style={
      {
        fontFamily,
        fontSize: fontSize,
        width: width
      }
      }
      onDrop={
        e => this.handleDropImage(e)
      }
      />
    )
  }

  createSpellCheckPanel () {
    const panel = document.createElement('div')
    panel.className = 'panel bottom'
    panel.id = 'editor-bottom-panel'
    const dropdown = document.createElement('select')
    dropdown.title = 'Spellcheck'
    dropdown.className = styles['spellcheck-select']
    dropdown.addEventListener('change', (e) => spellcheck.setLanguage(this.editor, dropdown.value))
    const options = spellcheck.getAvailableDictionaries()
    for (const op of options) {
      const option = document.createElement('option')
      option.value = op.value
      option.innerHTML = op.label
      dropdown.appendChild(option)
    }
    panel.appendChild(dropdown)
    return panel
  }
}

CodeEditor.propTypes = {
  value: PropTypes.string,
  enableRulers: PropTypes.bool,
  rulers: PropTypes.arrayOf(Number),
  mode: PropTypes.string,
  className: PropTypes.string,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  autoDetect: PropTypes.bool,
  spellCheck: PropTypes.bool
}

CodeEditor.defaultProps = {
  readOnly: false,
  theme: 'xcode',
  keyMap: 'sublime',
  fontSize: 14,
  fontFamily: 'Monaco, Consolas',
  indentSize: 4,
  indentType: 'space',
  autoDetect: false,
  spellCheck: false
}
