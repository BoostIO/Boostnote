import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './StoragesTab.styl'
import dataApi from 'browser/main/lib/dataApi'
import StorageItem from './StorageItem'

const electron = require('electron')
const { shell, remote } = electron

function browseFolder () {
  let dialog = remote.dialog

  let defaultPath = remote.app.getPath('home')
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog({
      title: 'Select Directory',
      defaultPath,
      properties: ['openDirectory', 'createDirectory']
    }, function (targetPaths) {
      if (targetPaths == null) return resolve('')
      resolve(targetPaths[0])
    })
  })
}

class StoragesTab extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      page: 'LIST',
      newStorage: {
        name: 'Unnamed',
        type: 'FILESYSTEM',
        path: ''
      }
    }
  }

  handleAddStorageButton (e) {
    this.setState({
      page: 'ADD_STORAGE',
      newStorage: {
        name: 'Unnamed',
        type: 'FILESYSTEM',
        path: ''
      }
    }, () => {
      this.refs.addStorageName.select()
    })
  }

  handleLinkClick (e) {
    shell.openExternal(e.currentTarget.href)
    e.preventDefault()
  }

  renderList () {
    let { data, boundingBox } = this.props

    if (!boundingBox) { return null }
    let storageList = data.storageMap.map((storage) => {
      return <StorageItem
        key={storage.key}
        storage={storage}
        hostBoundingBox={boundingBox}
      />
    })
    return (
      <div styleName='list'>
        <div styleName='header'>Storages</div>
        {storageList.length > 0
          ? storageList
          : <div styleName='list-empty'>No storage found.</div>
        }
        <div styleName='list-control'>
          <button styleName='list-control-addStorageButton'
            onClick={(e) => this.handleAddStorageButton(e)}
          >
            <i className='fa fa-plus' /> Add Storage
          </button>
        </div>
      </div>
    )
  }

  handleAddStorageBrowseButtonClick (e) {
    browseFolder()
      .then((targetPath) => {
        if (targetPath.length > 0) {
          let { newStorage } = this.state
          newStorage.path = targetPath
          this.setState({
            newStorage
          })
        }
      })
      .catch((err) => {
        console.error('BrowseFAILED')
        console.error(err)
      })
  }

  handleAddStorageChange (e) {
    let { newStorage } = this.state
    newStorage.name = this.refs.addStorageName.value
    newStorage.path = this.refs.addStoragePath.value
    this.setState({
      newStorage
    })
  }

  handleAddStorageCreateButton (e) {
    dataApi
      .addStorage({
        name: this.state.newStorage.name,
        path: this.state.newStorage.path
      })
      .then((data) => {
        let { dispatch } = this.props
        dispatch({
          type: 'ADD_STORAGE',
          storage: data.storage,
          notes: data.notes
        })
        this.setState({
          page: 'LIST'
        })
      })
  }

  handleAddStorageCancelButton (e) {
    this.setState({
      page: 'LIST'
    })
  }

  renderAddStorage () {
    return (
      <div styleName='addStorage'>

        <div styleName='addStorage-header'>Add Storage</div>

        <div styleName='addStorage-body'>

          <div styleName='addStorage-body-section'>
            <div styleName='addStorage-body-section-label'>
              Name
            </div>
            <div styleName='addStorage-body-section-name'>
              <input styleName='addStorage-body-section-name-input'
                ref='addStorageName'
                value={this.state.newStorage.name}
                onChange={(e) => this.handleAddStorageChange(e)}
              />
            </div>
          </div>

          <div styleName='addStorage-body-section'>
            <div styleName='addStorage-body-section-label'>Type</div>
            <div styleName='addStorage-body-section-type'>
              <select styleName='addStorage-body-section-type-select'
                value={this.state.newStorage.type}
                readOnly
              >
                <option value='FILESYSTEM'>File System</option>
              </select>
              <div styleName='addStorage-body-section-type-description'>
                3rd party cloud integration:
                <a href='https://github.com/BoostIO/Boostnote/wiki/Cloud-Syncing'
                  onClick={(e) => this.handleLinkClick(e)}
                >Cloud-Syncing</a>
              </div>
            </div>
          </div>

          <div styleName='addStorage-body-section'>
            <div styleName='addStorage-body-section-label'>Location
            </div>
            <div styleName='addStorage-body-section-path'>
              <input styleName='addStorage-body-section-path-input'
                ref='addStoragePath'
                placeholder='Select Folder'
                value={this.state.newStorage.path}
                onChange={(e) => this.handleAddStorageChange(e)}
              />
              <button styleName='addStorage-body-section-path-button'
                onClick={(e) => this.handleAddStorageBrowseButtonClick(e)}
              >
                ...
              </button>
            </div>
          </div>

          <div styleName='addStorage-body-control'>
            <button styleName='addStorage-body-control-createButton'
              onClick={(e) => this.handleAddStorageCreateButton(e)}
            >Create</button>
            <button styleName='addStorage-body-control-cancelButton'
              onClick={(e) => this.handleAddStorageCancelButton(e)}
            >Cancel</button>
          </div>

        </div>

      </div>
    )
  }

  renderContent () {
    switch (this.state.page) {
      case 'ADD_STORAGE':
      case 'ADD_FOLDER':
        return this.renderAddStorage()
      case 'LIST':
      default:
        return this.renderList()
    }
  }

  render () {
    return (
      <div styleName='root'>
        {this.renderContent()}
      </div>
    )
  }
}

StoragesTab.propTypes = {
  boundingBox: PropTypes.shape({
    bottom: PropTypes.number,
    height: PropTypes.number,
    left: PropTypes.number,
    right: PropTypes.number,
    top: PropTypes.number,
    width: PropTypes.number
  }),
  dispatch: PropTypes.func
}

export default CSSModules(StoragesTab, styles)
