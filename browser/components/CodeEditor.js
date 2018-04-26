import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'
import CodeMirror from 'codemirror'
import 'codemirror-mode-elixir'
import attachmentManagement from 'browser/main/lib/dataApi/attachmentManagement'
import eventEmitter from 'browser/main/lib/eventEmitter'
import iconv from 'iconv-lite'

const { ipcRenderer } = require('electron')

CodeMirror.modeURL = '../node_modules/codemirror/mode/%N/%N.js'

const defaultEditorFontFamily = ['Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', 'monospace']
const buildCMRulers = (rulers, enableRulers) =>
  enableRulers ? rulers.map(ruler => ({ column: ruler })) : []

function pass (name) {
  switch (name) {
    case 'ejs':
      return 'Embedded Javascript'
    case 'html_ruby':
      return 'Embedded Ruby'
    case 'objectivec':
      return 'Objective C'
    case 'text':
      return 'Plain Text'
    default:
      return name
  }
}

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
    }
    this.pasteHandler = (editor, e) => this.handlePaste(editor, e)
    this.loadStyleHandler = (e) => {
      this.editor.refresh()
    }
    this.searchHandler = (e, msg) => this.handleSearch(msg)
    this.searchState = null
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

  componentDidMount () {
    const { rulers, enableRulers } = this.props
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
      autoCloseBrackets: true,
      extraKeys: {
        Tab: function (cm) {
          const cursor = cm.getCursor()
          const line = cm.getLine(cursor.line)
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
  }

  componentDidUpdate (prevProps, prevState) {
    let needRefresh = false
    const { rulers, enableRulers } = this.props
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
    let syntax = CodeMirror.findModeByName(pass(mode))
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
    const dataTransferItem = clipboardData.items[0]
    const pastedTxt = clipboardData.getData('text')
    const isURL = (str) => {
      const matcher = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/
      return matcher.test(str)
    }
    const isInLinkTag = (editor) => {
      const startCursor = editor.getCursor('start')
      const prevChar = editor.getRange(
        { line: startCursor.line, ch: startCursor.ch - 2 },
        { line: startCursor.line, ch: startCursor.ch }
      )
      const endCursor = editor.getCursor('end')
      const nextChar = editor.getRange(
        { line: endCursor.line, ch: endCursor.ch },
        { line: endCursor.line, ch: endCursor.ch + 1 }
      )
      return prevChar === '](' && nextChar === ')'
    }
    if (dataTransferItem.type.match('image')) {
      const {storageKey, noteKey} = this.props
      attachmentManagement.handlePastImageEvent(this, storageKey, noteKey, dataTransferItem)
    } else if (this.props.fetchUrlTitle && isURL(pastedTxt) && !isInLinkTag(editor)) {
      this.handlePasteUrl(e, editor, pastedTxt)
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

    fetch(pastedTxt, {
      method: 'get'
    }).then((response) => {
      return this.decodeResponse(response)
    }).then((response) => {
      const parsedResponse = (new window.DOMParser()).parseFromString(response, 'text/html')
      const value = editor.getValue()
      const cursor = editor.getCursor()
      const LinkWithTitle = `[${parsedResponse.title}](${pastedTxt})`
      const newValue = value.replace(taggedUrl, LinkWithTitle)
      editor.setValue(newValue)
      editor.setCursor(cursor)
    }).catch((e) => {
      const value = editor.getValue()
      const newValue = value.replace(taggedUrl, pastedTxt)
      const cursor = editor.getCursor()
      editor.setValue(newValue)
      editor.setCursor(cursor)
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
    const { className, fontSize } = this.props
    let fontFamily = this.props.fontFamily
    fontFamily = _.isString(fontFamily) && fontFamily.length > 0
      ? [fontFamily].concat(defaultEditorFontFamily)
      : defaultEditorFontFamily
    return (
      <div
        className={className == null
          ? 'CodeEditor'
          : `CodeEditor ${className}`
        }
        ref='root'
        tabIndex='-1'
        style={{
          fontFamily: fontFamily.join(', '),
          fontSize: fontSize
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
