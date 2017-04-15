import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ConfigTab.styl'
import ConfigManager from 'browser/main/lib/ConfigManager'
import store from 'browser/main/store'
import consts from 'browser/lib/consts'

const OSX = global.process.platform === 'darwin'

class UiTab extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      config: props.config
    }
  }

  handleUIChange (e) {
    let { config } = this.state

    config.ui = {
      theme: this.refs.uiTheme.value,
      disableDirectWrite: this.refs.uiD2w != null
        ? this.refs.uiD2w.checked
        : false
    }
    config.editor = {
      theme: this.refs.editorTheme.value,
      fontSize: this.refs.editorFontSize.value,
      fontFamily: this.refs.editorFontFamily.value,
      indentType: this.refs.editorIndentType.value,
      indentSize: this.refs.editorIndentSize.value,
      switchPreview: this.refs.editorSwitchPreview.value,
      keyMap: this.refs.editorKeyMap.value
    }
    config.preview = {
      fontSize: this.refs.previewFontSize.value,
      fontFamily: this.refs.previewFontFamily.value,
      codeBlockTheme: this.refs.previewCodeBlockTheme.value,
      lineNumber: this.refs.previewLineNumber.checked
    }

    this.setState({ config })
  }

  handleSaveUIClick (e) {
    const newConfig = {
      ui: this.state.config.ui,
      editor: this.state.config.editor,
      preview: this.state.config.preview
    }

    ConfigManager.set(newConfig)

    store.dispatch({
      type: 'SET_UI',
      config: newConfig
    })
  }

  render () {
    const themes = consts.THEMES
    const { config } = this.state

    return (
      <div styleName='root'>
        <div styleName='group'>
          <div styleName='group-header'>UI</div>

          <div styleName='group-header2'>Theme</div>

          <div styleName='group-section'>
            <div styleName='group-section-control'>
              <select value={config.ui.theme}
                onChange={(e) => this.handleUIChange(e)}
                ref='uiTheme'
              >
                <option value='default'>Light</option>
                <option value='dark'>Dark</option>
              </select>
            </div>
          </div>
          {
            global.process.platform === 'win32'
            ? <div styleName='group-checkBoxSection'>
              <label>
                <input onChange={(e) => this.handleUIChange(e)}
                  checked={this.state.config.ui.disableDirectWrite}
                  refs='uiD2w'
                  disabled={OSX}
                  type='checkbox'
                />
                Disable Direct Write(It will be applied after restarting)
              </label>
            </div>
            : null
          }
          <div styleName='group-header2'>Editor</div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              Editor Theme
            </div>
            <div styleName='group-section-control'>
              <select value={config.editor.theme}
                ref='editorTheme'
                onChange={(e) => this.handleUIChange(e)}
              >
                {
                  themes.map((theme) => {
                    return (<option value={theme} key={theme}>{theme}</option>)
                  })
                }
              </select>
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              Editor Font Size
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='editorFontSize'
                value={config.editor.fontSize}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              Editor Font Family
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='editorFontFamily'
                value={config.editor.fontFamily}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              Editor Indent Style
            </div>
            <div styleName='group-section-control'>
              <select value={config.editor.indentSize}
                ref='editorIndentSize'
                onChange={(e) => this.handleUIChange(e)}
              >
                <option value='1'>1</option>
                <option value='2'>2</option>
                <option value='4'>4</option>
                <option value='8'>8</option>
              </select>&nbsp;
              <select value={config.editor.indentType}
                ref='editorIndentType'
                onChange={(e) => this.handleUIChange(e)}
              >
                <option value='space'>Spaces</option>
                <option value='tab'>Tabs</option>
              </select>
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              Switching Preview
            </div>
            <div styleName='group-section-control'>
              <select value={config.editor.switchPreview}
                ref='editorSwitchPreview'
                onChange={(e) => this.handleUIChange(e)}
              >
                <option value='BLUR'>When Editor Blurred</option>
                <option value='RIGHTCLICK'>When Right Clicking</option>
              </select>
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              Editor Keymap
            </div>
            <div styleName='group-section-control'>
              <select value={config.editor.keyMap}
                ref='editorKeyMap'
                onChange={(e) => this.handleUIChange(e)}
              >
                <option value='sublime'>default</option>
                <option value='vim'>vim</option>
              </select>
              <span styleName='note-for-keymap'>Please reload boostnote after you change the keymap</span>
            </div>
          </div>

          <div styleName='group-header2'>Preview</div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              Preview Font Size
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                value={config.preview.fontSize}
                ref='previewFontSize'
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              Preview Font Family
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='previewFontFamily'
                value={config.preview.fontFamily}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>Code block Theme</div>
            <div styleName='group-section-control'>
              <select value={config.preview.codeBlockTheme}
                ref='previewCodeBlockTheme'
                onChange={(e) => this.handleUIChange(e)}
              >
                {
                  themes.map((theme) => {
                    return (<option value={theme} key={theme}>{theme}</option>)
                  })
                }
              </select>
            </div>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.preview.lineNumber}
                ref='previewLineNumber'
                type='checkbox'
              />&nbsp;
              Code block line numbering
            </label>
          </div>

          <div className='group-control'>
            <button styleName='group-control-rightButton'
              onClick={(e) => this.handleSaveUIClick(e)}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }
}

UiTab.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string
  }),
  dispatch: PropTypes.func
}

export default CSSModules(UiTab, styles)
