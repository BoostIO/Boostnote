import React from 'react'
import CodeEditor from 'browser/components/CodeEditor'
import MarkdownPreview from 'browser/components/MarkdownPreview'
import { findStorage } from 'browser/lib/findStorage'
import _ from 'lodash'

import styles from './MarkdownSplitEditor.styl'
import CSSModules from 'browser/lib/CSSModules'

class MarkdownSplitEditor extends React.Component {
  constructor(props) {
    super(props)
    this.value = props.value
    this.focus = () => this.refs.code.focus()
    this.reload = () => this.refs.code.reload()
    this.userScroll = true
    this.state = {
      isSliderFocused: false,
      codeEditorWidthInPercent: 50,
      codeEditorHeightInPercent: 50
    }
  }

  setValue(value) {
    this.refs.code.setValue(value)
  }

  handleOnChange(e) {
    this.value = this.refs.code.value
    this.props.onChange(e)
  }

  handleScroll(e) {
    if (!this.props.config.preview.scrollSync) return

    const previewDoc = _.get(
      this,
      'refs.preview.refs.root.contentWindow.document'
    )
    const codeDoc = _.get(this, 'refs.code.editor.doc')
    let srcTop, srcHeight, targetTop, targetHeight

    if (this.userScroll) {
      if (e.doc) {
        srcTop = _.get(e, 'doc.scrollTop')
        srcHeight = _.get(e, 'doc.height')
        targetTop = _.get(previewDoc, 'body.scrollTop')
        targetHeight = _.get(previewDoc, 'body.scrollHeight')
      } else {
        srcTop = _.get(previewDoc, 'body.scrollTop')
        srcHeight = _.get(previewDoc, 'body.scrollHeight')
        targetTop = _.get(codeDoc, 'scrollTop')
        targetHeight = _.get(codeDoc, 'height')
      }

      const distance = (targetHeight * srcTop) / srcHeight - targetTop
      const framerate = 1000 / 60
      const frames = 20
      const refractory = frames * framerate

      this.userScroll = false

      let frame = 0
      let scrollPos, time
      const timer = setInterval(() => {
        time = frame / frames
        scrollPos =
          time < 0.5
            ? 2 * time * time // ease in
            : -1 + (4 - 2 * time) * time // ease out
        if (e.doc)
          _.set(previewDoc, 'body.scrollTop', targetTop + scrollPos * distance)
        else
          _.get(this, 'refs.code.editor').scrollTo(
            0,
            targetTop + scrollPos * distance
          )
        if (frame >= frames) {
          clearInterval(timer)
          setTimeout(() => {
            this.userScroll = true
          }, refractory)
        }
        frame++
      }, framerate)
    }
  }

  handleCheckboxClick(e) {
    e.preventDefault()
    e.stopPropagation()
    const idMatch = /checkbox-([0-9]+)/
    const checkedMatch = /^(\s*>?)*\s*[+\-*] \[x]/i
    const uncheckedMatch = /^(\s*>?)*\s*[+\-*] \[ ]/
    const checkReplace = /\[x]/i
    const uncheckReplace = /\[ ]/
    if (idMatch.test(e.target.getAttribute('id'))) {
      const lineIndex =
        parseInt(e.target.getAttribute('id').match(idMatch)[1], 10) - 1
      const lines = this.refs.code.value.split('\n')

      const targetLine = lines[lineIndex]
      let newLine = targetLine

      if (targetLine.match(checkedMatch)) {
        newLine = targetLine.replace(checkReplace, '[ ]')
      }
      if (targetLine.match(uncheckedMatch)) {
        newLine = targetLine.replace(uncheckReplace, '[x]')
      }
      this.refs.code.setLineContent(lineIndex, newLine)
    }
  }

  handleMouseMove(e) {
    if (this.state.isSliderFocused) {
      const rootRect = this.refs.root.getBoundingClientRect()
      if (this.props.isStacking) {
        const rootHeight = rootRect.height
        const offset = rootRect.top
        let newCodeEditorHeightInPercent =
          ((e.pageY - offset) / rootHeight) * 100

        // limit minSize to 10%, maxSize to 90%
        if (newCodeEditorHeightInPercent <= 10) {
          newCodeEditorHeightInPercent = 10
        }

        if (newCodeEditorHeightInPercent >= 90) {
          newCodeEditorHeightInPercent = 90
        }

        this.setState({
          codeEditorHeightInPercent: newCodeEditorHeightInPercent
        })
      } else {
        const rootWidth = rootRect.width
        const offset = rootRect.left
        let newCodeEditorWidthInPercent = ((e.pageX - offset) / rootWidth) * 100

        // limit minSize to 10%, maxSize to 90%
        if (newCodeEditorWidthInPercent <= 10) {
          newCodeEditorWidthInPercent = 10
        }

        if (newCodeEditorWidthInPercent >= 90) {
          newCodeEditorWidthInPercent = 90
        }

        this.setState({
          codeEditorWidthInPercent: newCodeEditorWidthInPercent
        })
      }
    }
  }

  handleMouseUp(e) {
    e.preventDefault()
    this.setState({
      isSliderFocused: false
    })
  }

  handleMouseDown(e) {
    e.preventDefault()
    this.setState({
      isSliderFocused: true
    })
  }

  render() {
    const {
      config,
      value,
      storageKey,
      noteKey,
      linesHighlighted,
      isStacking,
      RTL
    } = this.props
    let storage
    try {
      storage = findStorage(storageKey)
    } catch (e) {
      return <div />
    }

    let editorStyle = {}
    let previewStyle = {}
    let sliderStyle = {}

    let editorFontSize = parseInt(config.editor.fontSize, 10)
    if (!(editorFontSize > 0 && editorFontSize < 101)) editorFontSize = 14
    editorStyle.fontSize = editorFontSize

    let editorIndentSize = parseInt(config.editor.indentSize, 10)
    if (!(editorStyle.fontSize > 0 && editorStyle.fontSize < 132))
      editorIndentSize = 4
    editorStyle.indentSize = editorIndentSize

    editorStyle = Object.assign(
      editorStyle,
      isStacking
        ? {
            width: '100%',
            height: `${this.state.codeEditorHeightInPercent}%`
          }
        : {
            width: `${this.state.codeEditorWidthInPercent}%`,
            height: '100%'
          }
    )

    previewStyle = Object.assign(
      previewStyle,
      isStacking
        ? {
            width: '100%',
            height: `${100 - this.state.codeEditorHeightInPercent}%`
          }
        : {
            width: `${100 - this.state.codeEditorWidthInPercent}%`,
            height: '100%'
          }
    )

    sliderStyle = Object.assign(
      sliderStyle,
      isStacking
        ? {
            left: 0,
            top: `${this.state.codeEditorHeightInPercent}%`
          }
        : {
            left: `${this.state.codeEditorWidthInPercent}%`,
            top: 0
          }
    )

    if (this.props.ignorePreviewPointerEvents || this.state.isSliderFocused)
      previewStyle.pointerEvents = 'none'

    return (
      <div
        styleName='root'
        ref='root'
        onMouseMove={e => this.handleMouseMove(e)}
        onMouseUp={e => this.handleMouseUp(e)}
      >
        <CodeEditor
          ref='code'
          width={editorStyle.width}
          height={editorStyle.height}
          mode='Boost Flavored Markdown'
          value={value}
          theme={config.editor.theme}
          keyMap={config.editor.keyMap}
          fontFamily={config.editor.fontFamily}
          fontSize={editorStyle.fontSize}
          displayLineNumbers={config.editor.displayLineNumbers}
          lineWrapping
          matchingPairs={config.editor.matchingPairs}
          matchingTriples={config.editor.matchingTriples}
          explodingPairs={config.editor.explodingPairs}
          indentType={config.editor.indentType}
          indentSize={editorStyle.indentSize}
          enableRulers={config.editor.enableRulers}
          rulers={config.editor.rulers}
          scrollPastEnd={config.editor.scrollPastEnd}
          fetchUrlTitle={config.editor.fetchUrlTitle}
          enableTableEditor={config.editor.enableTableEditor}
          storageKey={storageKey}
          noteKey={noteKey}
          linesHighlighted={linesHighlighted}
          onChange={e => this.handleOnChange(e)}
          onScroll={this.handleScroll.bind(this)}
          spellCheck={config.editor.spellcheck}
          enableSmartPaste={config.editor.enableSmartPaste}
          hotkey={config.hotkey}
          switchPreview={config.editor.switchPreview}
          enableMarkdownLint={config.editor.enableMarkdownLint}
          customMarkdownLintConfig={config.editor.customMarkdownLintConfig}
          deleteUnusedAttachments={config.editor.deleteUnusedAttachments}
          RTL={RTL}
        />
        <div
          styleName={isStacking ? 'slider-hoz' : 'slider'}
          style={{ left: sliderStyle.left, top: sliderStyle.top }}
          onMouseDown={e => this.handleMouseDown(e)}
        >
          <div styleName='slider-hitbox' />
        </div>
        <MarkdownPreview
          ref='preview'
          style={previewStyle}
          theme={config.ui.theme}
          keyMap={config.editor.keyMap}
          fontSize={config.preview.fontSize}
          fontFamily={config.preview.fontFamily}
          codeBlockTheme={config.preview.codeBlockTheme}
          codeBlockFontFamily={config.editor.fontFamily}
          lineNumber={config.preview.lineNumber}
          scrollPastEnd={config.preview.scrollPastEnd}
          smartQuotes={config.preview.smartQuotes}
          smartArrows={config.preview.smartArrows}
          breaks={config.preview.breaks}
          sanitize={config.preview.sanitize}
          mermaidHTMLLabel={config.preview.mermaidHTMLLabel}
          tabInde='0'
          value={value}
          onCheckboxClick={e => this.handleCheckboxClick(e)}
          onScroll={this.handleScroll.bind(this)}
          showCopyNotification={config.ui.showCopyNotification}
          storagePath={storage.path}
          noteKey={noteKey}
          customCSS={config.preview.customCSS}
          allowCustomCSS={config.preview.allowCustomCSS}
          lineThroughCheckbox={config.preview.lineThroughCheckbox}
          RTL={RTL}
        />
      </div>
    )
  }
}

export default CSSModules(MarkdownSplitEditor, styles)
