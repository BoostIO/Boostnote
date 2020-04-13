import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './StatusBar.styl'
import ZoomManager from 'browser/main/lib/ZoomManager'
import i18n from 'browser/lib/i18n'
import context from 'browser/lib/context'
import EventEmitter from 'browser/main/lib/eventEmitter'

const electron = require('electron')
const { remote, ipcRenderer } = electron
const { dialog } = remote

const zoomOptions = [
  0.8,
  0.9,
  1,
  1.1,
  1.2,
  1.3,
  1.4,
  1.5,
  1.6,
  1.7,
  1.8,
  1.9,
  2.0
]

class StatusBar extends React.Component {
  constructor(props) {
    super(props)
    this.handleZoomInMenuItem = this.handleZoomInMenuItem.bind(this)
    this.handleZoomOutMenuItem = this.handleZoomOutMenuItem.bind(this)
    this.handleZoomResetMenuItem = this.handleZoomResetMenuItem.bind(this)
  }

  componentDidMount() {
    EventEmitter.on('status:zoomin', this.handleZoomInMenuItem)
    EventEmitter.on('status:zoomout', this.handleZoomOutMenuItem)
    EventEmitter.on('status:zoomreset', this.handleZoomResetMenuItem)
  }

  componentWillUnmount() {
    EventEmitter.off('status:zoomin', this.handleZoomInMenuItem)
    EventEmitter.off('status:zoomout', this.handleZoomOutMenuItem)
    EventEmitter.off('status:zoomreset', this.handleZoomResetMenuItem)
  }

  updateApp() {
    const index = dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'warning',
      message: i18n.__('Update Boostnote'),
      detail: i18n.__('New Boostnote is ready to be installed.'),
      buttons: [i18n.__('Restart & Install'), i18n.__('Not Now')]
    })

    if (index === 0) {
      ipcRenderer.send('update-app-confirm')
    }
  }

  handleZoomButtonClick(e) {
    const templates = []

    zoomOptions.forEach(zoom => {
      templates.push({
        label: Math.floor(zoom * 100) + '%',
        click: () => this.handleZoomMenuItemClick(zoom)
      })
    })

    context.popup(templates)
  }

  handleZoomMenuItemClick(zoomFactor) {
    const { dispatch } = this.props
    ZoomManager.setZoom(zoomFactor)
    dispatch({
      type: 'SET_ZOOM',
      zoom: zoomFactor
    })
  }

  handleZoomInMenuItem() {
    const zoomFactor = ZoomManager.getZoom() + 0.1
    this.handleZoomMenuItemClick(zoomFactor)
  }

  handleZoomOutMenuItem() {
    const zoomFactor = ZoomManager.getZoom() - 0.1
    this.handleZoomMenuItemClick(zoomFactor)
  }

  handleZoomResetMenuItem() {
    this.handleZoomMenuItemClick(1.0)
  }

  render() {
    const { config, status } = this.context

    return (
      <div className='StatusBar' styleName='root'>
        <button styleName='zoom' onClick={e => this.handleZoomButtonClick(e)}>
          <img src='../resources/icon/icon-zoom.svg' />
          <span>{Math.floor(config.zoom * 100)}%</span>
        </button>

        {status.updateReady ? (
          <button onClick={this.updateApp} styleName='update'>
            <i styleName='update-icon' className='fa fa-cloud-download' />{' '}
            {i18n.__('Ready to Update!')}
          </button>
        ) : null}
      </div>
    )
  }
}

StatusBar.contextTypes = {
  status: PropTypes.shape({
    updateReady: PropTypes.bool.isRequired
  }).isRequired,
  config: PropTypes.shape({}).isRequired,
  date: PropTypes.string
}

StatusBar.propTypes = {
  config: PropTypes.shape({
    zoom: PropTypes.number
  })
}

export default CSSModules(StatusBar, styles)
