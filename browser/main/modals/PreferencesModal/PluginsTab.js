import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ConfigTab.styl'
import ConfigManager from 'browser/main/lib/ConfigManager'
import { store } from 'browser/main/store'
import _ from 'lodash'
import i18n from 'browser/lib/i18n'
import { sync as commandExists } from 'command-exists'
const electron = require('electron')
const ipc = electron.ipcRenderer
const { remote } = electron
const { dialog } = remote
class PluginsTab extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      config: props.config
    }
  }

  componentDidMount() {
    this.handleSettingDone = () => {
      this.setState({
        pluginsAlert: {
          type: 'success',
          message: i18n.__('Successfully applied!')
        }
      })
    }
    this.handleSettingError = err => {
      this.setState({
        pluginsAlert: {
          type: 'error',
          message:
            err.message != null ? err.message : i18n.__('An error occurred!')
        }
      })
    }
    this.oldWakatimeConfig = this.state.config.wakatime
    ipc.addListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.addListener('APP_SETTING_ERROR', this.handleSettingError)
  }

  componentWillUnmount() {
    ipc.removeListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.removeListener('APP_SETTING_ERROR', this.handleSettingError)
  }

  checkWakatimePluginRequirement() {
    const { wakatime } = this.state.config
    if (wakatime.isActive && !commandExists('wakatime')) {
      this.setState({
        wakatimePluginAlert: {
          type: i18n.__('Warning'),
          message: i18n.__('Missing wakatime cli')
        }
      })

      const alertConfig = {
        type: 'warning',
        message: i18n.__('Missing Wakatime CLI'),
        detail: i18n.__(
          `Please install Wakatime CLI to use Wakatime tracker feature.`
        ),
        buttons: [i18n.__('OK')]
      }
      dialog.showMessageBox(remote.getCurrentWindow(), alertConfig)
    } else {
      this.setState({
        wakatimePluginAlert: null
      })
    }
  }

  handleSaveButtonClick(e) {
    const newConfig = {
      wakatime: {
        isActive: this.state.config.wakatime.isActive,
        key: this.state.config.wakatime.key
      }
    }

    ConfigManager.set(newConfig)

    store.dispatch({
      type: 'SET_CONFIG',
      config: newConfig
    })
    this.clearMessage()
    this.props.haveToSave()
    this.checkWakatimePluginRequirement()
  }

  handleIsWakatimePluginActiveChange(e) {
    const { config } = this.state
    config.wakatime.isActive = !config.wakatime.isActive
    this.setState({
      config
    })
    if (_.isEqual(this.oldWakatimeConfig.isActive, config.wakatime.isActive)) {
      this.props.haveToSave()
    } else {
      this.props.haveToSave({
        tab: 'Plugins',
        type: 'warning',
        message: i18n.__('Unsaved Changes!')
      })
    }
  }

  handleWakatimeKeyChange(e) {
    const { config } = this.state
    config.wakatime = {
      isActive: true,
      key: this.refs.wakatimeKey.value
    }
    this.setState({
      config
    })
    if (_.isEqual(this.oldWakatimeConfig.key, config.wakatime.key)) {
      this.props.haveToSave()
    } else {
      this.props.haveToSave({
        tab: 'Plugins',
        type: 'warning',
        message: i18n.__('Unsaved Changes!')
      })
    }
  }

  clearMessage() {
    _.debounce(() => {
      this.setState({
        pluginsAlert: null
      })
    }, 2000)()
  }

  render() {
    const pluginsAlert = this.state.pluginsAlert
    const pluginsAlertElement =
      pluginsAlert != null ? (
        <p className={`alert ${pluginsAlert.type}`}>{pluginsAlert.message}</p>
      ) : null

    const wakatimeAlert = this.state.wakatimePluginAlert
    const wakatimePluginAlertElement =
      wakatimeAlert != null ? (
        <p className={`alert ${wakatimeAlert.type}`}>{wakatimeAlert.message}</p>
      ) : null

    const { config } = this.state

    return (
      <div styleName='root'>
        <div styleName='group'>
          <div styleName='group-header'>{i18n.__('Plugins')}</div>
          <div styleName='group-header2'>{i18n.__('Wakatime')}</div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleIsWakatimePluginActiveChange(e)}
                checked={config.wakatime.isActive}
                ref='wakatimeIsActive'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Enable Wakatime')}
            </label>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>{i18n.__('Wakatime key')}</div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                onChange={e => this.handleWakatimeKeyChange(e)}
                disabled={!config.wakatime.isActive}
                ref='wakatimeKey'
                value={config.wakatime.key}
                type='text'
              />
              {wakatimePluginAlertElement}
            </div>
          </div>
          <div styleName='group-control'>
            <button
              styleName='group-control-rightButton'
              onClick={e => this.handleSaveButtonClick(e)}
            >
              {i18n.__('Save')}
            </button>
            {pluginsAlertElement}
          </div>
        </div>
      </div>
    )
  }
}

PluginsTab.propTypes = {
  dispatch: PropTypes.func,
  haveToSave: PropTypes.func
}

export default CSSModules(PluginsTab, styles)
