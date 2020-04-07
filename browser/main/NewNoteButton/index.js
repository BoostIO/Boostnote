import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './NewNoteButton.styl'
import _ from 'lodash'
import modal from 'browser/main/lib/modal'
import NewNoteModal from 'browser/main/modals/NewNoteModal'
import eventEmitter from 'browser/main/lib/eventEmitter'
import i18n from 'browser/lib/i18n'
import { createMarkdownNote, createSnippetNote } from 'browser/lib/newNote'

const { remote } = require('electron')
const { dialog } = remote

const OSX = window.process.platform === 'darwin'

class NewNoteButton extends React.Component {
  constructor(props) {
    super(props)

    this.state = {}

    this.handleNewNoteButtonClick = this.handleNewNoteButtonClick.bind(this)
  }

  componentDidMount() {
    eventEmitter.on('top:new-note', this.handleNewNoteButtonClick)
  }

  componentWillUnmount() {
    eventEmitter.off('top:new-note', this.handleNewNoteButtonClick)
  }

  handleNewNoteButtonClick(e) {
    const {
      location,
      dispatch,
      match: { params },
      config
    } = this.props
    const { storage, folder } = this.resolveTargetFolder()
    if (config.ui.defaultNote === 'MARKDOWN_NOTE') {
      createMarkdownNote(
        storage.key,
        folder.key,
        dispatch,
        location,
        params,
        config
      )
    } else if (config.ui.defaultNote === 'SNIPPET_NOTE') {
      createSnippetNote(
        storage.key,
        folder.key,
        dispatch,
        location,
        params,
        config
      )
    } else {
      modal.open(NewNoteModal, {
        storage: storage.key,
        folder: folder.key,
        dispatch,
        location,
        params,
        config
      })
    }
  }

  resolveTargetFolder() {
    const {
      data,
      match: { params }
    } = this.props
    let storage = data.storageMap.get(params.storageKey)
    // Find first storage
    if (storage == null) {
      for (const kv of data.storageMap) {
        storage = kv[1]
        break
      }
    }

    if (storage == null)
      this.showMessageBox(i18n.__('No storage to create a note'))
    const folder =
      _.find(storage.folders, { key: params.folderKey }) || storage.folders[0]
    if (folder == null)
      this.showMessageBox(i18n.__('No folder to create a note'))

    return {
      storage,
      folder
    }
  }

  showMessageBox(message) {
    dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'warning',
      message: message,
      buttons: ['OK']
    })
  }

  render() {
    const { config, style } = this.props
    return (
      <div
        className='NewNoteButton'
        styleName={config.isSideNavFolded ? 'root--expanded' : 'root'}
        style={style}
      >
        <div styleName='control'>
          <button
            styleName='control-newNoteButton'
            onClick={this.handleNewNoteButtonClick}
          >
            <img src='../resources/icon/icon-newnote.svg' />
            <span styleName='control-newNoteButton-tooltip'>
              {i18n.__('Make a note')} {OSX ? '⌘' : i18n.__('Ctrl')} + N
            </span>
          </button>
        </div>
      </div>
    )
  }
}

NewNoteButton.propTypes = {
  dispatch: PropTypes.func,
  config: PropTypes.shape({
    isSideNavFolded: PropTypes.bool
  })
}

export default CSSModules(NewNoteButton, styles)
