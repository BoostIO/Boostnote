import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ConfigTab.styl'
import hljsTheme from 'browser/lib/hljsThemes'
import ConfigManager from 'browser/main/lib/ConfigManager'
import store from 'browser/main/store'

const electron = require('electron')
const ipc = electron.ipcRenderer
const ace = window.ace

const OSX = global.process.platform === 'darwin'

class ConfigTab extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      isHotkeyHintOpen: false,
      config: props.config
    }
  }

  componentDidMount () {
    this.handleSettingDone = () => {
      this.setState({keymapAlert: {
        type: 'success',
        message: 'Successfully applied!'
      }})
    }
    this.handleSettingError = (err) => {
      this.setState({keymapAlert: {
        type: 'error',
        message: err.message != null ? err.message : 'Error occurs!'
      }})
    }
    ipc.addListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.addListener('APP_SETTING_ERROR', this.handleSettingError)
  }

  componentWillUnmount () {
    ipc.removeListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.removeListener('APP_SETTING_ERROR', this.handleSettingError)
  }

  handleSaveButtonClick (e) {
    let newConfig = {
      hotkey: this.state.config.hotkey
    }

    ConfigManager.set(newConfig)

    store.dispatch({
      type: 'SET_UI',
      config: newConfig
    })
  }

  handleKeyDown (e) {
    if (e.keyCode === 13) {
      this.submitHotKey()
    }
  }

  handleConfigKeyDown (e) {
    if (e.keyCode === 13) {
      this.submitConfig()
    }
  }

  handleLineNumberingClick (e) {
    let config = this.state.config

    config['preview-line-number'] = e.target.checked
    this.setState({
      config
    })
  }

  handleDisableDirectWriteClick (e) {
    let config = this.state.config
    config['disable-direct-write'] = e.target.checked
    this.setState({
      config
    })
  }

  handleHintToggleButtonClick (e) {
    this.setState({
      isHotkeyHintOpen: !this.state.isHotkeyHintOpen
    })
  }

  handleHotkeyChange (e) {
    let { config } = this.state
    config.hotkey = {
      toggleFinder: this.refs.toggleFinder.value,
      toggleMain: this.refs.toggleMain.value
    }
    this.setState({
      config
    })
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
      switchPreview: this.refs.editorSwitchPreview.value
    }
    config.preview = {
      fontSize: this.refs.previewFontSize.value,
      fontFamily: this.refs.previewFontFamily.value,
      codeBlockTheme: this.refs.previewCodeBlockTheme.value,
      lineNumber: this.refs.previewLineNumber.checked
    }

    this.setState({
      config
    })
  }

  handleSaveUIClick (e) {
    let newConfig = {
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
    let keymapAlert = this.state.keymapAlert
    let keymapAlertElement = keymapAlert != null
      ? <p className={`alert ${keymapAlert.type}`}>
        {keymapAlert.message}
      </p>
      : null
    let aceThemeList = ace.require('ace/ext/themelist')
    let hljsThemeList = hljsTheme()
    let { config } = this.state

    return (
      <div styleName='root'>
        <div styleName='group'>
          <div styleName='group-header'>Hotkey</div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>Toggle Main</div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                onChange={(e) => this.handleHotkeyChange(e)}
                ref='toggleMain'
                value={config.hotkey.toggleMain}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>Toggle Finder(popup)</div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                onChange={(e) => this.handleHotkeyChange(e)}
                ref='toggleFinder'
                value={config.hotkey.toggleFinder}
                type='text'
                disabled
              />
            </div>
          </div>
          <div styleName='group-control'>
            <button styleName='group-control-leftButton'
              onClick={(e) => this.handleHintToggleButtonClick(e)}
            >
              {this.state.isHotkeyHintOpen
                ? 'Hide Hint'
                : 'Show Hint'
              }
            </button>
            <button styleName='group-control-rightButton'
              onClick={(e) => this.handleSaveButtonClick(e)}>Save Hotkey
            </button>
            {keymapAlertElement}
          </div>
          {this.state.isHotkeyHintOpen &&
            <div styleName='group-hint'>
              <p>Available Keys</p>
              <ul>
                <li><code>0</code> to <code>9</code></li>
                <li><code>A</code> to <code>Z</code></li>
                <li><code>F1</code> to <code>F24</code></li>
                <li>Punctuations like <code>~</code>, <code>!</code>, <code>@</code>, <code>#</code>, <code>$</code>, etc.</li>
                <li><code>Plus</code></li>
                <li><code>Space</code></li>
                <li><code>Backspace</code></li>
                <li><code>Delete</code></li>
                <li><code>Insert</code></li>
                <li><code>Return</code> (or <code>Enter</code> as alias)</li>
                <li><code>Up</code>, <code>Down</code>, <code>Left</code> and <code>Right</code></li>
                <li><code>Home</code> and <code>End</code></li>
                <li><code>PageUp</code> and <code>PageDown</code></li>
                <li><code>Escape</code> (or <code>Esc</code> for short)</li>
                <li><code>VolumeUp</code>, <code>VolumeDown</code> and <code>VolumeMute</code></li>
                <li><code>MediaNextTrack</code>, <code>MediaPreviousTrack</code>, <code>MediaStop</code> and <code>MediaPlayPause</code></li>
              </ul>
            </div>
          }
        </div>

        <div styleName='group'>
          <div styleName='group-header'>UI</div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>Theme</div>
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
                  aceThemeList.themes.map((theme) => {
                    return (<option value={theme.name} key={theme.name}>{theme.caption}</option>)
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
                  hljsThemeList.map((theme) => {
                    return (<option value={theme.name} key={theme.name}>{theme.caption}</option>)
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
              Save UI Config
            </button>
          </div>
        </div>
      </div>
    )
  }
}

ConfigTab.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string
  }),
  dispatch: PropTypes.func
}

export default CSSModules(ConfigTab, styles)
