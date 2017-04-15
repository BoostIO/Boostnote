import React, { PropTypes } from 'react'
import _ from 'lodash'
import CodeMirror from 'codemirror'
import path from 'path'

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
        Enter: (cm) => {
          const cursor = cm.getCursor()
          const line = cm.getLine(cursor.line)
          let bulletType
          if (line.trim().startsWith('- ')) {
            bulletType = 1 // dash
          } else if (line.trim().startsWith('* ')) {
            bulletType = 2 // star
          } else if (line.trim().startsWith('+ ')) {
            bulletType = 3 // plus
          } else {
            bulletType = 0 // not a bullet
          }
          const numberedListRegex = /^(\d+)\. .+/
          const match = line.trim().match(numberedListRegex)
          if (bulletType !== 0 || match) {
            cm.execCommand('newlineAndIndent')
            const range = {line: cursor.line + 1, ch: cm.getLine(cursor.line + 1).length}
            if (match) {
              cm.replaceRange((parseInt(match[1]) + 1) + '. ', range)
            } else if (bulletType === 1) {
              cm.replaceRange('- ', range)
            } else if (bulletType === 2) {
              cm.replaceRange('* ', range)
            } else if (bulletType === 3) {
              cm.replaceRange('+ ', range)
            }
          } else {
            cm.execCommand('newlineAndIndent')
          }
        }
      }
    })

    this.setMode(this.props.mode)

    this.editor.on('blur', this.blurHandler)
    this.editor.on('change', this.changeHandler)

    let editorTheme = document.getElementById('editorTheme')
    editorTheme.addEventListener('load', this.loadStyleHandler)
  }

  componentWillUnmount () {
    this.editor.off('blur', this.blurHandler)
    this.editor.off('change', this.changeHandler)
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
    const imageMd = `![${encodeURI(filename)}](${encodeURI(imagePath)})`
    this.insertImage(imageMd)
  }

  insertImage (imageMd) {
    const textarea = this.editor.getInputField()
    textarea.value = textarea.value.substr(0, textarea.selectionStart) + imageMd + textarea.value.substr(textarea.selectionEnd)
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
