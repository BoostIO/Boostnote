import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './GithubGists.styl'
import PropTypes from 'prop-types'
import _ from 'lodash'
import i18n from 'browser/lib/i18n'
import ConfigManager from 'browser/main/lib/ConfigManager'
import store from 'browser/main/store'
import { getGithubApi,
         EXCHANGE_ACCESS_TOKEN,
  GET_USER_PROFILE
} from 'browser/main/lib/dataApi/github-api.js'

/**
* @fileoverview Component for github settings
*/

const electron = require('electron')
const { shell } = electron
const ipc = electron.ipcRenderer
const BrowserWindow = electron.remote.BrowserWindow

class GithubGists extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      config: props.config,
      GithubGistsAlert: null,
      authCall: false
    }

    this.setUser = this.setUser.bind(this)
  }

  handleLinkClick (e) {
    shell.openExternal(e.currentTarget.href)
    e.preventDefault()
  }

  clearMessage () {
    _.debounce(() => {
      this.setState({
        GithubGistsAlert: null
      })
    }, 2000)()
  }

  componentDidMount () {
    this.handleSettingDone = () => {
      this.setState({GithubGistsAlert: {
        type: 'success',
        message: i18n.__('Successfully applied!')
      }})
    }
    this.handleSettingError = (err) => {
      this.setState({BlogAlert: {
        type: 'error',
        message: err.message != null ? err.message : i18n.__('An error occurred!')
      }})
    }
    this.oldGithubGists = this.state.config.githubGists
    ipc.addListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.addListener('APP_SETTING_ERROR', this.handleSettingError)

    console.log('on_component_mount', this.state.config.githubGists)
  }

  handleGithubGistsSettingsChange (e = '') {
    const {config} = this.state
    config.githubGists = {
      clientID: !_.isNil(this.refs.clientIDInput) ? this.refs.clientIDInput.value : config.githubGists.clientID,
      clientSecret: !_.isNil(this.refs.clientSecretInput) ? this.refs.clientSecretInput.value : config.githubGists.clientSecret
    }
    this.setState({
      config
    })
    if (_.isEqual(this.oldGithubGists, config.githubGists)) {
      this.props.haveToSave()
    } else {
      this.props.haveToSave({
        tab: 'GithubGists',
        type: 'warning',
        message: i18n.__('Unsaved Changes!')
      })
    }
  }

  handleSaveButtonClick (e) {
    const newConfig = {
      githubGists: this.state.config.githubGists
    }

    ConfigManager.set(newConfig)

    store.dispatch({
      type: 'SET_UI',
      config: newConfig
    })
    this.clearMessage()
    this.props.haveToSave()
  }

  setUser (token) {
    const {config, authCall} = this.state
    if (authCall !== false) {
      return
    }

    this.setState({
      authCall: true
    })

    const newConfig = {
      githubGists: config.githubGists
    }

    getGithubApi(GET_USER_PROFILE)(token)
    .then((payload) => {
      console.log(payload)
      const {avatar_url, email, login, name, type} = payload

      newConfig.githubGists.loggedInUserInfo = {
        avatarUrl: avatar_url,
        email: email,
        login: login,
        name: name,
        type: type,
        accessToken: token
      }

      ConfigManager.set(newConfig)

      store.dispatch({
        type: 'SET_UI',
        config: newConfig
      })

      this.props.haveToSave()
    })
    .catch(err => {
      console.log(err)
    })
    .finally(() => {
      this.setState([{
        authCall: false
      }])
    })
  }

  authorizeGithubApplication (e) {
    let browserWindow = new BrowserWindow({
      center: true,
      width: 400,
      height: 800,
      show: false
    })
    const githubUrl = 'https://github.com/login/oauth/authorize?'
    const authUrl = githubUrl + 'client_id=' + this.state.config.githubGists.clientID + '&scope=gist'
    const clientID = this.state.config.githubGists.clientID
    const clientSecret = this.state.config.githubGists.clientSecret
    console.log(authUrl)
    browserWindow.loadURL(authUrl)
    browserWindow.show()

    function callback (url, saveToken) {
      const rawCode = /code=([^&]*)/.exec(url) || null
      const code = (rawCode && rawCode.length > 1) ? rawCode[1] : null
      const error = /\?error=(.+)$/.exec(url)

      if (code || error) {
        // close browser if contents code or error
        browserWindow.webContents.session.clearStorageData([], () => {})
        browserWindow.destroy()
      }

      // If there is a code, proceed to get token from github
      if (code) {
        getGithubApi(EXCHANGE_ACCESS_TOKEN)(
          clientID,
          clientSecret,
          code
        ).then((payload) => {
          // init user session
          saveToken(payload.access_token)
        }).catch((err) => {
          console.log('Failed. Error: ' + err)
        })
      } else {
        console.log('Oops! Something went wrong and we couldn\'t' +
        'log you in using Github. Please try again.')
      }
    }

    browserWindow.webContents.on('will-navigate', (event, url) => {
      console.log('Will navigate')
      callback(url, this.setUser)
    })

    browserWindow.on('close', () => {
      browserWindow = null
    }, false)

    browserWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
      console.log('did-get-redirect-request')
      callback(newUrl, this.setUser)
    })
  }

  checkAuthorizedApplication () {
    const {config} = this.state
    if (typeof config.githubGists.loggedInUserInfo !== 'undefined' && typeof config.githubGists.loggedInUserInfo.accessToken !== 'undefined' && config.githubGists.loggedInUserInfo.accessToken !== '') {
      return true
    } else {
      return false
    }
  }

  logout () {
    if (!this.checkAuthorizedApplication()) {
      return
    }
    const clientID = this.state.config.githubGists.clientID
    const clientSecret = this.state.config.githubGists.clientSecret
    const emptyGithubGistsConfig = {
      githubGists: {
        clientID: clientID,
        clientSecret: clientSecret,
        loggedInUserInfo: {}
      }
    }

    ConfigManager.set(emptyGithubGistsConfig)

    store.dispatch({
      type: 'SET_UI',
      config: emptyGithubGistsConfig
    })

    this.props.haveToSave()
    this.forceUpdate()
  }

  userInfo () {
    const {config} = this.state
    if (this.checkAuthorizedApplication()) {
      return (
        <div styleName='group-section'>
          <div styleName='group-section-control'>
            <p>
              <img
                styleName='github-user-avatar-img'
                src={config.githubGists.loggedInUserInfo.avatarUrl} />
            </p>
            <p><b>{config.githubGists.loggedInUserInfo.type}</b>: {config.githubGists.loggedInUserInfo.name}</p>
            <p>
              <b>{i18n.__('Login')}:</b> {config.githubGists.loggedInUserInfo.login}
            </p>
            <p>
              <button
                onClick={(e) => this.logout()}
                styleName='cf-link'
              >{i18n.__('Logout')}</button>
            </p>
          </div>
        </div>
      )
    } else {
      return null
    }
  }

  render () {
    const {config, GithubGistsAlert} = this.state
    const githubGistsAlertElement = GithubGistsAlert != null ? <p className={`alert ${GithubGistsAlert.type}`}>
      {GithubGistsAlert.message}
    </p> : null
    const authorize = (config.githubGists.clientID !== '' && config.githubGists.clientSecret !== '' && !this.checkAuthorizedApplication()) ? <div styleName='group-section'><div styleName='group-section-control'><button onClick={(e) => this.authorizeGithubApplication(e)} styleName='cf-link'>{i18n.__('Authorize application')}</button></div></div> : null

    return (
      <div styleName='root'>
        <div styleName='group'>
          <div styleName='group-header'>
            {i18n.__('Github gists')}
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>{i18n.__('Client id')}</div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                type='text'
                value={config.githubGists.clientID}
                ref='clientIDInput'
                onChange={(e) => this.handleGithubGistsSettingsChange(e)}
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>{i18n.__('Client secret')}</div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                type='text'
                ref='clientSecretInput'
                value={config.githubGists.clientSecret}
                onChange={(e) => this.handleGithubGistsSettingsChange(e)}
              />
            </div>
          </div>
          {authorize}
          {this.userInfo()}
        </div>
        <div styleName='group-control'>
          <button styleName='group-control-rightButton'
            onClick={(e) => this.handleSaveButtonClick(e)}>{i18n.__('Save')}
          </button>
          {githubGistsAlertElement}
        </div>
      </div>
    )
  }
}

GithubGists.propTypes = {
  dispath: PropTypes.func,
  haveToSave: PropTypes.func
}

export default CSSModules(GithubGists, styles)
