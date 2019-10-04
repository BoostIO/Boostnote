import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './StoragesTab.styl'
import dataApi from 'browser/main/lib/dataApi'
import attachmentManagement from 'browser/main/lib/dataApi/attachmentManagement'
import StorageItem from './StorageItem'
import i18n from 'browser/lib/i18n'
import { humanFileSize } from 'browser/lib/utils'
import fs from 'fs'

const electron = require('electron')
const { shell, remote } = electron

function browseFolder () {
  const dialog = remote.dialog

  const defaultPath = remote.app.getPath('home')
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog({
      title: i18n.__('Select Directory'),
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

    this.defaultOptions = {
      'FILESYSTEM': {},
      'GITREPO': { autoSync: true }
    }

    this.state = {
      page: 'LIST',
      newStorage: {
        name: 'Unnamed',
        type: 'FILESYSTEM',
        options: this.defaultOptions['FILESYSTEM'],
        path: ''
      },
      attachments: []
    }
    this.loadAttachmentStorage()
  }

  loadAttachmentStorage () {
    const promises = []
    this.props.data.noteMap.map(note => {
      const promise = attachmentManagement.getAttachmentsPathAndStatus(
        note.content,
        note.storage,
        note.key
      )
      if (promise) promises.push(promise)
    })

    Promise.all(promises)
      .then(data => {
        const result = data.reduce((acc, curr) => acc.concat(curr), [])
        this.setState({attachments: result})
      })
      .catch(console.error)
  }

  handleAddStorageButton (e) {
    this.setState({
      page: 'ADD_STORAGE',
      newStorage: {
        name: 'Unnamed',
        type: 'FILESYSTEM',
        options: this.defaultOptions['FILESYSTEM'],
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

  handleRemoveUnusedAttachments (attachments) {
    attachmentManagement.removeAttachmentsByPaths(attachments)
      .then(() => this.loadAttachmentStorage())
      .catch(console.error)
  }

  renderList () {
    const { data, boundingBox } = this.props
    const { attachments } = this.state

    const unusedAttachments = attachments.filter(attachment => !attachment.isInUse)
    const inUseAttachments = attachments.filter(attachment => attachment.isInUse)

    const totalUnusedAttachments = unusedAttachments.length
    const totalInuseAttachments = inUseAttachments.length
    const totalAttachments = totalUnusedAttachments + totalInuseAttachments

    const totalUnusedAttachmentsSize = unusedAttachments
      .reduce((acc, curr) => {
        const stats = fs.statSync(curr.path)
        const fileSizeInBytes = stats.size
        return acc + fileSizeInBytes
      }, 0)
    const totalInuseAttachmentsSize = inUseAttachments
      .reduce((acc, curr) => {
        const stats = fs.statSync(curr.path)
        const fileSizeInBytes = stats.size
        return acc + fileSizeInBytes
      }, 0)
    const totalAttachmentsSize = totalUnusedAttachmentsSize + totalInuseAttachmentsSize

    const unusedAttachmentPaths = unusedAttachments
      .reduce((acc, curr) => acc.concat(curr.path), [])

    if (!boundingBox) { return null }
    const storageList = data.storageMap.map((storage) => {
      return <StorageItem
        key={storage.key}
        storage={storage}
        hostBoundingBox={boundingBox}
      />
    })
    return (
      <div styleName='list'>
        <div styleName='header'>{i18n.__('Storage Locations')}</div>
        {storageList.length > 0
          ? storageList
          : <div styleName='list-empty'>{i18n.__('No storage found.')}</div>
        }
        <div styleName='list-control'>
          <button styleName='list-control-addStorageButton'
            onClick={(e) => this.handleAddStorageButton(e)}
          >
            <i className='fa fa-plus' /> {i18n.__('Add Storage Location')}
          </button>
        </div>
        <div styleName='header'>{i18n.__('Attachment storage')}</div>
        <p styleName='list-attachment-label'>
          Unused attachments size: {humanFileSize(totalUnusedAttachmentsSize)} ({totalUnusedAttachments} items)
        </p>
        <p styleName='list-attachment-label'>
          In use attachments size: {humanFileSize(totalInuseAttachmentsSize)} ({totalInuseAttachments} items)
        </p>
        <p styleName='list-attachment-label'>
          Total attachments size: {humanFileSize(totalAttachmentsSize)} ({totalAttachments} items)
        </p>
        <button styleName='list-attachement-clear-button'
          onClick={() => this.handleRemoveUnusedAttachments(unusedAttachmentPaths)}>
          {i18n.__('Clear unused attachments')}
        </button>
      </div>
    )
  }

  handleAddStorageBrowseButtonClick (e) {
    browseFolder()
      .then((targetPath) => {
        if (targetPath.length > 0) {
          const { newStorage } = this.state
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

  handleOptionsChange (e) {
    const {name, value} = e.target
    const { newStorage } = this.state

    newStorage.options[name] = value === 'true' ? true : value === 'false' ? false : value
    this.setState({newStorage})
    console.log(newStorage)
  }
  handleAddStorageChange (e) {
    const { newStorage } = this.state

    newStorage.name = this.refs.addStorageName.value

    const oldType = newStorage.type
    newStorage.type = this.refs.addStorageType.value

    if (oldType !== newStorage.type) {
      newStorage.options = this.defaultOptions[newStorage.type]
    }

    this.setState({
      newStorage
    })

    console.log(newStorage)
  }

  handleAddStorageCreateButton (e) {
    dataApi
      .addStorage({
        name: this.state.newStorage.name,
        type: this.state.newStorage.type,
        options: this.state.newStorage.options,
        path: this.state.newStorage.path
      })
      .then((data) => {
        const { dispatch } = this.props
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

        <div styleName='addStorage-header'>{i18n.__('Add Storage')}</div>

        <div styleName='addStorage-body'>

          <div styleName='addStorage-body-section'>
            <div styleName='addStorage-body-section-label'>
              {i18n.__('Name')}
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
            <div styleName='addStorage-body-section-label'>{i18n.__('Type')}</div>
            <div styleName='addStorage-body-section-type'>

              <select styleName='addStorage-body-section-type-select'
                ref='addStorageType'
                value={this.state.newStorage.type}
                onChange={(e) => this.handleAddStorageChange(e)}
              >

                <option value='FILESYSTEM'>{i18n.__('File System')}</option>
                <option value='GITREPO'>{i18n.__('Git Repo')}</option>

              </select>

              {this.state.newStorage.type === 'GITREPO' &&
            (
              <span styleName='addStorage-body-section-type-options'>
                <span styleName='addStorage-body-section-type-radio'>
                  <input type='radio'ref='addOptions'
                    id='true' name='autoSync' value='true' checked={this.state.newStorage.options.autoSync}
                    onChange={(e) => this.handleOptionsChange(e)} />
                  <label htmlFor='true'>{i18n.__('Auto Sync')}</label>
                </span>
                <span styleName='addStorage-body-section-type-radio'>

                  <input type='radio' ref='addOptions'
                    id='false' name='autoSync' value='false' checked={!this.state.newStorage.options.autoSync}
                    onChange={(e) => this.handleOptionsChange(e)} />
                  <label htmlFor='false'>{i18n.__('Commit Manually')}</label>
                </span>
              </span>)
              }
            </div>

          </div>

          <div styleName='addStorage-body-section'>
            <div styleName='addStorage-body-section-label'>{i18n.__('Location')}
            </div>
            <div styleName='addStorage-body-section-path'>
              <input styleName='addStorage-body-section-path-input'
                ref='addStoragePath'
                placeholder={i18n.__('Select Folder')}
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
          <div styleName='addStorage-body-section-description'>
            {i18n.__('Setting up 3rd-party cloud storage integration:')}{' '}
            <a href='https://github.com/BoostIO/Boostnote/wiki/Cloud-Syncing-and-Backup'
              onClick={(e) => this.handleLinkClick(e)}
                >{i18n.__('Cloud-Syncing-and-Backup')}</a>
          </div>

          <div styleName='addStorage-body-control'>
            <button styleName='addStorage-body-control-createButton'
              onClick={(e) => this.handleAddStorageCreateButton(e)}
            >{i18n.__('Add')}</button>
            <button styleName='addStorage-body-control-cancelButton'
              onClick={(e) => this.handleAddStorageCancelButton(e)}
            >{i18n.__('Cancel')}</button>
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
