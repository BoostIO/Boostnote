import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './MarkdownNoteDetail.styl'
import MarkdownEditor from 'browser/components/MarkdownEditor'
import WYSIWYGEditor from 'browser/components/WYSIWYGEditor'
import TodoListPercentage from 'browser/components/TodoListPercentage'
import StarButton from './StarButton'
import TagSelect from './TagSelect'
import FolderSelect from './FolderSelect'
import dataApi from 'browser/main/lib/dataApi'
import { hashHistory } from 'react-router'
import ee from 'browser/main/lib/eventEmitter'
import markdown from 'browser/lib/markdownTextHelper'
import StatusBar from '../StatusBar'
import _ from 'lodash'
import { findNoteTitle } from 'browser/lib/findNoteTitle'
import AwsMobileAnalyticsConfig from 'browser/main/lib/AwsMobileAnalyticsConfig'
import TrashButton from './TrashButton'
import PermanentDeleteButton from './PermanentDeleteButton'
import InfoButton from './InfoButton'
import InfoPanel from './InfoPanel'
import InfoPanelTrashed from './InfoPanelTrashed'
import { formatDate } from 'browser/lib/date-formatter'
import { getTodoPercentageOfCompleted } from 'browser/lib/getTodoStatus'
import striptags from 'striptags'

const electron = require('electron')
const { remote } = electron
const { dialog } = remote

class MarkdownNoteDetail extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      isMovingNote: false,
      note: Object.assign({
        title: '',
        content: ''
      }, props.note),
      isLockButtonShown: false,
      isLocked: false
    }
    this.dispatchTimer = null

    this.toggleLockButton = this.handleToggleLockButton.bind(this)
  }

  focus () {
    this.refs.content.focus()
  }

  componentDidMount () {
    ee.on('topbar:togglelockbutton', this.toggleLockButton)
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.note.key !== this.props.note.key && !this.isMovingNote) {
      if (this.saveQueue != null) this.saveNow()
      this.setState({
        note: Object.assign({}, nextProps.note)
      }, () => {
        if (nextProps.config.editor.type === 'DEFAULT') this.refs.content.reload()
        if (this.refs.tags) this.refs.tags.reset()
      })
    }
  }

  componentWillUnmount () {
    if (this.saveQueue != null) this.saveNow()
  }

  componentDidUnmount () {
    ee.off('topbar:togglelockbutton', this.toggleLockButton)
  }

  handleChange (content = '') {
    const { note } = this.state
    const { config } = this.props

    if (config.editor.type === 'WYSIWYG') {
      note.content = content
    } else {
      note.content = this.refs.content.value
    }

    if (this.refs.tags) note.tags = this.refs.tags.value
    note.title = markdown.strip(striptags(findNoteTitle(note.content)))
    note.updatedAt = new Date()

    this.setState({
      note
    }, () => {
      this.save()
    })
  }

  save () {
    clearTimeout(this.saveQueue)
    this.saveQueue = setTimeout(() => {
      this.saveNow()
    }, 1000)
  }

  saveNow () {
    const { note, dispatch } = this.props
    clearTimeout(this.saveQueue)
    this.saveQueue = null

    dataApi
      .updateNote(note.storage, note.key, this.state.note)
      .then((note) => {
        dispatch({
          type: 'UPDATE_NOTE',
          note: note
        })
        AwsMobileAnalyticsConfig.recordDynamicCustomEvent('EDIT_NOTE')
      })
  }

  handleFolderChange (e) {
    const { note } = this.state
    const value = this.refs.folder.value
    const splitted = value.split('-')
    const newStorageKey = splitted.shift()
    const newFolderKey = splitted.shift()

    dataApi
      .moveNote(note.storage, note.key, newStorageKey, newFolderKey)
      .then((newNote) => {
        this.setState({
          isMovingNote: true,
          note: Object.assign({}, newNote)
        }, () => {
          const { dispatch, location } = this.props
          dispatch({
            type: 'MOVE_NOTE',
            originNote: note,
            note: newNote
          })
          hashHistory.replace({
            pathname: location.pathname,
            query: {
              key: newNote.storage + '-' + newNote.key
            }
          })
          this.setState({
            isMovingNote: false
          })
        })
      })
  }

  handleStarButtonClick (e) {
    const { note } = this.state
    if (!note.isStarred) AwsMobileAnalyticsConfig.recordDynamicCustomEvent('ADD_STAR')

    note.isStarred = !note.isStarred

    this.setState({
      note
    }, () => {
      this.save()
    })
  }

  exportAsFile () {

  }

  exportAsMd () {
    ee.emit('export:save-md')
  }

  exportAsTxt () {
    ee.emit('export:save-text')
  }

  handleTrashButtonClick (e) {
    const { note } = this.state
    const { isTrashed } = note

    if (isTrashed) {
      const dialogueButtonIndex = dialog.showMessageBox(remote.getCurrentWindow(), {
        type: 'warning',
        message: 'Confirm note deletion',
        detail: 'This will permanently remove this note.',
        buttons: ['Confirm', 'Cancel']
      })
      if (dialogueButtonIndex === 1) return
      const { note, dispatch } = this.props
      dataApi
        .deleteNote(note.storage, note.key)
        .then((data) => {
          const dispatchHandler = () => {
            dispatch({
              type: 'DELETE_NOTE',
              storageKey: data.storageKey,
              noteKey: data.noteKey
            })
          }
          ee.once('list:moved', dispatchHandler)
        })
    } else {
      note.isTrashed = true

      this.setState({
        note
      }, () => {
        this.save()
      })
    }
    ee.emit('list:next')
  }

  handleUndoButtonClick (e) {
    const { note } = this.state

    note.isTrashed = false

    this.setState({
      note
    }, () => {
      this.save()
      this.refs.content.reload()
      ee.emit('list:next')
    })
  }

  handleFullScreenButton (e) {
    ee.emit('editor:fullscreen')
  }

  handleLockButtonMouseDown (e) {
    e.preventDefault()
    ee.emit('editor:lock')
    this.setState({ isLocked: !this.state.isLocked })
    if (this.state.isLocked) this.focus()
  }

  getToggleLockButton () {
    return this.state.isLocked ? '../resources/icon/icon-edit-lock.svg' : '../resources/icon/icon-edit.svg'
  }

  handleDeleteKeyDown (e) {
    if (e.keyCode === 27) this.handleDeleteCancelButtonClick(e)
  }

  handleToggleLockButton (event, noteStatus) {
    // first argument event is not used
    if (this.props.config.editor.switchPreview === 'BLUR' && noteStatus === 'CODE') {
      this.setState({isLockButtonShown: true})
    } else {
      this.setState({isLockButtonShown: false})
    }
  }

  handleFocus (e) {
    this.focus()
  }

  handleInfoButtonClick (e) {
    const infoPanel = document.querySelector('.infoPanel')
    if (infoPanel.style) infoPanel.style.display = infoPanel.style.display === 'none' ? 'inline' : 'none'
  }

  print (e) {
    ee.emit('print')
  }

  renderEditor () {
    const { config } = this.props
    const editorType = config.editor.type
    if (editorType === 'WYSIWYG') {
      return <WYSIWYGEditor
        ref='content'
        value={this.state.note.content}
        config={config}
        onChange={(e) => this.handleChange(e)} />
    } else {
      return <MarkdownEditor
        ref='content'
        styleName='body-noteEditor'
        config={config}
        value={this.state.note.content}
        storageKey={this.state.note.storage}
        onChange={(e) => this.handleChange(e)}
        ignorePreviewPointerEvents={this.props.ignorePreviewPointerEvents} />
    }
  }

  render () {
    const { data, config, location } = this.props
    const { note } = this.state
    const storageKey = note.storage
    const folderKey = note.folder

    const options = []
    data.storageMap.forEach((storage, index) => {
      storage.folders.forEach((folder) => {
        options.push({
          storage: storage,
          folder: folder
        })
      })
    })
    const currentOption = options.filter((option) => option.storage.key === storageKey && option.folder.key === folderKey)[0]

    const trashTopBar = <div styleName='info'>
      <div styleName='info-left'>
        <i styleName='undo-button'
          className='fa fa-undo fa-fw'
          onClick={(e) => this.handleUndoButtonClick(e)}
        />
      </div>
      <div styleName='info-right'>
        <PermanentDeleteButton onClick={(e) => this.handleTrashButtonClick(e)} />
        <InfoButton
          onClick={(e) => this.handleInfoButtonClick(e)}
        />
        <InfoPanelTrashed
          storageName={currentOption.storage.name}
          folderName={currentOption.folder.name}
          updatedAt={formatDate(note.updatedAt)}
          createdAt={formatDate(note.createdAt)}
          exportAsMd={this.exportAsMd}
          exportAsTxt={this.exportAsTxt}
        />
      </div>
    </div>

    const detailTopBar = <div styleName='info'>
      <div styleName='info-left'>
        <div styleName='info-left-top'>
          <FolderSelect styleName='info-left-top-folderSelect'
            value={this.state.note.storage + '-' + this.state.note.folder}
            ref='folder'
            data={data}
            onChange={(e) => this.handleFolderChange(e)}
          />
        </div>

        <TagSelect
          ref='tags'
          value={this.state.note.tags}
          onChange={(e) => this.handleChange(e)}
        />
        <TodoListPercentage
          percentageOfTodo={getTodoPercentageOfCompleted(note.content)}
        />
      </div>
      <div styleName='info-right'>
        <InfoButton
          onClick={(e) => this.handleInfoButtonClick(e)}
        />

        <StarButton
          onClick={(e) => this.handleStarButtonClick(e)}
          isActive={note.isStarred}
        />

        {(() => {
          const imgSrc = `${this.getToggleLockButton()}`
          const lockButtonComponent =
            <button styleName='control-lockButton'
              onFocus={(e) => this.handleFocus(e)}
              onMouseDown={(e) => this.handleLockButtonMouseDown(e)}
            >
              <img styleName='iconInfo' src={imgSrc} />
            </button>

          return (
            this.state.isLockButtonShown ? lockButtonComponent : ''
          )
        })()}

        <button styleName='control-fullScreenButton'
          onMouseDown={(e) => this.handleFullScreenButton(e)}
        >
          <img styleName='iconInfo' src='../resources/icon/icon-sidebar.svg' />
        </button>

        <TrashButton onClick={(e) => this.handleTrashButtonClick(e)} />

        <InfoPanel
          storageName={currentOption.storage.name}
          folderName={currentOption.folder.name}
          noteLink={`[${note.title}](${location.query.key})`}
          updatedAt={formatDate(note.updatedAt)}
          createdAt={formatDate(note.createdAt)}
          exportAsMd={this.exportAsMd}
          exportAsTxt={this.exportAsTxt}
          wordCount={note.content.split(' ').length}
          letterCount={note.content.replace(/\r?\n/g, '').length}
          type={note.type}
          print={this.print}
        />
      </div>
    </div>

    return (
      <div className='NoteDetail'
        style={this.props.style}
        styleName='root'
      >

        {location.pathname === '/trashed' ? trashTopBar : detailTopBar}

        <div styleName='body'>
          {this.renderEditor()}
        </div>

        <StatusBar
          {..._.pick(this.props, ['config', 'location', 'dispatch'])}
          date={note.updatedAt}
        />
      </div>
    )
  }
}

MarkdownNoteDetail.propTypes = {
  dispatch: PropTypes.func,
  repositories: PropTypes.array,
  note: PropTypes.shape({

  }),
  style: PropTypes.shape({
    left: PropTypes.number
  }),
  ignorePreviewPointerEvents: PropTypes.bool
}

export default CSSModules(MarkdownNoteDetail, styles)
