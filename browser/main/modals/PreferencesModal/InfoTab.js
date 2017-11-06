import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './InfoTab.styl'
import ConfigManager from 'browser/main/lib/ConfigManager'
import store from 'browser/main/store'
import AwsMobileAnalyticsConfig from 'browser/main/lib/AwsMobileAnalyticsConfig'
import _ from 'lodash'

const electron = require('electron')
const { shell, remote } = electron
const appVersion = remote.app.getVersion()

class InfoTab extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      config: this.props.config
    }
  }

  handleLinkClick (e) {
    shell.openExternal(e.currentTarget.href)
    e.preventDefault()
  }

  handleConfigChange (e) {
    const newConfig = { amaEnabled: this.refs.amaEnabled.checked }

    this.setState({ config: newConfig })
  }

  handleSaveButtonClick (e) {
    let newConfig = {
      amaEnabled: this.state.config.amaEnabled
    }

    if (!newConfig.amaEnabled) {
      AwsMobileAnalyticsConfig.recordDynamicCustomEvent('DISABLE_AMA')
      this.setState({
        amaMessage: 'We hope we will gain your trust'
      })
    } else {
      this.setState({
        amaMessage: 'Thank\'s for trust us'
      })
    }

    _.debounce(() => {
      this.setState({
        amaMessage: ''
      })
    }, 3000)()

    ConfigManager.set(newConfig)

    store.dispatch({
      type: 'SET_CONFIG',
      config: newConfig
    })
  }

  infoMessage () {
    const { amaMessage } = this.state
    return amaMessage ? <p styleName='policy-confirm'>{amaMessage}</p> : null
  }

  render () {
    return (
      <div styleName='root'>
        <div styleName='header'>Info</div>

        <div styleName='top'>
          <div styleName='icon-space'>
            <img styleName='icon' src='../resources/app.png' width='92' height='92' />
            <div styleName='icon-right'>
              <div styleName='appId'>Boostnote {appVersion}</div>
              <div styleName='description'>
                An open source note-taking app made for programmers just like you.
              </div>
            </div>
          </div>
        </div>
        <ul styleName='list'>
          <li>
            <a href='https://boostnote.io'
              onClick={(e) => this.handleLinkClick(e)}
            >Website</a>
          </li>
          <li>
            <a href='https://boostnote.paintory.com/'
              onClick={(e) => this.handleLinkClick(e)}
            >Boostnote Shop</a> : Products are shipped to all over the world 🌏
          </li>
          <li>
            <a href='https://opencollective.com/boostnoteio'
              onClick={(e) => this.handleLinkClick(e)}
            >Crowdfunding</a> : Thank you for your support 🎉
          </li>
          <li>
            <a href='https://github.com/BoostIO/Boostnote/issues'
              onClick={(e) => this.handleLinkClick(e)}
            >GitHub Issues</a> : We&apos;d love to hear your feedback 🙌
          </li>
          <li>
            <a href='https://github.com/BoostIO/Boostnote/blob/master/docs/build.md'
              onClick={(e) => this.handleLinkClick(e)}
            >Development</a> : Development configurations for Boostnote 🚀
          </li>
          <li styleName='cc'>
            Copyright (C) 2017 Maisin&Co.
          </li>
          <li styleName='cc'>
            License: GPL v3
          </li>
        </ul>
        <hr />
        <div styleName='policy'>Data collection policy</div>
        <div>We collect only the number of DAU for Boostnote and **DO NOT collect** any detail information such as your note content.</div>
        <div>You can see how it works on <a href='https://github.com/BoostIO/Boostnote' onClick={(e) => this.handleLinkClick(e)}>GitHub</a>.</div>
        <div>This data is only used for Boostnote improvements.</div>
        <input onChange={(e) => this.handleConfigChange(e)}
          checked={this.state.config.amaEnabled}
          ref='amaEnabled'
          type='checkbox'
        />
        Enable to send analytics to our servers<br />
        <button styleName='policy-submit' onClick={(e) => this.handleSaveButtonClick(e)}>Save</button>
        {this.infoMessage()}
      </div>
    )
  }
}

InfoTab.propTypes = {
}

export default CSSModules(InfoTab, styles)
