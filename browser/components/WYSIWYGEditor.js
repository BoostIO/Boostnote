import React from 'react'
import Editor from 'draft-js-plugins-editor'
import createMarkdownShortcutsPlugin from 'draft-js-markdown-shortcuts-plugin'
import { stateToMarkdown } from 'draft-js-export-markdown'
import markdown from 'browser/lib/markdown'
import { EditorState, convertFromHTML, ContentState } from 'draft-js'

import style from './WYSIWYGEditor.styl'
import CSSModules from 'browser/lib/CSSModules'

function buildStyle (fontSize) {
  return {
    fontSize: `${fontSize}px`
  }
}

const plugins = [createMarkdownShortcutsPlugin()]

class WYSIWYGEditor extends React.Component {
  constructor (props) {
    super(props)
    const content = convertFromHTML(markdown.render(props.value))
    const contentState = ContentState.createFromBlockArray(
      content.contentBlocks,
      content.entityMap
    )
    const initialEditorState = EditorState.createWithContent(contentState)
    this.state = {
      editorState: initialEditorState,
      markdown: props.value
    }
  }

  componentWillReceiveProps (props) {
    if (props.value === this.state.markdown) return
    const content = convertFromHTML(markdown.render(props.value))
    const contentState = ContentState.createFromBlockArray(
      content.contentBlocks,
      content.entityMap
    )
    const newEditorState = EditorState.createWithContent(contentState)
    this.setState({
      editorState: newEditorState
    })
  }

  handleOnChange (editorState) {
    const newMarkdown = stateToMarkdown(editorState.getCurrentContent())
    this.setState({
      editorState,
      markdown: newMarkdown
    }, () => { this.props.onChange(newMarkdown) })
  }

  focus () {
    this.editor.focus()
  }

  render () {
    const { config } = this.props
    const customStyle = buildStyle(config.preview.fontSize)
    return (
      <div styleName='root'
        style={customStyle}>
        <Editor
          ref={e => (this.editor = e)}
          editorState={this.state.editorState}
          onChange={e => this.handleOnChange(e)}
          plugins={plugins}
        />
      </div>
    )
  }
}

export default CSSModules(WYSIWYGEditor, style)
