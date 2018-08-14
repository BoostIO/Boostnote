import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'
import CodeMirror from 'codemirror'
import 'codemirror-mode-elixir'
import attachmentManagement from 'browser/main/lib/dataApi/attachmentManagement'
import convertModeName from 'browser/lib/convertModeName'
import { options, TableEditor } from '@susisu/mte-kernel'
import TextEditorInterface from 'browser/lib/TextEditorInterface'
import eventEmitter from 'browser/main/lib/eventEmitter'
import iconv from 'iconv-lite'
import crypto from 'crypto'
import consts from 'browser/lib/consts'
import fs from 'fs'
const { ipcRenderer } = require('electron')
import normalizeEditorFontFamily from 'browser/lib/normalizeEditorFontFamily'

CodeMirror.modeURL = '../node_modules/codemirror/mode/%N/%N.js'

const buildCMRulers = (rulers, enableRulers) =>
  enableRulers ? rulers.map(ruler => ({column: ruler})) : []

export default class CodeEditor extends React.Component {
  constructor (props) {
    super(props)

    this.scrollHandler = _.debounce(this.handleScroll.bind(this), 100, {leading: false, trailing: true})
    this.changeHandler = (e) => this.handleChange(e)
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

      const {storageKey, noteKey} = this.props
      attachmentManagement.deleteAttachmentsNotPresentInNote(this.editor.getValue(), storageKey, noteKey)
    }
    this.pasteHandler = (editor, e) => this.handlePaste(editor, e)
    this.loadStyleHandler = (e) => {
      this.editor.refresh()
    }
    this.searchHandler = (e, msg) => this.handleSearch(msg)
    this.searchState = null

    this.formatTable = () => this.handleFormatTable()
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
        query = new RegExp(query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'), 'gi')
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
    this.tableEditor.formatAll(options({textWidthOptions: {}}))
  }

  componentDidMount () {
    const { rulers, enableRulers } = this.props
    const expandSnippet = this.expandSnippet.bind(this)

    const defaultSnippet = [
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Dummy text',
        prefix: ['lorem', 'ipsum'],
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
      }
    ]
    if (!fs.existsSync(consts.SNIPPET_FILE)) {
      fs.writeFileSync(consts.SNIPPET_FILE, JSON.stringify(defaultSnippet, null, 4), 'utf8')
    }

    this.value = this.props.value
    this.editor = CodeMirror(this.refs.root, {
      rulers: buildCMRulers(rulers, enableRulers),
      value: this.props.value,
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
        pairs: '()[]{}\'\'""$$**``',
        triples: '```"""\'\'\'',
        explode: '[]{}``$$',
        override: true
      },
      extraKeys: {
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
            } else if (!charBeforeCursor.match(/\t|\s|\r|\n/) && cursor.ch > 1) {
              // text expansion on tab key if the char before is alphabet
              const snippets = JSON.parse(fs.readFileSync(consts.SNIPPET_FILE, 'utf8'))
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
        'Cmd-T': function (cm) {
          // Do nothing
        },
        Enter: 'boostNewLineAndIndentContinueMarkdownList',
        'Ctrl-C': (cm) => {
          if (cm.getOption('keyMap').substr(0, 3) === 'vim') {
            document.execCommand('copy')
          }
          return CodeMirror.Pass
        }
      }
    })

    this.setMode(this.props.mode)

    this.editor.on('focus', this.focusHandler)
    this.editor.on('blur', this.blurHandler)
    this.editor.on('change', this.changeHandler)
    this.editor.on('paste', this.pasteHandler)
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

    this.tableEditor = new TableEditor(new TextEditorInterface(this.editor))
    eventEmitter.on('code:format-table', this.formatTable)
  }

  expandSnippet (line, cursor, cm, snippets) {
    const wordBeforeCursor = this.getWordBeforeCursor(line, cursor.line, cursor.ch)
    const templateCursorString = ':{}'
    for (let i = 0; i < snippets.length; i++) {
      if (snippets[i].prefix.indexOf(wordBeforeCursor.text) !== -1) {
        if (snippets[i].content.indexOf(templateCursorString) !== -1) {
          const snippetLines = snippets[i].content.split('\n')
          let cursorLineNumber = 0
          let cursorLinePosition = 0
          for (let j = 0; j < snippetLines.length; j++) {
            const cursorIndex = snippetLines[j].indexOf(templateCursorString)
            if (cursorIndex !== -1) {
              cursorLineNumber = j
              cursorLinePosition = cursorIndex
              cm.replaceRange(
                snippets[i].content.replace(templateCursorString, ''),
                wordBeforeCursor.range.from,
                wordBeforeCursor.range.to
              )
              cm.setCursor({ line: cursor.line + cursorLineNumber, ch: cursorLinePosition })
            }
          }
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
        from: {line: lineNumber, ch: originCursorPosition},
        to: {line: lineNumber, ch: cursorPosition}
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
    const editorTheme = document.getElementById('editorTheme')
    editorTheme.removeEventListener('load', this.loadStyleHandler)

    eventEmitter.off('code:format-table', this.formatTable)
  }

  componentDidUpdate (prevProps, prevState) {
    let needRefresh = false
    const {rulers, enableRulers} = this.props
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

    if (prevProps.enableRulers !== enableRulers || prevProps.rulers !== rulers) {
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

    if (needRefresh) {
      this.editor.refresh()
    }
  }

  setMode (mode) {
    let syntax = CodeMirror.findModeByName(convertModeName(mode))
    if (syntax == null) syntax = CodeMirror.findModeByName('Plain Text')

    this.editor.setOption('mode', syntax.mime)
    CodeMirror.autoLoadMode(this.editor, syntax.mode)
  }

  handleChange (e) {
    this.value = this.editor.getValue()
    if (this.props.onChange) {
      this.props.onChange(e)
    }
  }

  moveCursorTo (row, col) {
  }

  scrollToLine (num) {
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
    const {storageKey, noteKey} = this.props
    attachmentManagement.handleAttachmentDrop(this, storageKey, noteKey, dropEvent)
  }

  insertAttachmentMd (imageMd) {
    this.editor.replaceSelection(imageMd)
  }

  handlePaste (editor, e) {
    const clipboardData = e.clipboardData
    const {storageKey, noteKey} = this.props
    const dataTransferItem = clipboardData.items[0]
    const pastedTxt = clipboardData.getData('text')
    const isURL = (str) => {
      const matcher = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/
      return matcher.test(str)
    }
    const isInLinkTag = (editor) => {
      const startCursor = editor.getCursor('start')
      const prevChar = editor.getRange(
        {line: startCursor.line, ch: startCursor.ch - 2},
        {line: startCursor.line, ch: startCursor.ch}
      )
      const endCursor = editor.getCursor('end')
      const nextChar = editor.getRange(
        {line: endCursor.line, ch: endCursor.ch},
        {line: endCursor.line, ch: endCursor.ch + 1}
      )
      return prevChar === '](' && nextChar === ')'
    }
    if (dataTransferItem.type.match('image')) {
      attachmentManagement.handlePastImageEvent(this, storageKey, noteKey, dataTransferItem)
    } else if (this.props.fetchUrlTitle && isURL(pastedTxt) && !isInLinkTag(editor)) {
      this.handlePasteUrl(e, editor, pastedTxt)
    }
    if (attachmentManagement.isAttachmentLink(pastedTxt)) {
      attachmentManagement.handleAttachmentLinkPaste(storageKey, noteKey, pastedTxt)
        .then((modifiedText) => {
          this.editor.replaceSelection(modifiedText)
        })
      e.preventDefault()
    }
  }

  handleScroll (e) {
    if (this.props.onScroll) {
      this.props.onScroll(e)
    }
  }

  handlePasteUrl (e, editor, pastedTxt) {
    e.preventDefault()
    const taggedUrl = `<${pastedTxt}>`
    editor.replaceSelection(taggedUrl)

    const isImageReponse = (response) => {
      return response.headers.has('content-type') &&
        response.headers.get('content-type').match(/^image\/.+$/)
    }
    const replaceTaggedUrl = (replacement) => {
      const value = editor.getValue()
      const cursor = editor.getCursor()
      const newValue = value.replace(taggedUrl, replacement)
      const newCursor = Object.assign({}, cursor, { ch: cursor.ch + newValue.length - value.length })
      editor.setValue(newValue)
      editor.setCursor(newCursor)
    }

    fetch(pastedTxt, {
      method: 'get'
    }).then((response) => {
      if (isImageReponse(response)) {
        return this.mapImageResponse(response, pastedTxt)
      } else {
        return this.mapNormalResponse(response, pastedTxt)
      }
    }).then((replacement) => {
      replaceTaggedUrl(replacement)
    }).catch((e) => {
      replaceTaggedUrl(pastedTxt)
    })
  }

  mapNormalResponse (response, pastedTxt) {
    return this.decodeResponse(response).then((body) => {
      return new Promise((resolve, reject) => {
        try {
          const parsedBody = (new window.DOMParser()).parseFromString(body, 'text/html')
          const linkWithTitle = `[${parsedBody.title}](${pastedTxt})`
          resolve(linkWithTitle)
        } catch (e) {
          reject(e)
        }
      })
    })
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
    return response.arrayBuffer().then((buff) => {
      return new Promise((resolve, reject) => {
        try {
          const charset = _charset !== undefined && iconv.encodingExists(_charset) ? _charset : 'utf-8'
          resolve(iconv.decode(new Buffer(buff), charset).toString())
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  extractContentTypeCharset (contentType) {
    return contentType.split(';').filter((str) => {
      return str.trim().toLowerCase().startsWith('charset')
    }).map((str) => {
      return str.replace(/['"]/g, '').split('=')[1]
    })[0]
  }

  render () {
    const {className, fontSize} = this.props
    const fontFamily = normalizeEditorFontFamily(this.props.fontFamily)
    const width = this.props.width
    return (
      <div
        className={className == null
          ? 'CodeEditor'
          : `CodeEditor ${className}`
        }
        ref='root'
        tabIndex='-1'
        style={{
          fontFamily,
          fontSize: fontSize,
          width: width
        }}
        onDrop={(e) => this.handleDropImage(e)}
      />
    )
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
  readOnly: PropTypes.bool
}

CodeEditor.defaultProps = {
  readOnly: false,
  theme: 'xcode',
  keyMap: 'sublime',
  fontSize: 14,
  fontFamily: 'Monaco, Consolas',
  indentSize: 4,
  indentType: 'space'
}
