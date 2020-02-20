import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './SnippetTab.styl'
import SnippetEditor from './SnippetEditor'
import i18n from 'browser/lib/i18n'
import dataApi from 'browser/main/lib/dataApi'
import SnippetList from './SnippetList'
import eventEmitter from 'browser/main/lib/eventEmitter'
import copy from 'copy-to-clipboard'

const path = require('path')

class SnippetTab extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currentSnippet: null
    }
    this.changeDelay = null
  }

  notify(title, options) {
    if (global.process.platform === 'win32') {
      options.icon = path.join(
        'file://',
        global.__dirname,
        '../../resources/app.png'
      )
    }
    return new window.Notification(title, options)
  }

  handleSnippetNameOrPrefixChange() {
    clearTimeout(this.changeDelay)
    this.changeDelay = setTimeout(() => {
      // notify the snippet editor that the name or prefix of snippet has been changed
      this.snippetEditor.onSnippetNameOrPrefixChanged(this.state.currentSnippet)
      eventEmitter.emit('snippetList:reload')
    }, 500)
  }

  handleSnippetSelect(snippet) {
    const { currentSnippet } = this.state
    if (snippet !== null) {
      if (currentSnippet === null || currentSnippet.id !== snippet.id) {
        dataApi.fetchSnippet(snippet.id).then(changedSnippet => {
          // notify the snippet editor to load the content of the new snippet
          this.snippetEditor.onSnippetChanged(changedSnippet)
          this.setState({ currentSnippet: changedSnippet })
        })
      }
    }
  }

  onSnippetNameOrPrefixChanged(e, type) {
    const newSnippet = Object.assign({}, this.state.currentSnippet)
    if (type === 'name') {
      newSnippet.name = e.target.value
    } else {
      newSnippet.prefix = e.target.value
    }
    this.setState({ currentSnippet: newSnippet })
    this.handleSnippetNameOrPrefixChange()
  }

  handleDeleteSnippet(snippet) {
    // prevent old snippet still display when deleted
    if (snippet.id === this.state.currentSnippet.id) {
      this.setState({ currentSnippet: null })
    }
  }

  handleCopySnippet(e) {
    const showCopyNotification = this.props.config.ui.showCopyNotification
    copy(this.state.currentSnippet.content)
    if (showCopyNotification) {
      this.notify('Saved to Clipboard!', {
        body: 'Paste it wherever you want!',
        silent: true
      })
    }
  }

  render() {
    const { config, storageKey } = this.props
    const { currentSnippet } = this.state

    let editorFontSize = parseInt(config.editor.fontSize, 10)
    if (!(editorFontSize > 0 && editorFontSize < 101)) editorFontSize = 14
    let editorIndentSize = parseInt(config.editor.indentSize, 10)
    if (!(editorFontSize > 0 && editorFontSize < 132)) editorIndentSize = 4
    return (
      <div styleName='root'>
        <div styleName='group-header'>{i18n.__('Snippets')}</div>
        <SnippetList
          onSnippetSelect={this.handleSnippetSelect.bind(this)}
          onSnippetDeleted={this.handleDeleteSnippet.bind(this)}
          currentSnippet={currentSnippet}
        />
        <div
          styleName='snippet-detail'
          style={{ visibility: currentSnippet ? 'visible' : 'hidden' }}
        >
          <div styleName='group-section'>
            <div styleName='group-section-control'>
              <button
                styleName='group-control-rightButton'
                onClick={e => this.handleCopySnippet(e)}
              >
                {i18n.__('Copy')}
              </button>
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>{i18n.__('Snippet name')}</div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                value={currentSnippet ? currentSnippet.name : ''}
                onChange={e => {
                  this.onSnippetNameOrPrefixChanged(e, 'name')
                }}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Snippet prefix')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                value={currentSnippet ? currentSnippet.prefix : ''}
                onChange={e => {
                  this.onSnippetNameOrPrefixChanged(e, 'prefix')
                }}
                type='text'
              />
            </div>
          </div>
          <div styleName='snippet-editor-section'>
            <SnippetEditor
              storageKey={storageKey}
              theme={config.editor.theme}
              keyMap={config.editor.keyMap}
              fontFamily={config.editor.fontFamily}
              fontSize={editorFontSize}
              indentType={config.editor.indentType}
              indentSize={editorIndentSize}
              enableRulers={config.editor.enableRulers}
              rulers={config.editor.rulers}
              displayLineNumbers={config.editor.displayLineNumbers}
              matchingPairs={config.editor.matchingPairs}
              matchingTriples={config.editor.matchingTriples}
              explodingPairs={config.editor.explodingPairs}
              scrollPastEnd={config.editor.scrollPastEnd}
              onRef={ref => {
                this.snippetEditor = ref
              }}
            />
          </div>
        </div>
      </div>
    )
  }
}

SnippetTab.PropTypes = {}

export default CSSModules(SnippetTab, styles)
