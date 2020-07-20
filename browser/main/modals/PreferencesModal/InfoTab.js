import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './InfoTab.styl'
import ConfigManager from 'browser/main/lib/ConfigManager'
import { store } from 'browser/main/store'
import AwsMobileAnalyticsConfig from 'browser/main/lib/AwsMobileAnalyticsConfig'
import _ from 'lodash'
import i18n from 'browser/lib/i18n'

const electron = require('electron')
const { shell, remote } = electron
const appVersion = remote.app.getVersion()

class InfoTab extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      config: this.props.config
    }
  }

  handleLinkClick(e) {
    shell.openExternal(e.currentTarget.href)
    e.preventDefault()
  }

  handleConfigChange(e) {
    const newConfig = { amaEnabled: this.refs.amaEnabled.checked }

    this.setState({ config: newConfig })
  }

  handleSaveButtonClick(e) {
    const newConfig = {
      amaEnabled: this.state.config.amaEnabled
    }

    if (!newConfig.amaEnabled) {
      AwsMobileAnalyticsConfig.recordDynamicCustomEvent('DISABLE_AMA')
      this.setState({
        amaMessage: i18n.__('We hope we will gain your trust')
      })
    } else {
      this.setState({
        amaMessage: i18n.__("Thank's for trusting us")
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

  toggleAutoUpdate() {
    const newConfig = {
      autoUpdateEnabled: !this.state.config.autoUpdateEnabled
    }

    this.setState({ config: newConfig })
    ConfigManager.set(newConfig)
  }

  infoMessage() {
    const { amaMessage } = this.state
    return amaMessage ? <p styleName='policy-confirm'>{amaMessage}</p> : null
  }

  render() {
    return (
      <div styleName='root'>
        <div styleName='group-header'>{i18n.__('Community')}</div>
        <div styleName='top'>
          <ul styleName='list'>
            <li>
              <a
                href='https://issuehunt.io/repos/53266139'
                onClick={e => this.handleLinkClick(e)}
              >
                {i18n.__('Bounty on IssueHunt')}
              </a>
            </li>
            <li>
              <a
                href='https://boostnote.io/#subscribe'
                onClick={e => this.handleLinkClick(e)}
              >
                {i18n.__('Subscribe to Newsletter')}
              </a>
            </li>
            <li>
              <a
                href='https://github.com/BoostIO/Boostnote/issues'
                onClick={e => this.handleLinkClick(e)}
              >
                {i18n.__('GitHub')}
              </a>
            </li>
            <li>
              <a
                href='https://medium.com/boostnote'
                onClick={e => this.handleLinkClick(e)}
              >
                {i18n.__('Blog')}
              </a>
            </li>
            <li>
              <a
                href='https://www.facebook.com/groups/boostnote'
                onClick={e => this.handleLinkClick(e)}
              >
                {i18n.__('Facebook Group')}
              </a>
            </li>
            <li>
              <a
                href='https://twitter.com/boostnoteapp'
                onClick={e => this.handleLinkClick(e)}
              >
                {i18n.__('Twitter')}
              </a>
            </li>
          </ul>
        </div>

        <hr />

        <div styleName='group-header--sub'>{i18n.__('About')}</div>

        <div styleName='top'>
          <div styleName='icon-space'>
            <img
              styleName='icon'
              src='../resources/app.png'
              width='92'
              height='92'
            />
            <div styleName='icon-right'>
              <div styleName='appId'>Boostnote Legacy {appVersion}</div>
              <div styleName='description'>
                {i18n.__(
                  'An open source note-taking app made for programmers just like you.'
                )}
              </div>
            </div>
          </div>
        </div>

        <ul styleName='list'>
          <li>
            <a
              href='https://boostnote.io'
              onClick={e => this.handleLinkClick(e)}
            >
              {i18n.__('Website')}
            </a>
          </li>
          <li>
            <a
              href='https://github.com/BoostIO/Boostnote/blob/master/docs/build.md'
              onClick={e => this.handleLinkClick(e)}
            >
              {i18n.__('Development')}
            </a>
            {i18n.__(' : Development configurations for Boostnote.')}
          </li>
          <li styleName='cc'>{i18n.__('Copyright (C) 2017 - 2020 BoostIO')}</li>
          <li styleName='cc'>{i18n.__('License: GPL v3')}</li>
        </ul>

        <div>
          <label>
            <input
              type='checkbox'
              onChange={this.toggleAutoUpdate.bind(this)}
              checked={this.state.config.autoUpdateEnabled}
            />
            {i18n.__('Enable Auto Update')}
          </label>
        </div>

        <hr styleName='separate-line' />

        <div styleName='group-header2--sub'>{i18n.__('Analytics')}</div>
        <div>
          {i18n.__(
            'Boostnote collects anonymous data for the sole purpose of improving the application, and strictly does not collect any personal information such the contents of your notes.'
          )}
        </div>
        <div>
          {i18n.__('You can see how it works on ')}
          <a
            href='https://github.com/BoostIO/Boostnote'
            onClick={e => this.handleLinkClick(e)}
          >
            GitHub
          </a>
          .
        </div>
        <br />
        <div>{i18n.__('You can choose to enable or disable this option.')}</div>
        <input
          onChange={e => this.handleConfigChange(e)}
          checked={this.state.config.amaEnabled}
          ref='amaEnabled'
          type='checkbox'
        />
        {i18n.__('Enable analytics to help improve Boostnote')}
        <br />
        <button
          styleName='policy-submit'
          onClick={e => this.handleSaveButtonClick(e)}
        >
          {i18n.__('Save')}
        </button>
        <br />
        {this.infoMessage()}
      </div>
    )
  }
}

InfoTab.propTypes = {}

export default CSSModules(InfoTab, styles)
