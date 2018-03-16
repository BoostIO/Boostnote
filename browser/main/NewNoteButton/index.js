import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './NewNoteButton.styl'
import _ from 'lodash'
import modal from 'browser/main/lib/modal'
import NewNoteModal from 'browser/main/modals/NewNoteModal'
import NewJournalEntryModal from 'browser/main/modals/NewJournalEntryModal'
import eventEmitter from 'browser/main/lib/eventEmitter'

const { remote } = require('electron')
const { dialog } = remote

const OSX = window.process.platform === 'darwin'

class NewNoteButton extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
    }

    this.newNoteHandler = () => {
      this.handleNewNoteButtonClick()
    }
  }

  componentDidMount () {
    eventEmitter.on('top:new-note', this.newNoteHandler)
  }

  componentWillUnmount () {
    eventEmitter.off('top:new-note', this.newNoteHandler)
  }

  handleNewNoteButtonClick (e) {
    const { location, dispatch, data } = this.props
    const { storage, folder } = this.resolveTargetFolder()

    if (folder.type === 'JOURNAL') {
      modal.open(NewJournalEntryModal, {
        storage: storage.key,
        folder: folder.key,
        folderNoteMap: data.folderNoteMap,
        noteMap: data.noteMap,
        dispatch,
        location
      })
    } else {
      modal.open(NewNoteModal, {
        storage: storage.key,
        folder: folder.key,
        folderNoteMap: data.folderNoteMap,
        noteMap: data.noteMap,
        dispatch,
        location
      })
    }
  }

  resolveTargetFolder (alert = false) {
    const { data, params } = this.props
    let storage = data.storageMap.get(params.storageKey)
    // Find first storage
    if (storage == null) {
      for (const kv of data.storageMap) {
        storage = kv[1]
        break
      }
    }

    if (storage == null && alert) this.showMessageBox('No storage to create a note')
    const folder = _.find(storage.folders, {key: params.folderKey}) || storage.folders[0]
    if (folder == null && alert) this.showMessageBox('No folder to create a note')

    return {
      storage,
      folder
    }
  }

  showMessageBox (message) {
    dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'warning',
      message: message,
      buttons: ['OK']
    })
  }

  resolveFolderType () {
    const { data, params } = this.props
    const storage = data.storageMap.get(params.storageKey)
    let folder
    if (storage) {
      folder = _.find(storage.folders, {key: params.folderKey}) || storage.folders[0]
      return folder.type
    } else {
      return null
    }
  }

  render () {
    const { config, style, data, params } = this.props
    const isJournalMode = this.resolveFolderType() === 'JOURNAL'

    return (
      <div className='NewNoteButton'
        styleName={config.isSideNavFolded ? 'root--expanded' : 'root'}
        style={style}
      >
        <div styleName='control'>
          <button styleName='control-newNoteButton'
            onClick={(e) => this.handleNewNoteButtonClick(e)}>
            <img styleName='iconTag'
              src={isJournalMode ? '../resources/icon/icon-calendar.svg' : '../resources/icon/icon-newnote.svg'} />
            <span styleName='control-newNoteButton-tooltip'>
              Make a note {OSX ? '⌘' : 'Ctrl'} + N
            </span>
          </button>
        </div>
      </div>
    )
  }
}

export default CSSModules(NewNoteButton, styles)
