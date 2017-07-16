import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './NoteList.styl'
import moment from 'moment'
import _ from 'lodash'
import ee from 'browser/main/lib/eventEmitter'
import dataApi from 'browser/main/lib/dataApi'
import ConfigManager from 'browser/main/lib/ConfigManager'
import NoteItem from 'browser/components/NoteItem'
import NoteItemSimple from 'browser/components/NoteItemSimple'
import { focusSideNav, focusNoteList, unfocusNoteList } from 'browser/ducks/focus'
import searchFromNotes from 'browser/lib/search'
import fs from 'fs'
import { hashHistory } from 'react-router'
import markdown from 'browser/lib/markdown'
import { findNoteTitle } from 'browser/lib/findNoteTitle'

const { remote } = require('electron')
const { Menu, MenuItem, dialog } = remote

function sortByCreatedAt (a, b) {
  return new Date(b.createdAt) - new Date(a.createdAt)
}

function sortByAlphabetical (a, b) {
  return a.title.localeCompare(b.title)
}

function sortByUpdatedAt (a, b) {
  return new Date(b.updatedAt) - new Date(a.updatedAt)
}

class NoteList extends React.Component {
  constructor (props) {
    super(props)

    this.selectNextNoteHandler = () => {
      this.selectNextNote()
    }
    this.selectPriorNoteHandler = () => {
      this.selectPriorNote()
    }
    this.focusHandler = () => {
      this.list.focus()
    }
    this.alertIfSnippetHandler = () => {
      this.alertIfSnippet()
    }
    this.importFromFileHandler = this.importFromFile.bind(this)
    this.jumpNoteByHash = this.jumpNoteByHashHandler.bind(this)

    this.jumpToTopHandler = () => {
      this.jumpToTop()
    }

    this.state = {
    }

    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
  }

  componentDidMount () {
    this.refreshTimer = setInterval(() => this.forceUpdate(), 60 * 1000)
    ee.on('list:next', this.selectNextNoteHandler)
    ee.on('list:prior', this.selectPriorNoteHandler)
    ee.on('list:focus', this.focusHandler)
    ee.on('list:isMarkdownNote', this.alertIfSnippetHandler)
    ee.on('list:top', this.jumpToTopHandler)
    ee.on('list:jumpToTop', this.jumpToTopHandler)
    ee.on('import:file', this.importFromFileHandler)
    ee.on('list:jump', this.jumpNoteByHash)
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.location.pathname !== this.props.location.pathname) {
      this.resetScroll()
    }
  }

  resetScroll () {
    this.list.scrollTop = 0
  }

  componentWillUnmount () {
    clearInterval(this.refreshTimer)

    ee.off('list:next', this.selectNextNoteHandler)
    ee.off('list:prior', this.selectPriorNoteHandler)
    ee.off('list:focus', this.focusHandler)
    ee.off('list:isMarkdownNote', this.alertIfSnippetHandler)
    ee.off('list:top', this.jumpToTopHandler)
    ee.off('list:jumpToTop', this.jumpToTopHandler)
    ee.off('import:file', this.importFromFileHandler)
    ee.off('list:jump', this.jumpNoteByHash)
  }

  componentDidUpdate (prevProps) {
    let { location } = this.props

    if (this.notes.length > 0 && location.query.key == null) {
      let { router } = this.context
      router.replace({
        pathname: location.pathname,
        query: {
          key: this.notes[0].storage + '-' + this.notes[0].key
        }
      })
      return
    }

    // Auto scroll
    if (_.isString(location.query.key) && prevProps.location.query.key === location.query.key) {
      let targetIndex = _.findIndex(this.notes, (note) => {
        return note != null && note.storage + '-' + note.key === location.query.key
      })
      if (targetIndex > -1) {
        let list = this.list
        let item = list.childNodes[targetIndex]

        if (item == null) return false

        let overflowBelow = item.offsetTop + item.clientHeight - list.clientHeight - list.scrollTop > 0
        if (overflowBelow) {
          list.scrollTop = item.offsetTop + item.clientHeight - list.clientHeight
        }
        let overflowAbove = list.scrollTop > item.offsetTop
        if (overflowAbove) {
          list.scrollTop = item.offsetTop
        }
      }
    }
  }

  selectPriorNote () {
    if (this.notes == null || this.notes.length === 0) {
      return
    }
    let { router } = this.context
    let { location } = this.props

    let targetIndex = _.findIndex(this.notes, (note) => {
      return note.storage + '-' + note.key === location.query.key
    })

    targetIndex--
    if (targetIndex < 0) targetIndex = this.notes.length - 1

    router.push({
      pathname: location.pathname,
      query: {
        key: this.notes[targetIndex].storage + '-' + this.notes[targetIndex].key
      }
    })
  }

  selectNextNote () {
    if (this.notes == null || this.notes.length === 0) {
      return
    }
    let { router } = this.context
    let { location } = this.props

    let targetIndex = _.findIndex(this.notes, (note) => {
      return note.storage + '-' + note.key === location.query.key
    })

    if (targetIndex === this.notes.length - 1) {
      targetIndex = 0
    } else {
      targetIndex++
      if (targetIndex < 0) targetIndex = 0
      else if (targetIndex > this.notes.length - 1) targetIndex === this.notes.length - 1
    }

    router.push({
      pathname: location.pathname,
      query: {
        key: this.notes[targetIndex].storage + '-' + this.notes[targetIndex].key
      }
    })
    ee.emit('list:moved')
  }

  jumpNoteByHashHandler (event, noteHash) {
    // first argument event isn't used.
    if (this.notes === null || this.notes.length === 0) {
      return
    }

    const { router } = this.context
    const { location } = this.props

    let targetIndex = _.findIndex(this.notes, (note) => {
      return note.storage + '-' + note.key === noteHash
    })

    if (targetIndex < 0) targetIndex = 0

    router.push({
      pathname: location.pathname,
      query: {
        key: this.notes[targetIndex].storage + '-' + this.notes[targetIndex].key
      }
    })

    ee.emit('list:moved')
  }

  handleKeyDown (e) {
    if (e.keyCode === 65 && !e.shiftKey) {
      e.preventDefault()
      ee.emit('top:new-note')
    } else if (e.keyCode === 68) {
      e.preventDefault()
      ee.emit('detail:delete')
    } else if (e.keyCode === 69) {
      e.preventDefault()
      ee.emit('detail:focus')
    } else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
      e.preventDefault()
      this.selectPriorNote()
    } else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
      e.preventDefault()
      this.selectNextNote()
    } else if (e.key === 'ArrowLeft' || (e.ctrlKey && e.key === 'b')) {
      e.preventDefault()
      this.props.dispatch(unfocusNoteList())
      this.props.dispatch(focusSideNav())
    }
  }

  getNotes () {
    let { data, params, location } = this.props
    let { router } = this.context

    if (location.pathname.match(/\/home/)) {
      return data.noteMap.map((note) => note)
    }

    if (location.pathname.match(/\/starred/)) {
      return data.starredSet.toJS()
        .map((uniqueKey) => data.noteMap.get(uniqueKey))
    }

    if (location.pathname.match(/\/searched/)) {
      const searchInputText = document.getElementsByClassName('searchInput')[0].value
      if (searchInputText === '') {
        router.push('/home')
      }
      return searchFromNotes(this.props.data, searchInputText)
    }

    if (location.pathname.match(/\/trashed/)) {
      return data.trashedSet.toJS()
        .map((uniqueKey) => data.noteMap.get(uniqueKey))
    }

    let storageKey = params.storageKey
    let folderKey = params.folderKey
    let storage = data.storageMap.get(storageKey)
    if (storage == null) return []

    let folder = _.find(storage.folders, {key: folderKey})
    if (folder == null) {
      let storageNoteSet = data.storageNoteMap
        .get(storage.key)
      if (storageNoteSet == null) storageNoteSet = []
      return storageNoteSet
        .map((uniqueKey) => data.noteMap.get(uniqueKey))
    }

    let folderNoteKeyList = data.folderNoteMap
      .get(storage.key + '-' + folder.key)

    return folderNoteKeyList != null
      ? folderNoteKeyList
        .map((uniqueKey) => data.noteMap.get(uniqueKey))
      : []
  }

  handleNoteClick (e, uniqueKey) {
    let { router } = this.context
    let { location } = this.props

    router.push({
      pathname: location.pathname,
      query: {
        key: uniqueKey
      }
    })
  }

  handleSortByChange (e) {
    let { dispatch } = this.props

    let config = {
      sortBy: e.target.value
    }

    ConfigManager.set(config)
    dispatch({
      type: 'SET_CONFIG',
      config
    })
  }

  handleListStyleButtonClick (e, style) {
    let { dispatch } = this.props

    let config = {
      listStyle: style
    }

    ConfigManager.set(config)
    dispatch({
      type: 'SET_CONFIG',
      config
    })
  }

  alertIfSnippet () {
    let { location } = this.props
    const targetIndex = _.findIndex(this.notes, (note) => {
      return `${note.storage}-${note.key}` === location.query.key
    })
    if (this.notes[targetIndex].type === 'SNIPPET_NOTE') {
      dialog.showMessageBox(remote.getCurrentWindow(), {
        type: 'warning',
        message: 'Sorry!',
        detail: 'md/text import is available only a markdown note.',
        buttons: ['OK', 'Cancel']
      })
    }
  }

  jumpToTop () {
    if (this.notes === null || this.notes.length === 0) {
      return
    }
    let { router } = this.context
    let { location } = this.props

    const targetIndex = 0

    router.push({
      pathname: location.pathname,
      query: {
        key: this.notes[targetIndex].storage + '-' + this.notes[targetIndex].key
      }
    })
  }

  handleDragStart (e, note) {
    const noteData = JSON.stringify(note)
    e.dataTransfer.setData('note', noteData)
  }

  importFromFile () {
    const { dispatch, location } = this.props

    const options = {
      filters: [
        { name: 'Documents', extensions: ['md', 'txt'] }
      ],
      properties: ['openFile', 'multiSelections']
    }

    const targetIndex = _.findIndex(this.notes, (note) => {
      return note !== null && `${note.storage}-${note.key}` === location.query.key
    })

    const storageKey = this.notes[targetIndex].storage
    const folderKey = this.notes[targetIndex].folder

    dialog.showOpenDialog(remote.getCurrentWindow(), options, (filepaths) => {
      if (filepaths === undefined) return
      filepaths.forEach((filepath) => {
        fs.readFile(filepath, (err, data) => {
          if (err) throw Error('File reading error: ', err)
          const content = data.toString()
          const newNote = {
            content: content,
            folder: folderKey,
            title: markdown.strip(findNoteTitle(content)),
            type: 'MARKDOWN_NOTE'
          }
          dataApi.createNote(storageKey, newNote)
          .then((note) => {
            dispatch({
              type: 'UPDATE_NOTE',
              note: note
            })
            hashHistory.push({
              pathname: location.pathname,
              query: {key: `${note.storage}-${note.key}`}
            })
          })
        })
      })
    })
  }

  handleFocus () {
    this.props.dispatch(focusNoteList())
  }

  handleBlur () {
    this.props.dispatch(unfocusNoteList())
  }

  render () {
    let notes = this.props.notes
    const { location, config, dispatch, noteListIsFocused } = this.props
    let sortFunc = config.sortBy === 'CREATED_AT'
      ? sortByCreatedAt
      : config.sortBy === 'ALPHABETICAL'
      ? sortByAlphabetical
      : sortByUpdatedAt
    this.notes = notes = this.getNotes()
      .sort(sortFunc)
      .filter((note) => {
        // this is for the trash box
        if (note.isTrashed !== true || location.pathname === '/trashed') return true
      })

    const noteList = notes
      .map(note => {
        if (note == null) {
          return null
        }

        const isDefault = config.listStyle === 'DEFAULT'
        const isActive = location.query.key === note.storage + '-' + note.key
        const dateDisplay = moment(
          config.sortBy === 'CREATED_AT'
            ? note.createdAt : note.updatedAt
        ).fromNow()
        const key = `${note.storage}-${note.key}`

        if (isDefault) {
          return (
            <NoteItem
              isActive={isActive}
              isFocused={isActive && noteListIsFocused}
              handleKeyDown={this.handleKeyDown}
              note={note}
              dateDisplay={dateDisplay}
              key={key}
              handleNoteClick={this.handleNoteClick.bind(this)}
              handleDragStart={this.handleDragStart.bind(this)}
            />
          )
        }

        return (
          <NoteItemSimple
            isActive={isActive}
            isFocused={isActive && noteListIsFocused}
            handleKeyDown={this.handleKeyDown}
            note={note}
            key={key}
            handleNoteClick={this.handleNoteClick.bind(this)}
            handleDragStart={this.handleDragStart.bind(this)}
          />
        )
      })

    return (
      <div className='NoteList'
        styleName='root'
        style={this.props.style}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
      >
        <div styleName='control'>
          <div styleName='control-sortBy'>
            <i className='fa fa-bolt' />
            <select styleName='control-sortBy-select'
              value={config.sortBy}
              onChange={(e) => this.handleSortByChange(e)}
            >
              <option value='UPDATED_AT'>Updated Time</option>
              <option value='CREATED_AT'>Created Time</option>
              <option value='ALPHABETICAL'>Alphabetical</option>
            </select>
          </div>
          <div styleName='control-button-area'>
            <button styleName={config.listStyle === 'DEFAULT'
                ? 'control-button--active'
                : 'control-button'
              }
              onClick={(e) => this.handleListStyleButtonClick(e, 'DEFAULT')}
            >
              <i className='fa fa-th-large' />
            </button>
            <button styleName={config.listStyle === 'SMALL'
                ? 'control-button--active'
                : 'control-button'
              }
              onClick={(e) => this.handleListStyleButtonClick(e, 'SMALL')}
            >
              <i className='fa fa-list-ul' />
            </button>
          </div>
        </div>
        <div styleName='list'
          ref={list => { this.list = list }}
          tabIndex='-1'
        >
          {noteList}
        </div>
      </div>
    )
  }
}
NoteList.contextTypes = {
  router: PropTypes.shape([])
}

NoteList.propTypes = {
  noteListIsFocused: PropTypes.bool,
  dispatch: PropTypes.func,
  repositories: PropTypes.array,
  style: PropTypes.shape({
    width: PropTypes.number
  })
}

export default CSSModules(NoteList, styles)
