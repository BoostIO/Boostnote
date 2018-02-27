import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ConfigTab.styl'
import ConfigManager from 'browser/main/lib/ConfigManager'
import store from 'browser/main/store'
import consts from 'browser/lib/consts'
import ReactCodeMirror from 'react-codemirror'
import CodeMirror from 'codemirror'
import 'codemirror-mode-elixir'
import _ from 'lodash'

const OSX = global.process.platform === 'darwin'

const electron = require('electron')
const ipc = electron.ipcRenderer

class UiTab extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      config: props.config,
      codemirrorTheme: props.config.editor.theme
    }
  }

  componentDidMount () {
    CodeMirror.autoLoadMode(this.codeMirrorInstance.getCodeMirror(), 'javascript')
    this.handleSettingDone = () => {
      this.setState({UiAlert: {
        type: 'success',
        message: 'Successfully applied!'
      }})
    }
    this.handleSettingError = (err) => {
      this.setState({UiAlert: {
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

  handleUIChange (e) {
    const { codemirrorTheme } = this.state
    let checkHighLight = document.getElementById('checkHighLight')

    if (checkHighLight === null) {
      checkHighLight = document.createElement('link')
      checkHighLight.setAttribute('id', 'checkHighLight')
      checkHighLight.setAttribute('rel', 'stylesheet')
      document.head.appendChild(checkHighLight)
    }

    const newConfig = {
      ui: {
        theme: this.refs.uiTheme.value,
        showCopyNotification: this.refs.showCopyNotification.checked,
        confirmDeletion: this.refs.confirmDeletion.checked,
        disableDirectWrite: this.refs.uiD2w != null
          ? this.refs.uiD2w.checked
          : false
      },
      editor: {
        theme: this.refs.editorTheme.value,
        fontSize: this.refs.editorFontSize.value,
        fontFamily: this.refs.editorFontFamily.value,
        indentType: this.refs.editorIndentType.value,
        indentSize: this.refs.editorIndentSize.value,
        displayLineNumbers: this.refs.editorDisplayLineNumbers.checked,
        switchPreview: this.refs.editorSwitchPreview.value,
        keyMap: this.refs.editorKeyMap.value,
        scrollPastEnd: this.refs.scrollPastEnd.checked,
        fetchUrlTitle: this.refs.editorFetchUrlTitle.checked
      },
      preview: {
        fontSize: this.refs.previewFontSize.value,
        fontFamily: this.refs.previewFontFamily.value,
        codeBlockTheme: this.refs.previewCodeBlockTheme.value,
        lineNumber: this.refs.previewLineNumber.checked,
        latexInlineOpen: this.refs.previewLatexInlineOpen.value,
        latexInlineClose: this.refs.previewLatexInlineClose.value,
        latexBlockOpen: this.refs.previewLatexBlockOpen.value,
        latexBlockClose: this.refs.previewLatexBlockClose.value,
        scrollPastEnd: this.refs.previewScrollPastEnd.checked
      }
    }

    const newCodemirrorTheme = this.refs.editorTheme.value

    if (newCodemirrorTheme !== codemirrorTheme) {
      checkHighLight.setAttribute('href', `../node_modules/codemirror/theme/${newCodemirrorTheme.split(' ')[0]}.css`)
    }
    this.setState({ config: newConfig, codemirrorTheme: newCodemirrorTheme }, () => {
      const {ui, editor, preview} = this.props.config
      this.currentConfig = {ui, editor, preview}
      if (_.isEqual(this.currentConfig, this.state.config)) {
        this.props.haveToSave()
      } else {
        this.props.haveToSave({
          tab: 'UI',
          type: 'warning',
          message: 'You have to save!'
        })
      }
    })
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
    this.clearMessage()
    this.props.haveToSave()
  }

  clearMessage () {
    _.debounce(() => {
      this.setState({
        UiAlert: null
      })
    }, 2000)()
  }

  render () {
    const UiAlert = this.state.UiAlert
    const UiAlertElement = UiAlert != null
      ? <p className={`alert ${UiAlert.type}`}>
        {UiAlert.message}
      </p>
      : null

    const themes = consts.THEMES
    const { config, codemirrorTheme } = this.state
    const codemirrorSampleCode = 'function iamHappy (happy) {\n\tif (happy) {\n\t  console.log("I am Happy!")\n\t} else {\n\t  console.log("I am not Happy!")\n\t}\n};'
    return (
      <div styleName='root'>
        <div styleName='group'>
          <div styleName='group-header'>Interface</div>

          <div styleName='group-section'>
            Interface Theme
            <div styleName='group-section-control'>
              <select value={config.ui.theme}
                onChange={(e) => this.handleUIChange(e)}
                ref='uiTheme'
              >
                <option value='default'>Default</option>
                <option value='white'>White</option>
                <option value='solarized-dark'>Solarized Dark</option>
                <option value='dark'>Dark</option>
              </select>
            </div>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.ui.showCopyNotification}
                ref='showCopyNotification'
                type='checkbox'
              />&nbsp;
              Show &quot;Saved to Clipboard&quot; notification when copying
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.ui.confirmDeletion}
                ref='confirmDeletion'
                type='checkbox'
              />&nbsp;
              Show a confirmation dialog when deleting notes
            </label>
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
                />&nbsp;
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
              <div styleName='code-mirror'>
                <ReactCodeMirror ref={e => (this.codeMirrorInstance = e)} value={codemirrorSampleCode} options={{ lineNumbers: true, readOnly: true, mode: 'javascript', theme: codemirrorTheme }} />
              </div>
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
              Switch to Preview
            </div>
            <div styleName='group-section-control'>
              <select value={config.editor.switchPreview}
                ref='editorSwitchPreview'
                onChange={(e) => this.handleUIChange(e)}
              >
                <option value='BLUR'>When Editor Blurred</option>
                <option value='DBL_CLICK'>When Editor Blurred, Edit On Double Click</option>
                <option value='RIGHTCLICK'>On Right Click</option>
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
                <option value='emacs'>emacs</option>
              </select>
              <p styleName='note-for-keymap'>⚠️ Please restart boostnote after you change the keymap</p>
            </div>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.editor.displayLineNumbers}
                ref='editorDisplayLineNumbers'
                type='checkbox'
              />&nbsp;
              Show line numbers in the editor
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.editor.scrollPastEnd}
                ref='scrollPastEnd'
                type='checkbox'
              />&nbsp;
              Allow editor to scroll past the last line
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.editor.fetchUrlTitle}
                ref='editorFetchUrlTitle'
                type='checkbox'
              />&nbsp;
              Bring in web page title when pasting URL on editor
            </label>
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
                checked={this.state.config.preview.scrollPastEnd}
                ref='previewScrollPastEnd'
                type='checkbox'
              />&nbsp;
              Allow preview to scroll past the last line
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.preview.lineNumber}
                ref='previewLineNumber'
                type='checkbox'
              />&nbsp;
              Show line numbers for preview code blocks
            </label>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              LaTeX Inline Open Delimiter
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='previewLatexInlineOpen'
                value={config.preview.latexInlineOpen}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              LaTeX Inline Close Delimiter
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='previewLatexInlineClose'
                value={config.preview.latexInlineClose}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              LaTeX Block Open Delimiter
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='previewLatexBlockOpen'
                value={config.preview.latexBlockOpen}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              LaTeX Block Close Delimiter
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='previewLatexBlockClose'
                value={config.preview.latexBlockClose}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>

          <div styleName='group-control'>
            <button styleName='group-control-rightButton'
              onClick={(e) => this.handleSaveUIClick(e)}>Save
            </button>
            {UiAlertElement}
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
  dispatch: PropTypes.func,
  haveToSave: PropTypes.func
}

export default CSSModules(UiTab, styles)
