import CodeMirror from 'codemirror'
import React from 'react'
import _ from 'lodash'
import styles from './SnippetTab.styl'
import CSSModules from 'browser/lib/CSSModules'
import dataApi from 'browser/main/lib/dataApi'
import snippetManager from '../../../lib/SnippetManager'

const defaultEditorFontFamily = [
  'Monaco',
  'Menlo',
  'Ubuntu Mono',
  'Consolas',
  'source-code-pro',
  'monospace'
]
const buildCMRulers = (rulers, enableRulers) =>
  enableRulers ? rulers.map(ruler => ({ column: ruler })) : []

class SnippetEditor extends React.Component {
  componentDidMount() {
    this.props.onRef(this)
    const { rulers, enableRulers } = this.props
    this.cm = CodeMirror(this.refs.root, {
      rulers: buildCMRulers(rulers, enableRulers),
      lineNumbers: this.props.displayLineNumbers,
      lineWrapping: true,
      theme: this.props.theme,
      indentUnit: this.props.indentSize,
      tabSize: this.props.indentSize,
      indentWithTabs: this.props.indentType !== 'space',
      keyMap: this.props.keyMap,
      scrollPastEnd: this.props.scrollPastEnd,
      dragDrop: false,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      autoCloseBrackets: {
        pairs: this.props.matchingPairs,
        triples: this.props.matchingTriples,
        explode: this.props.explodingPairs,
        override: true
      },
      mode: 'null'
    })
    this.cm.setSize('100%', '100%')
    let changeDelay = null

    this.cm.on('change', () => {
      this.snippet.content = this.cm.getValue()

      clearTimeout(changeDelay)
      changeDelay = setTimeout(() => {
        this.saveSnippet()
      }, 500)
    })
  }

  componentWillUnmount() {
    this.props.onRef(undefined)
  }

  onSnippetChanged(newSnippet) {
    this.snippet = newSnippet
    this.cm.setValue(this.snippet.content)
  }

  onSnippetNameOrPrefixChanged(newSnippet) {
    this.snippet.name = newSnippet.name
    this.snippet.prefix = newSnippet.prefix
      .toString()
      .replace(/\s/g, '')
      .split(',')
    this.saveSnippet()
  }

  saveSnippet() {
    dataApi
      .updateSnippet(this.snippet)
      .then(snippets => snippetManager.assignSnippets(snippets))
      .catch(err => {
        throw err
      })
  }

  render() {
    const { fontSize } = this.props
    let fontFamily = this.props.fontFamily
    fontFamily =
      _.isString(fontFamily) && fontFamily.length > 0
        ? [fontFamily].concat(defaultEditorFontFamily)
        : defaultEditorFontFamily
    return (
      <div
        styleName='SnippetEditor'
        ref='root'
        tabIndex='-1'
        style={{
          fontFamily: fontFamily.join(', '),
          fontSize: fontSize
        }}
      />
    )
  }
}

SnippetEditor.defaultProps = {
  readOnly: false,
  theme: 'xcode',
  keyMap: 'sublime',
  fontSize: 14,
  fontFamily: 'Monaco, Consolas',
  indentSize: 4,
  indentType: 'space'
}

export default CSSModules(SnippetEditor, styles)
