import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './BackupTab.styl'
import ConfigManager from 'browser/main/lib/ConfigManager'
import { store } from 'browser/main/store'
import _ from 'lodash'
import i18n from 'browser/lib/i18n'

const electron = require('electron')
const { remote } = electron
const ipc = electron.ipcRenderer
const fs = require('fs')

function browseFolder (searchForFolder) {
  const dialog = remote.dialog

  const defaultPath = remote.app.getPath('home')
  const browseProperties = searchForFolder
  ? {
    title: i18n.__('Select Directory'),
    defaultPath,
    properties: ['openDirectory', 'createDirectory']
  }
  : {
    title: i18n.__('Select File'), defaultPath
  }
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog(browseProperties, function (targetPaths) {
      if (targetPaths == null) return resolve('')
      resolve(targetPaths[0])
    })
  })
}

class BackupTab extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      config: props.config,
      page: 'HOME',
      newExport: {
        path: ''
      },
      newImport: {
        path: ''
      }
    }
  }

  componentDidMount () {
    this.handleSettingDone = () => {
      this.setState({BackupAlert: {
        type: 'success',
        message: i18n.__('Successfully applied!')
      }})
    }
    this.handleSettingError = (err) => {
      this.setState({BackupAlert: {
        type: 'error',
        message: err.message != null ? err.message : i18n.__('An error occurred!')
      }})
    }
    ipc.addListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.addListener('APP_SETTING_ERROR', this.handleSettingError)
  }

  componentWillUnmount () {
    ipc.removeListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.removeListener('APP_SETTING_ERROR', this.handleSettingError)
  }

  handleSaveImport (e) {
    const newConfig = {
      hotkey: this.state.config.hotkey,
      ui: this.state.config.ui,
      editor: this.state.config.editor,
      preview: this.state.config.preview,
      blog: this.state.config.blog
    }

    ConfigManager.set(newConfig)

    store.dispatch({
      type: 'SET_UI',
      config: newConfig
    })
    this.clearMessage()
    this.props.haveToSave()
  }

  handleImportPathBrowseButtonClick (e) {
    browseFolder(false)
      .then((targetPath) => {
        if (targetPath.length > 0) {
          const { newImport } = this.state
          newImport.path = targetPath
          this.setState({
            newImport
          })
        }
      })
      .catch((err) => {
        console.error('BrowseFAILED')
        console.error(err)
      })
  }

  handleExportPathBrowseButtonClick (e) {
    browseFolder(true)
      .then((targetPath) => {
        if (targetPath.length > 0) {
          const { newExport } = this.state
          newExport.path = targetPath
          this.setState({
            newExport
          })
        }
      })
      .catch((err) => {
        console.error('BrowseFAILED')
        console.error(err)
      })
  }

  importConfig (e) {
    if (this.state.newImport.path === '') {
      alert(i18n.__('No file has been selected.'))
      return false
    }

    try {
      const externalConfig = JSON.parse(fs.readFileSync(this.state.newImport.path, 'utf-8'))
      const { config } = this.state
      config.hotkey = externalConfig.hotkey
      config.ui = externalConfig.ui
      config.editor = externalConfig.editor
      config.preview = externalConfig.preview
      config.blog = externalConfig.blog

      this.setState({
        config
      })
      this.handleSaveImport(e)
    } catch (err) {
      alert(i18n.__(
        err instanceof SyntaxError ? 'File is not valid JSON.' : 'Something went wrong. Please try again'
        ))
      return false
    }
  }

  exportConfig (e) {
    if (this.state.newExport.path === '') {
      alert(i18n.__('Please choose a directory for export file.'))
      return false
    }
    fs.writeFile(
      `${this.state.newExport.path}/boostnote.config`,
      JSON.stringify(this.state.config), (err) => {
        if (err) {
          return console.log(err)
        }
      })
    alert(i18n.__('Saved successfully'))
  }

  clearMessage () {
    _.debounce(() => {
      this.setState({
        keymapAlert: null
      })
    }, 2000)()
  }

  render () {
    const BackupAlert = this.state.BackupAlert
    const BackupAlertElement = BackupAlert != null
      ? <p className={`alert ${BackupAlert.type}`}>
        {BackupAlert.message}
      </p>
      : null

    return (
      <div styleName='root'>
        <div styleName='group'>
          <div styleName='group-header'>{i18n.__('Backup Configuration')}</div>
          <div styleName='group-section'>
            <div styleName='backup-body-section'>
              <div styleName='backup-body-section-label'>{i18n.__('Select Backup File')}
              </div>
              <div styleName='backup-body-section-path'>
                <input styleName='backup-body-section-path-input'
                  ref='newImportPath'
                  placeholder={i18n.__('Select File')}
                  value={this.state.newImport.path}
                />
                <button styleName='backup-body-section-path-button'
                  ref='newImportButton'
                  onClick={(e) => this.handleImportPathBrowseButtonClick(e)}
                >
                  ...
                </button>
              </div>
              <div styleName='backup-button-control'>
                <button styleName='backup-submit-leftButton'
                  onClick={(e) => this.importConfig(e)}>{i18n.__('Import')}
                </button>
              </div>
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='backup-body-section'>
              <div styleName='backup-body-section-label'>{i18n.__('Create Backup File')}
              </div>
              <div styleName='backup-body-section-path'>
                <input styleName='backup-body-section-path-input'
                  ref='newExportPath'
                  placeholder={i18n.__('Select Folder')}
                  value={this.state.newExport.path}
                />
                <button styleName='backup-body-section-path-button'
                  onClick={(e) => this.handleExportPathBrowseButtonClick(e)}
                >
                  ...
                </button>
              </div>
              <div styleName='backup-button-control'>
                <button styleName='backup-submit-leftButton'
                  ref='newExportButton'
                  onClick={(e) => this.exportConfig(e)}>{i18n.__('Export')}
                </button>
              </div>
            </div>
          </div>
          <div styleName='group-control'>
            {BackupAlertElement}
          </div>
        </div>
      </div>
    )
  }
}

BackupTab.propTypes = {
  dispatch: PropTypes.func,
  haveToSave: PropTypes.func
}

export default CSSModules(BackupTab, styles)
