import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import HotkeyTab from './HotkeyTab'
import UiTab from './UiTab'
import InfoTab from './InfoTab'
import Crowdfunding from './Crowdfunding'
import StoragesTab from './StoragesTab'
import SnippetTab from './SnippetTab'
import Blog from './Blog'
import ModalEscButton from 'browser/components/ModalEscButton'
import CSSModules from 'browser/lib/CSSModules'
import styles from './PreferencesModal.styl'
import RealtimeNotification from 'browser/components/RealtimeNotification'
import _ from 'lodash'
import i18n from 'browser/lib/i18n'

class Preferences extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      currentTab: 'STORAGES',
      UIAlert: '',
      HotkeyAlert: '',
      BlogAlert: ''
    }
  }

  componentDidMount() {
    this.refs.root.focus()
    const boundingBox = this.getContentBoundingBox()
    this.setState({ boundingBox })
  }

  switchTeam(teamId) {
    this.setState({ currentTeamId: teamId })
  }

  handleNavButtonClick(tab) {
    return e => {
      this.setState({ currentTab: tab })
    }
  }

  handleEscButtonClick() {
    this.props.close()
  }

  renderContent() {
    const { boundingBox } = this.state
    const { dispatch, config, data } = this.props

    switch (this.state.currentTab) {
      case 'INFO':
        return <InfoTab dispatch={dispatch} config={config} />
      case 'HOTKEY':
        return (
          <HotkeyTab
            dispatch={dispatch}
            config={config}
            haveToSave={alert => this.setState({ HotkeyAlert: alert })}
          />
        )
      case 'UI':
        return (
          <UiTab
            dispatch={dispatch}
            config={config}
            haveToSave={alert => this.setState({ UIAlert: alert })}
          />
        )
      case 'CROWDFUNDING':
        return <Crowdfunding />
      case 'BLOG':
        return (
          <Blog
            dispatch={dispatch}
            config={config}
            haveToSave={alert => this.setState({ BlogAlert: alert })}
          />
        )
      case 'SNIPPET':
        return <SnippetTab dispatch={dispatch} config={config} data={data} />
      case 'STORAGES':
      default:
        return (
          <StoragesTab
            dispatch={dispatch}
            data={data}
            boundingBox={boundingBox}
          />
        )
    }
  }

  handleKeyDown(e) {
    if (e.keyCode === 27) {
      this.props.close()
    }
  }

  getContentBoundingBox() {
    return this.refs.content.getBoundingClientRect()
  }

  haveToSaveNotif(type, message) {
    return <p styleName={`saving--${type}`}>{message}</p>
  }

  render() {
    const content = this.renderContent()

    const tabs = [
      { target: 'STORAGES', label: i18n.__('Storage') },
      {
        target: 'HOTKEY',
        label: i18n.__('Hotkeys'),
        Hotkey: this.state.HotkeyAlert
      },
      { target: 'UI', label: i18n.__('Interface'), UI: this.state.UIAlert },
      { target: 'INFO', label: i18n.__('About') },
      { target: 'CROWDFUNDING', label: i18n.__('Crowdfunding') },
      { target: 'BLOG', label: i18n.__('Blog'), Blog: this.state.BlogAlert },
      { target: 'SNIPPET', label: i18n.__('Snippets') }
    ]

    const navButtons = tabs.map(tab => {
      const isActive = this.state.currentTab === tab.target
      const isUiHotkeyTab =
        _.isObject(tab[tab.label]) && tab.label === tab[tab.label].tab
      return (
        <button
          styleName={isActive ? 'nav-button--active' : 'nav-button'}
          key={tab.target}
          onClick={e => this.handleNavButtonClick(tab.target)(e)}
        >
          <span>{tab.label}</span>
          {isUiHotkeyTab
            ? this.haveToSaveNotif(tab[tab.label].type, tab[tab.label].message)
            : null}
        </button>
      )
    })

    return (
      <div
        styleName='root'
        ref='root'
        tabIndex='-1'
        onKeyDown={e => this.handleKeyDown(e)}
      >
        <div styleName='top-bar'>
          <p>{i18n.__('Your preferences for Boostnote')}</p>
        </div>
        <ModalEscButton
          handleEscButtonClick={e => this.handleEscButtonClick(e)}
        />
        <div styleName='nav'>{navButtons}</div>
        <div ref='content' styleName='content'>
          {content}
        </div>
        <RealtimeNotification />
      </div>
    )
  }
}

Preferences.propTypes = {
  dispatch: PropTypes.func
}

export default connect(x => x)(CSSModules(Preferences, styles))
