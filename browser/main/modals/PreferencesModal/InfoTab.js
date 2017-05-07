import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './InfoTab.styl'

const electron = require('electron')
const { shell, remote } = electron
const appVersion = remote.app.getVersion()

class InfoTab extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
    }
  }

  handleLinkClick (e) {
    shell.openExternal(e.currentTarget.href)
    e.preventDefault()
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
            <a href='https://salt.bountysource.com/teams/boostnote'
              onClick={(e) => this.handleLinkClick(e)}
            >Donate via Bountysource</a> : Thank you for your support 🎉
          </li>
          <li>
            <a href='https://github.com/BoostIO/Boostnote/issues'
              onClick={(e) => this.handleLinkClick(e)}
            >GitHub Issues</a> : We'd love to hear your feedback 🙌
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
      </div>
    )
  }
}

InfoTab.propTypes = {
}

export default CSSModules(InfoTab, styles)
