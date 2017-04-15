import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './MarkdownEditor.styl'
import CodeEditor from 'browser/components/CodeEditor'
import MarkdownPreview from 'browser/components/MarkdownPreview'
import eventEmitter from 'browser/main/lib/eventEmitter'

class MarkdownEditor extends React.Component {
  constructor (props) {
    super(props)

    this.escapeFromEditor = ['Control', 'w']

    this.supportMdWordBold = ['Control', ':']

    this.state = {
      status: 'PREVIEW',
      renderValue: props.value,
      keyPressed: {},
      isLocked: false
    }

    this.lockEditorCode = () => this.handleLockEditor()
  }

  componentDidMount () {
    this.value = this.refs.code.value
    eventEmitter.on('editor:lock', this.lockEditorCode)
  }

  componentDidUpdate () {
    this.value = this.refs.code.value
  }

  componentWillReceiveProps (props) {
    if (props.value !== this.props.value) {
      this.queueRendering(props.value)
    }
  }

  componentWillUnmount () {
    this.cancelQueue()
    eventEmitter.off('editor:lock', this.lockEditorCode)
  }

  queueRendering (value) {
    clearTimeout(this.renderTimer)
    this.renderTimer = setTimeout(() => {
      this.renderPreview(value)
    }, 500)
  }

  cancelQueue () {
    clearTimeout(this.renderTimer)
  }

  renderPreview (value) {
    this.setState({
      renderValue: value
    })
  }

  handleChange (e) {
    this.value = this.refs.code.value
    this.props.onChange(e)
  }

  handleContextMenu (e) {
    let { config } = this.props
    if (config.editor.switchPreview === 'RIGHTCLICK') {
      let newStatus = this.state.status === 'PREVIEW'
        ? 'CODE'
        : 'PREVIEW'
      this.setState({
        status: newStatus
      }, () => {
        if (newStatus === 'CODE') {
          this.refs.code.focus()
        } else {
          this.refs.code.blur()
          this.refs.preview.focus()
        }
        eventEmitter.emit('topbar:togglelockbutton', this.state.status)
      })
    }
  }

  handleBlur (e) {
    if (this.state.isLocked) return
    this.setState({ keyPressed: [] })
    let { config } = this.props
    if (config.editor.switchPreview === 'BLUR') {
      let cursorPosition = this.refs.code.editor.getCursor()
      this.setState({
        status: 'PREVIEW'
      }, () => {
        this.refs.preview.focus()
        this.refs.preview.scrollTo(cursorPosition.line)
      })
      eventEmitter.emit('topbar:togglelockbutton', this.state.status)
    }
  }

  handlePreviewMouseDown (e) {
    this.previewMouseDownedAt = new Date()
  }

  handlePreviewMouseUp (e) {
    let { config } = this.props
    if (config.editor.switchPreview === 'BLUR' && new Date() - this.previewMouseDownedAt < 200) {
      this.setState({
        status: 'CODE'
      }, () => {
        this.refs.code.focus()
      })
      eventEmitter.emit('topbar:togglelockbutton', this.state.status)
    }
  }

  handleCheckboxClick (e) {
    e.preventDefault()
    e.stopPropagation()
    let idMatch = /checkbox-([0-9]+)/
    let checkedMatch = /\[x\]/i
    let uncheckedMatch = /\[ \]/
    if (idMatch.test(e.target.getAttribute('id'))) {
      let lineIndex = parseInt(e.target.getAttribute('id').match(idMatch)[1], 10) - 1
      let lines = this.refs.code.value
        .split('\n')

      let targetLine = lines[lineIndex]

      if (targetLine.match(checkedMatch)) {
        lines[lineIndex] = targetLine.replace(checkedMatch, '[ ]')
      }
      if (targetLine.match(uncheckedMatch)) {
        lines[lineIndex] = targetLine.replace(uncheckedMatch, '[x]')
      }
      this.refs.code.setValue(lines.join('\n'))
    }
  }

  focus () {
    if (this.state.status === 'PREVIEW') {
      this.setState({
        status: 'CODE'
      }, () => {
        this.refs.code.focus()
      })
    } else {
      this.refs.code.focus()
    }
    eventEmitter.emit('topbar:togglelockbutton', this.state.status)
  }

  reload () {
    this.refs.code.reload()
    this.cancelQueue()
    this.renderPreview(this.props.value)
  }

  handleKeyDown (e) {
    if (this.state.status !== 'CODE') return false
    const keyPressed = Object.assign(this.state.keyPressed, {
      [e.key]: true
    })
    this.setState({ keyPressed })
    let isNoteHandlerKey = (el) => { return this.state.keyPressed[el] }
    if (!this.state.isLocked && this.state.status === 'CODE' && this.escapeFromEditor.every(isNoteHandlerKey)) {
      document.activeElement.blur()
    }
    if (this.supportMdWordBold.every(isNoteHandlerKey)) {
      this.addMdBetweenWord('**')
    }
  }

  addMdBetweenWord (mdElement) {
    const currentCaret = this.refs.code.editor.getCursor()
    const word = this.refs.code.editor.findWordAt(currentCaret)
    const cmDoc = this.refs.code.editor.getDoc()
    cmDoc.replaceRange(mdElement, word.anchor)
    cmDoc.replaceRange(mdElement, { line: word.head.line, ch: word.head.ch + mdElement.length })
  }

  handleKeyUp (e) {
    const keyPressed = Object.assign(this.state.keyPressed, {
      [e.key]: false
    })
    this.setState({ keyPressed })
  }

  handleLockEditor () {
    this.setState({ isLocked: !this.state.isLocked })
  }

  render () {
    let { className, value, config } = this.props

    let editorFontSize = parseInt(config.editor.fontSize, 10)
    if (!(editorFontSize > 0 && editorFontSize < 101)) editorFontSize = 14
    let editorIndentSize = parseInt(config.editor.indentSize, 10)
    if (!(editorFontSize > 0 && editorFontSize < 132)) editorIndentSize = 4

    let previewStyle = {}
    if (this.props.ignorePreviewPointerEvents) previewStyle.pointerEvents = 'none'

    return (
      <div className={className == null
          ? 'MarkdownEditor'
          : `MarkdownEditor ${className}`
        }
        onContextMenu={(e) => this.handleContextMenu(e)}
        tabIndex='-1'
        onKeyDown={(e) => this.handleKeyDown(e)}
        onKeyUp={(e) => this.handleKeyUp(e)}
      >
        <CodeEditor styleName='codeEditor'
          ref='code'
          mode='GitHub Flavored Markdown'
          value={value}
          theme={config.editor.theme}
          keyMap={config.editor.keyMap}
          fontFamily={config.editor.fontFamily}
          fontSize={editorFontSize}
          indentType={config.editor.indentType}
          indentSize={editorIndentSize}
          onChange={(e) => this.handleChange(e)}
          onBlur={(e) => this.handleBlur(e)}
        />
        <MarkdownPreview styleName={this.state.status === 'PREVIEW'
            ? 'preview'
            : 'preview--hide'
          }
          style={previewStyle}
          theme={config.ui.theme}
          keyMap={config.editor.keyMap}
          fontSize={config.preview.fontSize}
          fontFamily={config.preview.fontFamily}
          codeBlockTheme={config.preview.codeBlockTheme}
          codeBlockFontFamily={config.editor.fontFamily}
          lineNumber={config.preview.lineNumber}
          indentSize={editorIndentSize}
          ref='preview'
          onContextMenu={(e) => this.handleContextMenu(e)}
          tabIndex='0'
          value={this.state.renderValue}
          onMouseUp={(e) => this.handlePreviewMouseUp(e)}
          onMouseDown={(e) => this.handlePreviewMouseDown(e)}
          onCheckboxClick={(e) => this.handleCheckboxClick(e)}
        />
      </div>
    )
  }
}

MarkdownEditor.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  ignorePreviewPointerEvents: PropTypes.bool
}

export default CSSModules(MarkdownEditor, styles)
