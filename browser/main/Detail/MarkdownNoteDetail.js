import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './MarkdownNoteDetail.styl'
import MarkdownEditor from 'browser/components/MarkdownEditor'
import StarButton from './StarButton'
import TagSelect from './TagSelect'
import FolderSelect from './FolderSelect'
import dataApi from 'browser/main/lib/dataApi'
import { hashHistory } from 'react-router'
import ee from 'browser/main/lib/eventEmitter'
import markdown from 'browser/lib/markdown'
import StatusBar from '../StatusBar'
import _ from 'lodash'

const electron = require('electron')
const { remote } = electron
const { Menu, MenuItem, dialog } = remote

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
        this.refs.content.reload()
        this.refs.tags.reset()
      })
    }
  }

  componentWillUnmount () {
    if (this.saveQueue != null) this.saveNow()
  }

  componentDidUnmount () {
    ee.off('topbar:togglelockbutton', this.toggleLockButton)
  }

  findTitle (value) {
    let splitted = value.split('\n')
    let title = null
    let isMarkdownInCode = false

    for (let i = 0; i < splitted.length; i++) {
      let trimmedLine = splitted[i].trim()
      if (trimmedLine.match('```')) {
        isMarkdownInCode = !isMarkdownInCode
      } else if (isMarkdownInCode === false && trimmedLine.match(/^# +/)) {
        title = trimmedLine.substring(1, trimmedLine.length).trim()
        break
      }
    }

    if (title == null) {
      for (let i = 0; i < splitted.length; i++) {
        let trimmedLine = splitted[i].trim()
        if (trimmedLine.length > 0) {
          title = trimmedLine
          break
        }
      }
      if (title == null) {
        title = ''
      }
    }

    title = markdown.strip(title)

    return title
  }

  handleChange (e) {
    let { note } = this.state

    note.content = this.refs.content.value
    note.tags = this.refs.tags.value
    note.title = this.findTitle(note.content)
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
    let { note, dispatch } = this.props
    clearTimeout(this.saveQueue)
    this.saveQueue = null

    dataApi
      .updateNote(note.storage, note.key, this.state.note)
      .then((note) => {
        dispatch({
          type: 'UPDATE_NOTE',
          note: note
        })
      })
  }

  handleFolderChange (e) {
    let { note } = this.state
    let value = this.refs.folder.value
    let splitted = value.split('-')
    let newStorageKey = splitted.shift()
    let newFolderKey = splitted.shift()

    dataApi
      .moveNote(note.storage, note.key, newStorageKey, newFolderKey)
      .then((newNote) => {
        this.setState({
          isMovingNote: true,
          note: Object.assign({}, newNote)
        }, () => {
          let { dispatch, location } = this.props
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
    let { note } = this.state

    note.isStarred = !note.isStarred

    this.setState({
      note
    }, () => {
      this.save()
    })
  }

  exportAsFile () {

  }

  handleDeleteButtonClick (e) {
    let index = dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'warning',
      message: 'Delete a note',
      detail: 'This work cannot be undone.',
      buttons: ['Confirm', 'Cancel']
    })
    if (index === 0) {
      let { note, dispatch } = this.props
      dataApi
        .deleteNote(note.storage, note.key)
        .then((data) => {
          let dispatchHandler = () => {
            dispatch({
              type: 'DELETE_NOTE',
              storageKey: data.storageKey,
              noteKey: data.noteKey
            })
          }
          ee.once('list:moved', dispatchHandler)
          ee.emit('list:next')
        })
    }
  }

  handleLockButtonMouseDown (e) {
    e.preventDefault()
    ee.emit('editor:lock')
    this.setState({ isLocked: !this.state.isLocked })
    if (this.state.isLocked) this.focus()
  }

  getToggleLockButton () {
    return this.state.isLocked ? 'fa-lock' : 'fa-unlock-alt'
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

  render () {
    let { data, config } = this.props
    let { note } = this.state

    return (
      <div className='NoteDetail'
        style={this.props.style}
        styleName='root'
      >
        <div styleName='info'>
          <div styleName='info-left'>
            <StarButton styleName='info-left-button'
              onClick={(e) => this.handleStarButtonClick(e)}
              isActive={note.isStarred}
            />
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
          </div>
          <div styleName='info-right'>
            {(() => {
              const faClassName = `fa ${this.getToggleLockButton()}`
              const lockButtonComponent =
                <button styleName='control-lockButton'
                  onFocus={(e) => this.handleFocus(e)}
                  onMouseDown={(e) => this.handleLockButtonMouseDown(e)}
                >
                  <i className={faClassName} styleName='lock-button' />
                  <span styleName='control-lockButton-tooltip'>
                    {this.state.isLocked ? 'Unlock' : 'Lock'}
                  </span>
                </button>
              return (
                this.state.isLockButtonShown ? lockButtonComponent : ''
              )
            })()}
            <button styleName='control-trashButton'
              onClick={(e) => this.handleDeleteButtonClick(e)}
            >
              <svg height='14px' id='Capa_1' style={{enableBackground: 'new 0 0 753.23 753.23'}} width='14px' version='1.1' viewBox='0 0 753.23 753.23' x='0px' y='0px' xmlSpace='preserve'>
                <g>
                  <g id='_x34__19_'>
                    <g>
                      <path d='M494.308,659.077c12.993,0,23.538-10.546,23.538-23.539V353.077c0-12.993-10.545-23.539-23.538-23.539&#xA;&#x9;&#x9;&#x9;&#x9;s-23.538,10.545-23.538,23.539v282.461C470.77,648.531,481.314,659.077,494.308,659.077z M635.538,94.154h-141.23V47.077&#xA;&#x9;&#x9;&#x9;&#x9;C494.308,21.067,473.24,0,447.23,0H306c-26.01,0-47.077,21.067-47.077,47.077v47.077h-141.23&#xA;&#x9;&#x9;&#x9;&#x9;c-26.01,0-47.077,21.067-47.077,47.077v47.077c0,25.986,21.067,47.077,47.077,47.077v423.692&#xA;&#x9;&#x9;&#x9;&#x9;c0,51.996,42.157,94.153,94.154,94.153h329.539c51.996,0,94.153-42.157,94.153-94.153V235.385&#xA;&#x9;&#x9;&#x9;&#x9;c26.01,0,47.077-21.091,47.077-47.077V141.23C682.615,115.221,661.548,94.154,635.538,94.154z M306,70.615&#xA;&#x9;&#x9;&#x9;&#x9;c0-12.993,10.545-23.539,23.538-23.539h94.154c12.993,0,23.538,10.545,23.538,23.539v23.539c-22.809,0-141.23,0-141.23,0V70.615z&#xA;&#x9;&#x9;&#x9;&#x9; M588.461,659.077c0,25.986-21.066,47.076-47.076,47.076H211.846c-26.01,0-47.077-21.09-47.077-47.076V235.385h423.692V659.077z&#xA;&#x9;&#x9;&#x9;&#x9; M612,188.308H141.23c-12.993,0-23.538-10.545-23.538-23.539s10.545-23.539,23.538-23.539H612&#xA;&#x9;&#x9;&#x9;&#x9;c12.993,0,23.538,10.545,23.538,23.539S624.993,188.308,612,188.308z M258.923,659.077c12.993,0,23.539-10.546,23.539-23.539&#xA;&#x9;&#x9;&#x9;&#x9;V353.077c0-12.993-10.545-23.539-23.539-23.539s-23.539,10.545-23.539,23.539v282.461&#xA;&#x9;&#x9;&#x9;&#x9;C235.384,648.531,245.93,659.077,258.923,659.077z M376.615,659.077c12.993,0,23.538-10.546,23.538-23.539V353.077&#xA;&#x9;&#x9;&#x9;&#x9;c0-12.993-10.545-23.539-23.538-23.539s-23.539,10.545-23.539,23.539v282.461C353.077,648.531,363.622,659.077,376.615,659.077z' />
                    </g>
                  </g>
                </g>
              </svg>
            </button>
          </div>
        </div>

        <div styleName='body'>
          <MarkdownEditor
            ref='content'
            styleName='body-noteEditor'
            config={config}
            value={this.state.note.content}
            onChange={(e) => this.handleChange(e)}
            ignorePreviewPointerEvents={this.props.ignorePreviewPointerEvents}
          />
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
