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
import searchFromNotes from 'browser/lib/search'
import fs from 'fs'
import { hashHistory } from 'react-router'
import markdown from 'browser/lib/markdown'
import { findNoteTitle } from 'browser/lib/findNoteTitle'
import stripgtags from 'striptags'
import store from 'browser/main/store'

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
      console.log('fired next')
      this.selectNextNote()
    }
    this.selectPriorNoteHandler = () => {
      this.selectPriorNote()
    }
    this.focusHandler = () => {
      this.refs.list.focus()
    }
    this.alertIfSnippetHandler = () => {
      this.alertIfSnippet()
    }
    this.importFromFileHandler = this.importFromFile.bind(this)
    this.jumpNoteByHash = this.jumpNoteByHashHandler.bind(this)

    this.state = {
    }

    this.contextNotes = []
  }

  componentDidMount () {
    this.refreshTimer = setInterval(() => this.forceUpdate(), 60 * 1000)
    ee.on('list:next', this.selectNextNoteHandler)
    ee.on('list:prior', this.selectPriorNoteHandler)
    ee.on('list:focus', this.focusHandler)
    ee.on('list:isMarkdownNote', this.alertIfSnippetHandler)
    ee.on('import:file', this.importFromFileHandler)
    ee.on('list:jump', this.jumpNoteByHash)
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.location.pathname !== this.props.location.pathname) {
      this.resetScroll()
    }
  }

  resetScroll () {
    this.refs.list.scrollTop = 0
  }

  componentWillUnmount () {
    clearInterval(this.refreshTimer)

    ee.off('list:next', this.selectNextNoteHandler)
    ee.off('list:prior', this.selectPriorNoteHandler)
    ee.off('list:focus', this.focusHandler)
    ee.off('list:isMarkdownNote', this.alertIfSnippetHandler)
    ee.off('import:file', this.importFromFileHandler)
    ee.off('list:jump', this.jumpNoteByHash)
  }

  componentDidUpdate (prevProps) {
    let { location } = this.props

    if (this.notes.length > 0 && location.query.key == null) {
      let { router } = this.context
      if (!location.pathname.match(/\/searched/)) this.contextNotes = this.getContextNotes()
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
      const targetIndex = this.getTargetIndex()
      if (targetIndex > -1) {
        let list = this.refs.list
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

    let targetIndex = this.getTargetIndex()

    if (targetIndex === 0) {
      return
    }
    targetIndex--
    if (targetIndex < 0) targetIndex = 0

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

    let targetIndex = this.getTargetIndex()

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

    let targetIndex = this.getTargetIndex()

    if (targetIndex < 0) targetIndex = 0

    router.push({
      pathname: location.pathname,
      query: {
        key: this.notes[targetIndex].storage + '-' + this.notes[targetIndex].key
      }
    })

    ee.emit('list:moved')
  }

  handleNoteListKeyDown (e) {
    if (e.metaKey || e.ctrlKey) return true

    if (e.keyCode === 65 && !e.shiftKey) {
      e.preventDefault()
      ee.emit('top:new-note')
    }

    if (e.keyCode === 68) {
      e.preventDefault()
      ee.emit('detail:delete')
    }

    if (e.keyCode === 69) {
      e.preventDefault()
      ee.emit('detail:focus')
    }

    if (e.keyCode === 38) {
      e.preventDefault()
      this.selectPriorNote()
    }

    if (e.keyCode === 40) {
      e.preventDefault()
      this.selectNextNote()
    }
  }

  getNotes () {
    let { data, params, location } = this.props
    let { router } = this.context

    if (location.pathname.match(/\/home/) || location.pathname.match(/\alltags/)) {
      const allNotes = data.noteMap.map((note) => note)
      this.contextNotes = allNotes
      return allNotes
    }

    if (location.pathname.match(/\/starred/)) {
      const starredNotes = data.starredSet.toJS().map((uniqueKey) => data.noteMap.get(uniqueKey))
      this.contextNotes = starredNotes
      return starredNotes
    }

    if (location.pathname.match(/\/searched/)) {
      const searchInputText = document.getElementsByClassName('searchInput')[0].value
      if (searchInputText === '') {
        return this.sortByPin(this.contextNotes)
      }
      return searchFromNotes(this.contextNotes, searchInputText)
    }

    if (location.pathname.match(/\/trashed/)) {
      const trashedNotes = data.trashedSet.toJS().map((uniqueKey) => data.noteMap.get(uniqueKey))
      this.contextNotes = trashedNotes
      return trashedNotes
    }

    if (location.pathname.match(/\/tags/)) {
      return data.noteMap.map(note => {
        return note
      }).filter(note => {
        return note.tags.includes(params.tagname)
      })
    }

    return this.getContextNotes()
  }

  // get notes in the current folder
  getContextNotes () {
    const { data, params } = this.props
    const storageKey = params.storageKey
    const folderKey = params.folderKey
    const storage = data.storageMap.get(storageKey)
    if (storage === undefined) return []

    const folder = _.find(storage.folders, {key: folderKey})
    if (folder === undefined) {
      const storageNoteSet = data.storageNoteMap.get(storage.key) || []
      return storageNoteSet.map((uniqueKey) => data.noteMap.get(uniqueKey))
    }

    const folderNoteKeyList = data.folderNoteMap.get(`${storage.key}-${folder.key}`) || []
    return folderNoteKeyList.map((uniqueKey) => data.noteMap.get(uniqueKey))
  }

  sortByPin (unorderedNotes) {
    const pinnedNotes = []
    const unpinnedNotes = []

    unorderedNotes.forEach((note) => {
      if (note.isPinned) {
        pinnedNotes.push(note)
      } else {
        unpinnedNotes.push(note)
      }
    })

    return pinnedNotes.concat(unpinnedNotes)
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
    const targetIndex = this.getTargetIndex()
    if (this.notes[targetIndex].type === 'SNIPPET_NOTE') {
      dialog.showMessageBox(remote.getCurrentWindow(), {
        type: 'warning',
        message: 'Sorry!',
        detail: 'md/text import is available only a markdown note.',
        buttons: ['OK', 'Cancel']
      })
    }
  }

  handleDragStart (e, note) {
    const noteData = JSON.stringify(note)
    e.dataTransfer.setData('note', noteData)
  }

  handleNoteContextMenu (e, uniqueKey) {
    const { location } = this.props
    const note = this.notes.find((note) => {
      const noteKey = `${note.storage}-${note.key}`
      return noteKey === uniqueKey
    })

    const pinLabel = note.isPinned ? 'Remove pin' : 'Pin to Top'
    const deleteLabel = 'Delete Note'

    const menu = new Menu()
    if (!location.pathname.match(/\/home|\/starred|\/trash/)) {
      menu.append(new MenuItem({
        label: pinLabel,
        click: (e) => this.pinToTop(e, uniqueKey)
      }))
    }
    menu.append(new MenuItem({
      label: deleteLabel,
      click: (e) => this.deleteNote(e, uniqueKey)
    }))
    menu.popup()
  }

  pinToTop (e, uniqueKey) {
    const { data, params } = this.props
    const storageKey = params.storageKey
    const folderKey = params.folderKey

    const currentStorage = data.storageMap.get(storageKey)
    const currentFolder = _.find(currentStorage.folders, {key: folderKey})

    this.handleNoteClick(e, uniqueKey)
    const targetIndex = this.getTargetIndex()
    let note = this.notes[targetIndex]
    note.isPinned = !note.isPinned

    dataApi
      .updateNote(note.storage, note.key, note)
      .then((note) => {
        store.dispatch({
          type: 'UPDATE_NOTE',
          note: note
        })
      })
  }

  deleteNote (e, uniqueKey) {
    this.handleNoteClick(e, uniqueKey)
    ee.emit('detail:delete')
  }

  importFromFile () {
    const { dispatch, location } = this.props

    const options = {
      filters: [
        { name: 'Documents', extensions: ['md', 'txt'] }
      ],
      properties: ['openFile', 'multiSelections']
    }

    dialog.showOpenDialog(remote.getCurrentWindow(), options, (filepaths) => {
      this.addNotesFromFiles(filepaths)
    })
  }

  handleDrop (e) {
    e.preventDefault()
    const { location } = this.props
    const filepaths = Array.from(e.dataTransfer.files).map(file => { return file.path })
    if (!location.pathname.match(/\/trashed/)) this.addNotesFromFiles(filepaths)
  }

  // Add notes to the current folder
  addNotesFromFiles (filepaths) {
    const { dispatch, location } = this.props

    const targetIndex = this.getTargetIndex()

    const storageKey = this.notes[targetIndex].storage
    const folderKey = this.notes[targetIndex].folder

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
  }

  getTargetIndex () {
    const { location } = this.props
    const targetIndex = _.findIndex(this.notes, (note) => {
      return `${note.storage}-${note.key}` === location.query.key
    })
    return targetIndex
  }

  render () {
    let { location, notes, config, dispatch } = this.props
    let sortFunc = config.sortBy === 'CREATED_AT'
      ? sortByCreatedAt
      : config.sortBy === 'ALPHABETICAL'
      ? sortByAlphabetical
      : sortByUpdatedAt
    const sortedNotes = location.pathname.match(/\/home|\/starred|\/trash/)
        ? this.getNotes().sort(sortFunc)
        : this.sortByPin(this.getNotes().sort(sortFunc))
    this.notes = notes = sortedNotes.filter((note) => {
      // this is for the trash box
      if (note.isTrashed !== true || location.pathname === '/trashed') return true
    })

    moment.locale('en', {
      relativeTime: {
        future: 'in %s',
        past: '%s ago',
        s: '%ds',
        ss: '%ss',
        m: '1m',
        mm: '%dm',
        h: 'an hour',
        hh: '%dh',
        d: '1d',
        dd: '%dd',
        M: '1M',
        MM: '%dM',
        y: '1Y',
        yy: '%dY'
      }
    })

    let noteList = notes
      .map(note => {
        if (note == null) {
          return null
        }

        const isDefault = config.listStyle === 'DEFAULT'
        const isActive = location.query.key === note.storage + '-' + note.key
        const dateDisplay = moment(
          config.sortBy === 'CREATED_AT'
            ? note.createdAt : note.updatedAt
        ).fromNow('D')
        const key = `${note.storage}-${note.key}`

        if (isDefault) {
          return (
            <NoteItem
              isActive={isActive}
              note={note}
              dateDisplay={dateDisplay}
              key={key}
              handleNoteContextMenu={this.handleNoteContextMenu.bind(this)}
              handleNoteClick={this.handleNoteClick.bind(this)}
              handleDragStart={this.handleDragStart.bind(this)}
              pathname={location.pathname}
            />
          )
        }

        return (
          <NoteItemSimple
            isActive={isActive}
            note={note}
            key={key}
            handleNoteContextMenu={this.handleNoteContextMenu.bind(this)}
            handleNoteClick={this.handleNoteClick.bind(this)}
            handleDragStart={this.handleDragStart.bind(this)}
          />
        )
      })

    return (
      <div className='NoteList'
        styleName='root'
        style={this.props.style}
        onDrop={(e) => this.handleDrop(e)}
      >
        <div styleName='control'>
          <div styleName='control-sortBy'>
            <i className='fa fa-angle-down' />
            <select styleName='control-sortBy-select'
              value={config.sortBy}
              onChange={(e) => this.handleSortByChange(e)}
            >
              <option value='UPDATED_AT'>Updated</option>
              <option value='CREATED_AT'>Created</option>
              <option value='ALPHABETICAL'>Alphabetically</option>
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
          ref='list'
          tabIndex='-1'
          onKeyDown={(e) => this.handleNoteListKeyDown(e)}
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
  dispatch: PropTypes.func,
  repositories: PropTypes.array,
  style: PropTypes.shape({
    width: PropTypes.number
  })
}

export default CSSModules(NoteList, styles)
