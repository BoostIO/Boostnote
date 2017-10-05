import React, { PropTypes } from 'react'
import _ from 'lodash'
import CodeMirror from 'codemirror'
import path from 'path'
import copyImage from 'browser/main/lib/dataApi/copyImage'
import { findStorage } from 'browser/lib/findStorage'

CodeMirror.modeURL = '../node_modules/codemirror/mode/%N/%N.js'

const defaultEditorFontFamily = ['Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', 'monospace']

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

    this.changeHandler = (e) => this.handleChange(e)
    this.blurHandler = (editor, e) => {
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
  }

  componentDidMount () {
    this.value = this.props.value
    this.editor = CodeMirror(this.refs.root, {
      value: this.props.value,
      lineNumbers: true,
      lineWrapping: true,
      theme: this.props.theme,
      indentUnit: this.props.indentSize,
      tabSize: this.props.indentSize,
      indentWithTabs: this.props.indentType !== 'space',
      keyMap: this.props.keyMap,
      inputStyle: 'textarea',
      dragDrop: false,
      extraKeys: {
        Tab: function (cm) {
          const cursor = cm.getCursor()
          const line = cm.getLine(cursor.line)
          if (cm.somethingSelected()) cm.indentSelection('add')
          else {
            const tabs = cm.getOption('indentWithTabs')
            if (line.trimLeft() === '- ' || line.trimLeft() === '* ' || line.trimLeft() === '+ ') {
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
        Enter: 'newlineAndIndentContinueMarkdownList',
        'Ctrl-C': (cm) => {
          if (cm.getOption('keyMap').substr(0, 3) === 'vim') {
            document.execCommand('copy')
          }
          return CodeMirror.Pass
        }
      }
    })

    this.setMode(this.props.mode)

    this.editor.on('blur', this.blurHandler)
    this.editor.on('change', this.changeHandler)
    this.editor.on('paste', this.pasteHandler)

    let editorTheme = document.getElementById('editorTheme')
    editorTheme.addEventListener('load', this.loadStyleHandler)

    CodeMirror.Vim.defineEx('quit', 'q', this.quitEditor)
    CodeMirror.Vim.defineEx('q!', 'q!', this.quitEditor)
    CodeMirror.Vim.defineEx('wq', 'wq', this.quitEditor)
    CodeMirror.Vim.defineEx('qw', 'qw', this.quitEditor)
  }

  quitEditor () {
    document.querySelector('textarea').blur()
  }

  componentWillUnmount () {
    this.editor.off('blur', this.blurHandler)
    this.editor.off('change', this.changeHandler)
    this.editor.off('paste', this.pasteHandler)
    let editorTheme = document.getElementById('editorTheme')
    editorTheme.removeEventListener('load', this.loadStyleHandler)
  }

  componentDidUpdate (prevProps, prevState) {
    let needRefresh = false
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

    if (prevProps.indentSize !== this.props.indentSize) {
      this.editor.setOption('indentUnit', this.props.indentSize)
      this.editor.setOption('tabSize', this.props.indentSize)
    }
    if (prevProps.indentType !== this.props.indentType) {
      this.editor.setOption('indentWithTabs', this.props.indentType !== 'space')
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
    let cursor = this.editor.getCursor()
    this.editor.setValue(value)
    this.editor.setCursor(cursor)
  }

  handleDropImage (e) {
    e.preventDefault()
    const imagePath = e.dataTransfer.files[0].path
    const filename = path.basename(imagePath)

    copyImage(imagePath, this.props.storageKey).then((imagePath) => {
      const imageMd = `![${filename}](${path.join('/:storage', imagePath)})`
      this.insertImageMd(imageMd)
    })
  }

  insertImageMd (imageMd) {
    const textarea = this.editor.getInputField()
    const cm = this.editor
    cm.replaceSelection(`${textarea.value.substr(0, textarea.selectionStart)}${imageMd}${textarea.value.substr(textarea.selectionEnd)}`)
  }

  handlePaste (editor, e) {
    const dataTransferItem = e.clipboardData.items[0]
    if (!dataTransferItem.type.match('image')) return

    const blob = dataTransferItem.getAsFile()
    let reader = new FileReader()
    let base64data

    reader.readAsDataURL(blob)
    reader.onloadend = () => {
      base64data = reader.result.replace(/^data:image\/png;base64,/, '')
      base64data += base64data.replace('+', ' ')
      const binaryData = new Buffer(base64data, 'base64').toString('binary')
      const imageName = Math.random().toString(36).slice(-16)
      const storagePath = findStorage(this.props.storageKey).path
      const imagePath = path.join(`${storagePath}`, 'images', `${imageName}.png`)

      require('fs').writeFile(imagePath, binaryData, 'binary')
      const imageMd = `![${imageName}](${path.join('/:storage', `${imageName}.png`)})`
      this.insertImageMd(imageMd)
    }
  }

  render () {
    let { className, fontFamily, fontSize } = this.props
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
