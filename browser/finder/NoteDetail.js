import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './NoteDetail.styl'
import MarkdownPreview from 'browser/components/MarkdownPreview'
import MarkdownEditor from 'browser/components/MarkdownEditor'
import CodeEditor from 'browser/components/CodeEditor'
import CodeMirror from 'codemirror'
import { findStorage } from 'browser/lib/findStorage'

const electron = require('electron')
const { clipboard } = electron
const path = require('path')

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
function notify (title, options) {
  if (global.process.platform === 'win32') {
    options.icon = path.join('file://', global.__dirname, '../../resources/app.png')
  }
  return new window.Notification(title, options)
}

class NoteDetail extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      snippetIndex: 0
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.note !== this.props.note) {
      this.setState({
        snippetIndex: 0
      }, () => {
        if (nextProps.note.type === 'SNIPPET_NOTE') {
          nextProps.note.snippets.forEach((snippet, index) => {
            this.refs['code-' + index].reload()
          })
        }
      })
    }
  }

  selectPriorSnippet () {
    let { note } = this.props
    if (note.type === 'SNIPPET_NOTE' && note.snippets.length > 1) {
      this.setState({
        snippetIndex: (this.state.snippetIndex + note.snippets.length - 1) % note.snippets.length
      })
    }
  }

  selectNextSnippet () {
    let { note } = this.props
    if (note.type === 'SNIPPET_NOTE' && note.snippets.length > 1) {
      this.setState({
        snippetIndex: (this.state.snippetIndex + 1) % note.snippets.length
      })
    }
  }

  saveToClipboard () {
    let { note } = this.props

    if (note.type === 'MARKDOWN_NOTE') {
      clipboard.writeText(note.content)
    } else {
      clipboard.writeText(note.snippets[this.state.snippetIndex].content)
    }

    notify('Saved to Clipboard!', {
      body: 'Paste it wherever you want!',
      silent: true
    })
  }

  handleTabButtonClick (e, index) {
    this.setState({
      snippetIndex: index
    })
  }

  render () {
    let { note, config } = this.props
    if (note == null) {
      return (
        <div styleName='root' />
      )
    }

    let editorFontSize = parseInt(config.editor.fontSize, 10)
    if (!(editorFontSize > 0 && editorFontSize < 101)) editorFontSize = 14
    let editorIndentSize = parseInt(config.editor.indentSize, 10)
    if (!(editorFontSize > 0 && editorFontSize < 132)) editorIndentSize = 4

    const storage = findStorage(note.storage)

    if (note.type === 'SNIPPET_NOTE') {
      let tabList = note.snippets.map((snippet, index) => {
        let isActive = this.state.snippetIndex === index
        return <div styleName={isActive
            ? 'tabList-item--active'
            : 'tabList-item'
          }
          key={index}
        >
          <button styleName='tabList-item-button'
            onClick={(e) => this.handleTabButtonClick(e, index)}
          >
            {snippet.name.trim().length > 0
              ? snippet.name
              : <span styleName='tabList-item-unnamed'>
                Unnamed
              </span>
            }
          </button>
        </div>
      })

      let viewList = note.snippets.map((snippet, index) => {
        let isActive = this.state.snippetIndex === index

        let syntax = CodeMirror.findModeByName(pass(snippet.mode))
        if (syntax == null) syntax = CodeMirror.findModeByName('Plain Text')

        return <div styleName='tabView'
          key={index}
          style={{zIndex: isActive ? 5 : 4}}
        >
          {snippet.mode === 'markdown'
            ? <MarkdownEditor styleName='tabView-content'
              config={config}
              value={snippet.content}
              ref={'code-' + index}
              storageKey={note.storage}
            />
            : <CodeEditor styleName='tabView-content'
              mode={snippet.mode}
              value={snippet.content}
              theme={config.editor.theme}
              fontFamily={config.editor.fontFamily}
              fontSize={editorFontSize}
              indentType={config.editor.indentType}
              indentSize={editorIndentSize}
              keyMap={config.editor.keyMap}
              readOnly
              ref={'code-' + index}
            />
          }
        </div>
      })

      return (
        <div styleName='root'>
          <div styleName='description'>
            <textarea styleName='description-textarea'
              style={{
                fontFamily: config.preview.fontFamily,
                fontSize: parseInt(config.preview.fontSize, 10)
              }}
              ref='description'
              placeholder='Description...'
              value={note.description}
              readOnly
            />
          </div>
          <div styleName='tabList'>
            {tabList}
          </div>
          {viewList}
        </div>
      )
    }

    return (
      <MarkdownPreview styleName='root'
        theme={config.ui.theme}
        fontSize={config.preview.fontSize}
        fontFamily={config.preview.fontFamily}
        codeBlockTheme={config.preview.codeBlockTheme}
        codeBlockFontFamily={config.editor.fontFamily}
        lineNumber={config.preview.lineNumber}
        indentSize={editorIndentSize}
        value={note.content}
        showCopyNotification={config.ui.showCopyNotification}
        storagePath={storage.path}
      />
    )
  }
}

NoteDetail.propTypes = {
}

export default CSSModules(NoteDetail, styles)
