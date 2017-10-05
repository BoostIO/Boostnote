import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './StorageItem.styl'
import { hashHistory } from 'react-router'
import modal from 'browser/main/lib/modal'
import CreateFolderModal from 'browser/main/modals/CreateFolderModal'
import RenameFolderModal from 'browser/main/modals/RenameFolderModal'
import dataApi from 'browser/main/lib/dataApi'
import StorageItemChild from 'browser/components/StorageItem'
import eventEmitter from 'browser/main/lib/eventEmitter'

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
      detail: 'This will delete all notes in the folder and can not be undone.',
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

  handleDragEnter (e) {
    e.dataTransfer.setData('defaultColor', e.target.style.backgroundColor)
    e.target.style.backgroundColor = 'rgba(129, 130, 131, 0.08)'
  }

  handleDragLeave (e) {
    e.target.style.opacity = '1'
    e.target.style.backgroundColor = e.dataTransfer.getData('defaultColor')
  }

  handleDrop (e, storage, folder, dispatch, location) {
    e.target.style.opacity = '1'
    e.target.style.backgroundColor = e.dataTransfer.getData('defaultColor')
    const noteData = JSON.parse(e.dataTransfer.getData('note'))
    const newNoteData = Object.assign({}, noteData, {storage: storage, folder: folder.key})
    if (folder.key === noteData.folder) return
    dataApi
     .createNote(storage.key, newNoteData)
     .then((note) => {
       dataApi
        .deleteNote(noteData.storage, noteData.key)
        .then((data) => {
          let dispatchHandler = () => {
            dispatch({
              type: 'DELETE_NOTE',
              storageKey: data.storageKey,
              noteKey: data.noteKey
            })
          }
          eventEmitter.once('list:moved', dispatchHandler)
          eventEmitter.emit('list:next')
        })
         .catch((err) => {
           console.error(err)
         })
       dispatch({
         type: 'UPDATE_NOTE',
         note: note
       })
       hashHistory.push({
         pathname: location.pathname,
         query: {key: `${note.storage}-${note.key}`}
       })
     })
  }

  render () {
    let { storage, location, isFolded, data, dispatch } = this.props
    let { folderNoteMap, trashedSet } = data
    let folderList = storage.folders.map((folder) => {
      let isActive = !!(location.pathname.match(new RegExp('\/storages\/' + storage.key + '\/folders\/' + folder.key)))
      let noteSet = folderNoteMap.get(storage.key + '-' + folder.key)

      let noteCount = 0
      if (noteSet) {
        let trashedNoteCount = 0
        const noteKeys = noteSet.map(noteKey => { return noteKey })
        trashedSet.toJS().forEach(trashedKey => {
          if (noteKeys.some(noteKey => { return noteKey === trashedKey })) trashedNoteCount++
        })
        noteCount = noteSet.size - trashedNoteCount
      }
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
          handleDrop={(e) => this.handleDrop(e, storage, folder, dispatch, location)}
          handleDragEnter={this.handleDragEnter}
          handleDragLeave={this.handleDragLeave}
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
