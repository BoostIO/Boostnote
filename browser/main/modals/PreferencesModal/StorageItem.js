import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'
import CSSModules from 'browser/lib/CSSModules'
import styles from './StorageItem.styl'
import consts from 'browser/lib/consts'
import dataApi from 'browser/main/lib/dataApi'
import store from 'browser/main/store'

const { shell, remote } = require('electron')
const { dialog } = remote
import { SketchPicker } from 'react-color'

class UnstyledFolderItem extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      status: 'IDLE',
      folder: {
        showColumnPicker: false,
        colorPickerPos: { left: 0, top: 0 },
        color: props.color,
        name: props.name
      }
    }
  }

  handleEditChange (e) {
    let { folder } = this.state

    folder.name = this.refs.nameInput.value
    this.setState({
      folder
    })
  }

  handleConfirmButtonClick (e) {
    this.confirm()
  }

  confirm () {
    let { storage, folder } = this.props
    dataApi
      .updateFolder(storage.key, folder.key, {
        color: this.state.folder.color,
        name: this.state.folder.name
      })
      .then((data) => {
        store.dispatch({
          type: 'UPDATE_FOLDER',
          storage: data.storage
        })
        this.setState({
          status: 'IDLE'
        })
      })
  }

  handleColorButtonClick (e) {
    const folder = Object.assign({}, this.state.folder, { showColumnPicker: true, colorPickerPos: { left: 0, top: 0 } })
    this.setState({ folder }, function () {
      // After the color picker has been painted, re-calculate its position
      // by comparing its dimensions to the host dimensions.
      const { hostBoundingBox } = this.props
      const colorPickerNode = ReactDOM.findDOMNode(this.refs.colorPicker)
      const colorPickerBox = colorPickerNode.getBoundingClientRect()
      const offsetTop = hostBoundingBox.bottom - colorPickerBox.bottom
      const folder = Object.assign({}, this.state.folder, {
        colorPickerPos: {
          left: 25,
          top: offsetTop < 0 ? offsetTop - 5 : 0  // subtract 5px for aestetics
        }
      })
      this.setState({ folder })
    })
  }

  handleColorChange (color) {
    const folder = Object.assign({}, this.state.folder, { color: color.hex })
    this.setState({ folder })
  }

  handleColorPickerClose (event) {
    const folder = Object.assign({}, this.state.folder, { showColumnPicker: false })
    this.setState({ folder })
  }

  handleCancelButtonClick (e) {
    this.setState({
      status: 'IDLE'
    })
  }

  handleFolderItemBlur (e) {
    let el = e.relatedTarget
    while (el != null) {
      if (el === this.refs.root) {
        return false
      }
      el = el.parentNode
    }
    this.confirm()
  }

  renderEdit (e) {
    const popover = { position: 'absolute', zIndex: 2 }
    const cover = {
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
    const pickerStyle = Object.assign({}, {
      position: 'absolute'
    }, this.state.folder.colorPickerPos)
    return (
      <div styleName='folderList-item'
        onBlur={(e) => this.handleFolderItemBlur(e)}
        tabIndex='-1'
        ref='root'
      >
        <div styleName='folderList-item-left'>
          <button styleName='folderList-item-left-colorButton' style={{color: this.state.folder.color}}
            onClick={(e) => !this.state.folder.showColumnPicker && this.handleColorButtonClick(e)}
          >
            {this.state.folder.showColumnPicker
              ? <div style={popover}>
                <div style={cover}
                  onClick={() => this.handleColorPickerClose()}
                />
                <div style={pickerStyle}>
                  <SketchPicker
                    ref='colorPicker'
                    color={this.state.folder.color}
                    onChange={(color) => this.handleColorChange(color)}
                    onChangeComplete={(color) => this.handleColorChange(color)}
                  />
                </div>
              </div>
              : null
            }
            <i className='fa fa-square' />
          </button>
          <input styleName='folderList-item-left-nameInput'
            value={this.state.folder.name}
            ref='nameInput'
            onChange={(e) => this.handleEditChange(e)}
          />
        </div>
        <div styleName='folderList-item-right'>
          <button styleName='folderList-item-right-confirmButton'
            onClick={(e) => this.handleConfirmButtonClick(e)}
          >
            Confirm
          </button>
          <button styleName='folderList-item-right-button'
            onClick={(e) => this.handleCancelButtonClick(e)}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  handleDeleteConfirmButtonClick (e) {
    let { storage, folder } = this.props
    dataApi
      .deleteFolder(storage.key, folder.key)
      .then((data) => {
        store.dispatch({
          type: 'DELETE_FOLDER',
          storage: data.storage,
          folderKey: data.folderKey
        })
      })
  }

  renderDelete () {
    return (
      <div styleName='folderList-item'>
        <div styleName='folderList-item-left'>
          Are you sure to <span styleName='folderList-item-left-danger'>delete</span> this folder?
        </div>
        <div styleName='folderList-item-right'>
          <button styleName='folderList-item-right-dangerButton'
            onClick={(e) => this.handleDeleteConfirmButtonClick(e)}
          >
            Confirm
          </button>
          <button styleName='folderList-item-right-button'
            onClick={(e) => this.handleCancelButtonClick(e)}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  handleEditButtonClick (e) {
    let { folder: propsFolder } = this.props
    let { folder: stateFolder } = this.state
    const folder = Object.assign({}, stateFolder, propsFolder)
    this.setState({
      status: 'EDIT',
      folder
    }, () => {
      this.refs.nameInput.select()
    })
  }

  handleDeleteButtonClick (e) {
    this.setState({
      status: 'DELETE'
    })
  }

  renderIdle () {
    let { folder } = this.props
    return (
      <div styleName='folderList-item'
        onDoubleClick={(e) => this.handleEditButtonClick(e)}
      >
        <div styleName='folderList-item-left'
          style={{borderColor: folder.color}}
        >
          <span styleName='folderList-item-left-name'>{folder.name}</span>
          <span styleName='folderList-item-left-key'>({folder.key})</span>
        </div>
        <div styleName='folderList-item-right'>
          <button styleName='folderList-item-right-button'
            onClick={(e) => this.handleEditButtonClick(e)}
          >
            Edit
          </button>
          <button styleName='folderList-item-right-button'
            onClick={(e) => this.handleDeleteButtonClick(e)}
          >
            Delete
          </button>
        </div>
      </div>

    )
  }

  render () {
    switch (this.state.status) {
      case 'DELETE':
        return this.renderDelete()
      case 'EDIT':
        return this.renderEdit()
      case 'IDLE':
      default:
        return this.renderIdle()
    }
  }
}

const FolderItem = CSSModules(UnstyledFolderItem, styles)

class StorageItem extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      isLabelEditing: false
    }
  }

  handleNewFolderButtonClick (e) {
    let { storage } = this.props
    let input = {
      name: 'Untitled',
      color: consts.FOLDER_COLORS[Math.floor(Math.random() * 7) % 7]
    }

    dataApi.createFolder(storage.key, input)
      .then((data) => {
        store.dispatch({
          type: 'UPDATE_FOLDER',
          storage: data.storage
        })
      })
      .catch((err) => {
        console.error(err)
      })
  }

  handleExternalButtonClick () {
    let { storage } = this.props
    shell.showItemInFolder(storage.path)
  }

  handleUnlinkButtonClick (e) {
    let index = dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'warning',
      message: 'Unlink Storage',
      detail: 'Unlinking removes this linked storage from Boostnote. No data is removed, please manually delete the folder from your hard drive if needed.',
      buttons: ['Unlink', 'Cancel']
    })

    if (index === 0) {
      let { storage } = this.props
      dataApi.removeStorage(storage.key)
        .then(() => {
          store.dispatch({
            type: 'REMOVE_STORAGE',
            storageKey: storage.key
          })
        })
        .catch((err) => {
          throw err
        })
    }
  }

  handleLabelClick (e) {
    let { storage } = this.props
    this.setState({
      isLabelEditing: true,
      name: storage.name
    }, () => {
      this.refs.label.focus()
    })
  }
  handleLabelChange (e) {
    this.setState({
      name: this.refs.label.value
    })
  }

  handleLabelBlur (e) {
    let { storage } = this.props
    dataApi
      .renameStorage(storage.key, this.state.name)
      .then((_storage) => {
        store.dispatch({
          type: 'RENAME_STORAGE',
          storage: _storage
        })
        this.setState({
          isLabelEditing: false
        })
      })
  }

  render () {
    let { storage, hostBoundingBox } = this.props
    let folderList = storage.folders.map((folder) => {
      return <FolderItem key={folder.key}
        folder={folder}
        storage={storage}
        hostBoundingBox={hostBoundingBox}
      />
    })
    return (
      <div styleName='root' key={storage.key}>
        <div styleName='header'>
          {this.state.isLabelEditing
            ? <div styleName='header-label--edit'>
              <input styleName='header-label-input'
                value={this.state.name}
                ref='label'
                onChange={(e) => this.handleLabelChange(e)}
                onBlur={(e) => this.handleLabelBlur(e)}
              />
            </div>
            : <div styleName='header-label'
              onClick={(e) => this.handleLabelClick(e)}
            >
              <i className='fa fa-folder-open' />&nbsp;
              {storage.name}&nbsp;
              <span styleName='header-label-path'>({storage.path})</span>&nbsp;
              <i styleName='header-label-editButton' className='fa fa-pencil' />
            </div>
          }
          <div styleName='header-control'>
            <button styleName='header-control-button'
              onClick={(e) => this.handleNewFolderButtonClick(e)}
            >
              <i className='fa fa-plus' />
              <span styleName='header-control-button-tooltip'
                style={{left: -20}}
              >Add Folder</span>
            </button>
            <button styleName='header-control-button'
              onClick={(e) => this.handleExternalButtonClick(e)}
            >
              <i className='fa fa-external-link' />
              <span styleName='header-control-button-tooltip'
                style={{left: -50}}
              >Open Storage folder</span>
            </button>
            <button styleName='header-control-button'
              onClick={(e) => this.handleUnlinkButtonClick(e)}
            >
              <i className='fa fa-unlink' />
              <span styleName='header-control-button-tooltip'
                style={{left: -10}}
              >Unlink</span>
            </button>
          </div>
        </div>
        <div styleName='folderList'>
          {folderList.length > 0
            ? folderList
            : <div styleName='folderList-empty'>No Folders</div>
          }
        </div>
      </div>
    )
  }
}

StorageItem.propTypes = {
  hostBoundingBox: PropTypes.shape({
    bottom: PropTypes.number,
    height: PropTypes.number,
    left: PropTypes.number,
    right: PropTypes.number,
    top: PropTypes.number,
    width: PropTypes.number
  }),
  storage: PropTypes.shape({
    key: PropTypes.string
  }),
  folder: PropTypes.shape({
    key: PropTypes.string,
    color: PropTypes.string,
    name: PropTypes.string
  })
}

export default CSSModules(StorageItem, styles)
