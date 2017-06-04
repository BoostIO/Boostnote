import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './StatusBar.styl'
import ZoomManager from 'browser/main/lib/ZoomManager'
import LastUpdatedString from '../Detail/LastUpdatedString'

const electron = require('electron')
const { remote, ipcRenderer } = electron
const { Menu, MenuItem, dialog } = remote

const zoomOptions = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0]

class StatusBar extends React.Component {
  updateApp () {
    let index = dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'warning',
      message: 'Update Boostnote',
      detail: 'New Boostnote is ready to be installed.',
      buttons: ['Restart & Install', 'Not Now']
    })

    if (index === 0) {
      ipcRenderer.send('update-app-confirm')
    }
  }

  handleZoomButtonClick (e) {
    let menu = new Menu()

    zoomOptions.forEach((zoom) => {
      menu.append(new MenuItem({
        label: Math.floor(zoom * 100) + '%',
        click: () => this.handleZoomMenuItemClick(zoom)
      }))
    })

    menu.popup(remote.getCurrentWindow())
  }

  handleZoomMenuItemClick (zoomFactor) {
    let { dispatch } = this.props
    ZoomManager.setZoom(zoomFactor)
    dispatch({
      type: 'SET_ZOOM',
      zoom: zoomFactor
    })
  }

  render () {
    let { config, status } = this.context
    const { location } = this.props

    return (
      <div className='StatusBar'
        styleName='root'
      >
        <button styleName='zoom'
          onClick={(e) => this.handleZoomButtonClick(e)}
        >
          <i className='fa fa-search-plus' />&nbsp;
          {Math.floor(config.zoom * 100)}%
        </button>

        <div styleName='note-hash'>#{location.query.key}</div>
        <div styleName='blank' />

        {status.updateReady
          ? <button onClick={this.updateApp} styleName='update'>
            <i styleName='update-icon' className='fa fa-cloud-download' /> Ready to Update!
            </button>
          : null
        }

        <LastUpdatedString date={this.props.date} />
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
