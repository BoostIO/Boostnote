import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './StorageItem.styl'
import { hashHistory } from 'react-router'
import modal from 'browser/main/lib/modal'
import CreateFolderModal from 'browser/main/modals/CreateFolderModal'
import RenameFolderModal from 'browser/main/modals/RenameFolderModal'
import dataApi from 'browser/main/lib/dataApi'
import StorageItemChild from 'browser/components/StorageItem'
import _ from 'lodash'
import CSON from '@rokt33r/season'

const path = require('path')
const { remote } = require('electron')
const { Menu, MenuItem, dialog } = remote

class StorageItem extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      isOpen: true
    }
  }

  handleHeaderContextMenu (e) {
    let menu = new Menu()
    menu.append(new MenuItem({
      label: 'Add Folder',
      click: (e) => this.handleAddFolderButtonClick(e)
    }))
    menu.append(new MenuItem({
      type: 'separator'
    }))
    menu.append(new MenuItem({
      label: 'Unlink Storage',
      click: (e) => this.handleUnlinkStorageClick(e)
    }))
    menu.popup()
  }

  handleUnlinkStorageClick (e) {
    let index = dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'warning',
      message: 'Unlink Storage',
      detail: 'This work will just detatches a storage from Boostnote. (Any data won\'t be deleted.)',
      buttons: ['Confirm', 'Cancel']
    })

    if (index === 0) {
      let { storage, dispatch } = this.props
      dataApi.removeStorage(storage.key)
        .then(() => {
          dispatch({
            type: 'REMOVE_STORAGE',
            storageKey: storage.key
          })
        })
        .catch((err) => {
          throw err
        })
    }
  }

  handleToggleButtonClick (e) {
    this.setState({
      isOpen: !this.state.isOpen
    })
  }

  handleAddFolderButtonClick (e) {
    let { storage } = this.props

    modal.open(CreateFolderModal, {
      storage
    })
  }

  handleHeaderInfoClick (e) {
    let { storage } = this.props
    hashHistory.push('/storages/' + storage.key)
  }

  handleFolderButtonClick (folderKey) {
    return (e) => {
      let { storage } = this.props
      hashHistory.push('/storages/' + storage.key + '/folders/' + folderKey)
    }
  }

  handleFolderButtonContextMenu (e, folder) {
    let menu = new Menu()
    menu.append(new MenuItem({
      label: 'Rename Folder',
      click: (e) => this.handleRenameFolderClick(e, folder)
    }))
    menu.append(new MenuItem({
      type: 'separator'
    }))
    menu.append(new MenuItem({
      label: 'Delete Folder',
      click: (e) => this.handleFolderDeleteClick(e, folder)
    }))
    menu.popup()
  }

  handleRenameFolderClick (e, folder) {
    let { storage } = this.props
    modal.open(RenameFolderModal, {
      storage,
      folder
    })
  }

  handleFolderDeleteClick (e, folder) {
    let index = dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'warning',
      message: 'Delete Folder',
      detail: 'This work will deletes all notes in the folder and can not be undone.',
      buttons: ['Confirm', 'Cancel']
    })

    if (index === 0) {
      let { storage, dispatch } = this.props
      dataApi
        .deleteFolder(storage.key, folder.key)
        .then((data) => {
          dispatch({
            type: 'DELETE_FOLDER',
            storage: data.storage,
            folderKey: data.folderKey
          })
        })
    }
  }

  handleDragStart (e, folder) {
    e.dataTransfer.setData('dragFolderKey', folder.key)
  }

  handleDrop (e, folder, storage, dispatch) {
    const dragFolderKey = e.dataTransfer.getData('dragFolderKey')
    this.rearrangeFolder(dragFolderKey, folder.key, storage.folders)
    dataApi
      .moveFolder(storage.key, storage.folders)
    dispatch({
      type: 'UPDATE_FOLDER',
      storage: storage
    })
  }

  rearrangeFolder (dragFolderKey, targetFolderKey, folders) {
    const dragFolderIndex = this.getFolderIndex(folders, dragFolderKey)
    const targetFolderIndex = this.getFolderIndex(folders, targetFolderKey)
    this.moveFolderElements(folders, dragFolderIndex, targetFolderIndex)
  }

  getFolderIndex (folders, targetFolderKey) {
    return folders.indexOf(_.find(folders, {key: targetFolderKey}))
  }

  moveFolderElements (folders, dragFolderIndex, targetFolderIndex) {
    folders.splice(targetFolderIndex, 0, folders[dragFolderIndex])
    const deleteIndex = (dragFolderIndex > targetFolderIndex) ? 1 : 0
    folders.splice(dragFolderIndex + deleteIndex, 1)
  }

  render () {
    let { storage, location, isFolded, data, dispatch } = this.props
    let { folderNoteMap } = data
    let folderList = storage.folders.map((folder) => {
      let isActive = !!(location.pathname.match(new RegExp('\/storages\/' + storage.key + '\/folders\/' + folder.key)))
      let noteSet = folderNoteMap.get(storage.key + '-' + folder.key)

      let noteCount = noteSet != null
        ? noteSet.size
        : 0
      return (
        <StorageItemChild
          key={folder.key}
          isActive={isActive}
          handleButtonClick={(e) => this.handleFolderButtonClick(folder.key)(e)}
          handleContextMenu={(e) => this.handleFolderButtonContextMenu(e, folder)}
          folderName={folder.name}
          folderColor={folder.color}
          isFolded={isFolded}
          noteCount={noteCount}
          handleDragStart={(e) => this.handleDragStart(e, folder)}
          handleDrop={(e) => this.handleDrop(e, folder, storage, dispatch)}
        />
      )
    })

    let isActive = location.pathname.match(new RegExp('\/storages\/' + storage.key + '$'))

    return (
      <div styleName={isFolded ? 'root--folded' : 'root'}
        key={storage.key}
      >
        <div styleName={isActive
            ? 'header--active'
            : 'header'
          }
          onContextMenu={(e) => this.handleHeaderContextMenu(e)}
        >
          <button styleName='header-toggleButton'
            onMouseDown={(e) => this.handleToggleButtonClick(e)}
          >
            <i className={this.state.isOpen
                ? 'fa fa-caret-down'
                : 'fa fa-caret-right'
              }
            />
          </button>

          {!isFolded &&
            <button styleName='header-addFolderButton'
              onClick={(e) => this.handleAddFolderButtonClick(e)}
            >
              <i className='fa fa-plus' />
            </button>
          }

          <button styleName='header-info'
            onClick={(e) => this.handleHeaderInfoClick(e)}
          >
            <span styleName='header-info-name'>
              {isFolded ? storage.name.substring(0, 1) : storage.name}
            </span>
            {isFolded &&
              <span styleName='header-info--folded-tooltip'>
                {storage.name}
              </span>
            }
          </button>
        </div>
        {this.state.isOpen &&
          <div styleName='folderList' >
            {folderList}
          </div>
        }
      </div>
    )
  }
}

StorageItem.propTypes = {
  isFolded: PropTypes.bool
}

export default CSSModules(StorageItem, styles)
