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

    this.jumpToTopHandler = () => {
      this.jumpToTop()
    }

    this.state = {
    }
  }

  componentDidMount () {
    this.refreshTimer = setInterval(() => this.forceUpdate(), 60 * 1000)
    ee.on('list:next', this.selectNextNoteHandler)
    ee.on('list:prior', this.selectPriorNoteHandler)
    ee.on('list:focus', this.focusHandler)
    ee.on('list:isMarkdownNote', this.alertIfSnippetHandler)
    ee.on('list:top', this.jumpToTopHandler)
    ee.on('list:jumpToTop', this.jumpToTopHandler)
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
    ee.off('list:top', this.jumpToTopHandler)
    ee.off('list:jumpToTop', this.jumpToTopHandler)
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

    let targetIndex = _.findIndex(this.notes, (note) => {
      return note.storage + '-' + note.key === location.query.key
    })

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

    if (location.pathname.match(/\/home/)) {
      return data.noteMap.map((note) => note)
    }

    if (location.pathname.match(/\/starred/)) {
      return data.starredSet.toJS()
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

  handleNoteContextMenu (e, uniqueKey) {
    let menu = new Menu()
    menu.append(new MenuItem({
      label: 'Delete Note',
      click: (e) => this.handleDeleteNote(e, uniqueKey)
    }))
    menu.popup()
  }

  handleDeleteNote (e, uniqueKey) {
    let index = dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'warning',
      message: 'Delete a note',
      detail: 'This work cannot be undone.',
      buttons: ['Confirm', 'Cancel']
    })
    if (index === 0) {
      let { dispatch, location } = this.props
      let splitted = uniqueKey.split('-')
      let storageKey = splitted.shift()
      let noteKey = splitted.shift()

      dataApi
        .deleteNote(storageKey, noteKey)
        .then((data) => {
          let dispatchHandler = () => {
            dispatch({
              type: 'DELETE_NOTE',
              storageKey: data.storageKey,
              noteKey: data.noteKey
            })
          }

          if (location.query.key === uniqueKey) {
            ee.once('list:moved', dispatchHandler)
            ee.emit('list:next')
          } else {
            dispatchHandler()
          }
        })
    }
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
        detail: 'md/text import is available only a markdown note.'
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

  render () {
    let { location, notes, config } = this.props
    let sortFunc = config.sortBy === 'CREATED_AT'
      ? sortByCreatedAt
      : config.sortBy === 'ALPHABETICAL'
      ? sortByAlphabetical
      : sortByUpdatedAt
    this.notes = notes = this.getNotes()
      .sort(sortFunc)

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
        ).fromNow()
        const key = `${note.storage}-${note.key}`

        if (isDefault) {
          return (
            <NoteItem
              isActive={isActive}
              note={note}
              dateDisplay={dateDisplay}
              key={key}
              handleNoteClick={this.handleNoteClick.bind(this)}
              handleNoteContextMenu={this.handleNoteContextMenu.bind(this)}
            />
          )
        }

        return (
          <NoteItemSimple
            isActive={isActive}
            note={note}
            key={key}
            handleNoteClick={this.handleNoteClick.bind(this)}
            handleNoteContextMenu={this.handleNoteContextMenu.bind(this)}
          />
        )
      })

    return (
      <div className='NoteList'
        styleName='root'
        style={this.props.style}
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
