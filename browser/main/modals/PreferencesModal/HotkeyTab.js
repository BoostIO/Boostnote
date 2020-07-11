import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ConfigTab.styl'
import ConfigManager from 'browser/main/lib/ConfigManager'
import { store } from 'browser/main/store'
import _ from 'lodash'
import i18n from 'browser/lib/i18n'

const electron = require('electron')
const ipc = electron.ipcRenderer

class HotkeyTab extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isHotkeyHintOpen: false,
      config: props.config,
      hotkeys: [
        {
          name: 'toggleMain',
          label: i18n.__('Show/Hide Boostnote')
        },
        {
          name: 'toggleMode',
          label: i18n.__('Toggle Editor Mode')
        },
        {
          name: 'toggleDirection',
          label: i18n.__('Toggle Direction')
        },
        {
          name: 'deleteNote',
          label: i18n.__('Delete Note')
        },
        {
          name: 'pasteSmartly',
          label: i18n.__('Paste HTML')
        },
        {
          name: 'prettifyMarkdown',
          label: i18n.__('Prettify Markdown')
        },
        {
          name: 'reload',
          label: i18n.__('Reload')
        },
        {
          name: 'devTool',
          label: i18n.__('Toggle Developer Tools')
        },
        {
          name: 'nextNode',
          label: i18n.__('Next Note')
        },
        {
          name: 'prevNode',
          label: i18n.__('Previous Note')
        },
        {
          name: 'focusSearch',
          label: i18n.__('Focus Search')
        },
        {
          name: 'fullScreen',
          label: i18n.__('Toggle Full Screen')
        },
        {
          name: 'toggleSideBar',
          label: i18n.__('Toggle Side Bar')
        },
        {
          name: 'actualSize',
          label: i18n.__('Actual Size')
        },
        {
          name: 'zoomIn',
          label: i18n.__('Zoom In')
        },
        {
          name: 'zoomOut',
          label: i18n.__('Zoom Out')
        },
        {
          name: 'toggleMenuBar',
          label: i18n.__('Toggle Menu Bar')
        },
        {
          name: 'insertDate',
          label: i18n.__('Insert Date')
        },
        {
          name: 'insertDateTime',
          label: i18n.__('Insert Date Time')
        }
      ]
    }
  }

  componentDidMount() {
    this.handleSettingDone = () => {
      this.setState({
        keymapAlert: {
          type: 'success',
          message: i18n.__('Successfully applied!')
        }
      })
    }
    this.handleSettingError = err => {
      if (
        this.state.config.hotkey.toggleMain === '' ||
        this.state.config.hotkey.toggleMode === '' ||
        this.state.config.hotkey.toggleDirection === ''
      ) {
        this.setState({
          keymapAlert: {
            type: 'success',
            message: i18n.__('Successfully applied!')
          }
        })
      } else {
        this.setState({
          keymapAlert: {
            type: 'error',
            message:
              err.message != null ? err.message : i18n.__('An error occurred!')
          }
        })
      }
    }
    this.oldHotkey = this.state.config.hotkey
    ipc.addListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.addListener('APP_SETTING_ERROR', this.handleSettingError)
  }

  componentWillUnmount() {
    ipc.removeListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.removeListener('APP_SETTING_ERROR', this.handleSettingError)
  }

  handleSaveButtonClick(e) {
    const newConfig = {
      hotkey: this.state.config.hotkey
    }

    ConfigManager.set(newConfig)

    store.dispatch({
      type: 'SET_UI',
      config: newConfig
    })
    this.clearMessage()
    this.props.haveToSave()
  }

  handleHintToggleButtonClick(e) {
    this.setState({
      isHotkeyHintOpen: !this.state.isHotkeyHintOpen
    })
  }

  handleHotkeyChange(e) {
    const { config, hotkeys } = this.state

    config.hotkey = {}
    hotkeys.forEach(({ name }) => {
      config.hotkey[name] = this.refs[name].value
    })

    if (_.isEqual(this.oldHotkey, config.hotkey)) {
      this.props.haveToSave()
    } else {
      this.props.haveToSave({
        tab: 'Hotkey',
        type: 'warning',
        message: i18n.__('Unsaved Changes!')
      })
    }
  }

  clearMessage() {
    _.debounce(() => {
      this.setState({
        keymapAlert: null
      })
    }, 2000)()
  }

  render() {
    const keymapAlert = this.state.keymapAlert
    const keymapAlertElement =
      keymapAlert != null ? (
        <p className={`alert ${keymapAlert.type}`}>{keymapAlert.message}</p>
      ) : null
    const { config, hotkeys } = this.state

    const rows = hotkeys.map(({ label, name }) => (
      <div styleName='group-section' key={name}>
        <div styleName='group-section-label'>{label}</div>
        <div styleName='group-section-control'>
          <input
            styleName='group-section-control-input'
            onChange={e => this.handleHotkeyChange(e)}
            ref={name}
            value={config.hotkey[name]}
            type='text'
          />
        </div>
      </div>
    ))

    return (
      <div styleName='root'>
        <div styleName='group'>
          <div styleName='group-header'>{i18n.__('Hotkeys')}</div>
          {rows}
          <div styleName='group-control'>
            <button
              styleName='group-control-leftButton'
              onClick={e => this.handleHintToggleButtonClick(e)}
            >
              {this.state.isHotkeyHintOpen
                ? i18n.__('Hide Help')
                : i18n.__('Help')}
            </button>
            <button
              styleName='group-control-rightButton'
              onClick={e => this.handleSaveButtonClick(e)}
            >
              {i18n.__('Save')}
            </button>
            {keymapAlertElement}
          </div>
          {this.state.isHotkeyHintOpen && (
            <div styleName='group-hint'>
              <p>{i18n.__('Available Keys')}</p>
              <ul>
                <li>
                  <code>0</code> to <code>9</code>
                </li>
                <li>
                  <code>A</code> to <code>Z</code>
                </li>
                <li>
                  <code>F1</code> to <code>F24</code>
                </li>
                <li>
                  Punctuations like <code>~</code>, <code>!</code>,{' '}
                  <code>@</code>, <code>#</code>, <code>$</code>, etc.
                </li>
                <li>
                  <code>Plus</code>
                </li>
                <li>
                  <code>Space</code>
                </li>
                <li>
                  <code>Backspace</code>
                </li>
                <li>
                  <code>Delete</code>
                </li>
                <li>
                  <code>Insert</code>
                </li>
                <li>
                  <code>Return</code> (or <code>Enter</code> as alias)
                </li>
                <li>
                  <code>Up</code>, <code>Down</code>, <code>Left</code> and{' '}
                  <code>Right</code>
                </li>
                <li>
                  <code>Home</code> and <code>End</code>
                </li>
                <li>
                  <code>PageUp</code> and <code>PageDown</code>
                </li>
                <li>
                  <code>Escape</code> (or <code>Esc</code> for short)
                </li>
                <li>
                  <code>VolumeUp</code>, <code>VolumeDown</code> and{' '}
                  <code>VolumeMute</code>
                </li>
                <li>
                  <code>MediaNextTrack</code>, <code>MediaPreviousTrack</code>,{' '}
                  <code>MediaStop</code> and <code>MediaPlayPause</code>
                </li>
                <li>
                  <code>Control</code> (or <code>Ctrl</code> for short)
                </li>
                <li>
                  <code>Shift</code>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }
}

HotkeyTab.propTypes = {
  dispatch: PropTypes.func,
  haveToSave: PropTypes.func
}

export default CSSModules(HotkeyTab, styles)
