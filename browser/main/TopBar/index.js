import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './TopBar.styl'
import _ from 'lodash'
import modal from 'browser/main/lib/modal'
import NewNoteModal from 'browser/main/modals/NewNoteModal'
import { hashHistory } from 'react-router'
import ee from 'browser/main/lib/eventEmitter'
import ConfigManager from 'browser/main/lib/ConfigManager'
import dataApi from 'browser/main/lib/dataApi'

const OSX = window.process.platform === 'darwin'

class TopBar extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      search: '',
      searchOptions: [],
      searchPopupOpen: false
    }

    this.newNoteHandler = () => {
      this.handleNewPostButtonClick()
    }

    this.focusSearchHandler = () => {
      this.handleOnSearchFocus()
    }
  }

  componentDidMount () {
    ee.on('top:new-note', this.newNoteHandler)
    ee.on('top:focus-search', this.focusSearchHandler)
  }

  componentWillUnmount () {
    ee.off('top:new-note', this.newNoteHandler)
    ee.off('top:focus-search', this.focusSearchHandler)
  }

  handleNewPostButtonClick (e) {
    let { config } = this.props

    switch (config.ui.defaultNote) {
      case 'MARKDOWN_NOTE':
        this.createNote('MARKDOWN_NOTE')
        break
      case 'SNIPPET_NOTE':
        this.createNote('SNIPPET_NOTE')
        break
      case 'ALWAYS_ASK':
      default:
        let { dispatch, location } = this.props
        let { storage, folder } = this.resolveTargetFolder()

        modal.open(NewNoteModal, {
          storage: storage.key,
          folder: folder.key,
          dispatch,
          location
        })
    }
  }

  resolveTargetFolder () {
    let { data, params } = this.props
    let storage = data.storageMap.get(params.storageKey)

    // Find first storage
    if (storage == null) {
      for (let kv of data.storageMap) {
        storage = kv[1]
        break
      }
    }
    if (storage == null) window.alert('No storage to create a note')
    let folder = _.find(storage.folders, {key: params.folderKey})
    if (folder == null) folder = storage.folders[0]
    if (folder == null) window.alert('No folder to create a note')

    return {
      storage,
      folder
    }
  }

  handleSearchChange (e) {
    this.setState({
      search: this.refs.searchInput.value
    })
  }

  getOptions () {
    let { data } = this.props
    let { search } = this.state
    let notes = data.noteMap.map((note) => note)
    if (search.trim().length === 0) return []
    let searchBlocks = search.split(' ')
    searchBlocks.forEach((block) => {
      if (block.match(/^!#.+/)) {
        let tag = block.match(/^!#(.+)/)[1]
        let regExp = new RegExp(_.escapeRegExp(tag), 'i')
        notes = notes
          .filter((note) => {
            if (!_.isArray(note.tags)) return false
            return note.tags.some((_tag) => {
              return _tag.match(regExp)
            })
          })
      } else if (block.match(/^!.+/)) {
        let block = block.match(/^!(.+)/)[1]
        let regExp = new RegExp(_.escapeRegExp(block), 'i')
        notes = notes.filter((note) => {
          if (!_.isArray(note.tags) || !note.tags.some((_tag) => {
            return _tag.match(regExp)
          })) {
            return true
          }
          if (note.type === 'SNIPPET_NOTE') {
            return !note.description.match(regExp)
          } else if (note.type === 'MARKDOWN_NOTE') {
            return !note.content.match(regExp)
          }
          return false
        })
      } else if (block.match(/^#.+/)) {
        let tag = block.match(/#(.+)/)[1]
        let regExp = new RegExp(_.escapeRegExp(tag), 'i')
        notes = notes
          .filter((note) => {
            if (!_.isArray(note.tags)) return false
            return note.tags.some((_tag) => {
              return _tag.match(regExp)
            })
          })
      } else {
        let regExp = new RegExp(_.escapeRegExp(block), 'i')
        notes = notes.filter((note) => {
          if (_.isArray(note.tags) && note.tags.some((_tag) => {
            return _tag.match(regExp)
          })) {
            return true
          }
          if (note.type === 'SNIPPET_NOTE') {
            return note.description.match(regExp)
          } else if (note.type === 'MARKDOWN_NOTE') {
            return note.content.match(regExp)
          }
          return false
        })
      }
    })

    return notes
  }

  handleOptionClick (uniqueKey) {
    return (e) => {
      this.setState({
        searchPopupOpen: false
      }, () => {
        let { location } = this.props
        hashHistory.push({
          pathname: location.pathname,
          query: {
            key: uniqueKey
          }
        })
      })
    }
  }

  handleSearchFocus (e) {
    this.setState({
      searchPopupOpen: true
    })
  }
  handleSearchBlur (e) {
    e.stopPropagation()

    let el = e.relatedTarget
    let isStillFocused = false
    while (el != null) {
      if (el === this.refs.search) {
        isStillFocused = true
        break
      }
      el = el.parentNode
    }
    if (!isStillFocused) {
      this.setState({
        searchPopupOpen: false
      })
    }
  }

  createNote (noteType) {
    let { dispatch, location } = this.props
    if (noteType !== 'MARKDOWN_NOTE' && noteType !== 'SNIPPET_NOTE') throw new Error('Invalid note type.')

    let { storage, folder } = this.resolveTargetFolder()

    let newNote = noteType === 'MARKDOWN_NOTE'
      ? {
        type: 'MARKDOWN_NOTE',
        folder: folder.key,
        title: '',
        content: ''
      }
      : {
        type: 'SNIPPET_NOTE',
        folder: folder.key,
        title: '',
        description: '',
        snippets: [{
          name: '',
          mode: 'text',
          content: ''
        }]
      }

    dataApi
      .createNote(storage.key, newNote)
      .then((note) => {
        dispatch({
          type: 'UPDATE_NOTE',
          note: note
        })
        hashHistory.push({
          pathname: location.pathname,
          query: {key: note.storage + '-' + note.key}
        })
        ee.emit('detail:focus')
      })
  }

  setDefaultNote (defaultNote) {
    let { config, dispatch } = this.props
    let ui = Object.assign(config.ui)
    ui.defaultNote = defaultNote
    ConfigManager.set({
      ui
    })

    dispatch({
      type: 'SET_UI',
      config: ConfigManager.get()
    })
  }

  handleOnSearchFocus () {
    if (this.state.searchPopupOpen) {
      this.refs.search.childNodes[0].blur()
    } else {
      this.refs.search.childNodes[0].focus()
    }
  }

  render () {
    let { config, style, data } = this.props
    const { search } = this.state
    let searchOptionList = this.getOptions()
      .map((note) => {
        // detect a matched line
        let matchedLine
        if (note.type === 'MARKDOWN_NOTE') {
          const regExp = new RegExp(_.escapeRegExp(search), 'i')
          note.content.split('\n').forEach((el) => {
            if (el.match(regExp) !== null) {
              matchedLine = el
            }
          })
        }
        let storage = data.storageMap.get(note.storage)
        let folder = _.find(storage.folders, {key: note.folder})
        return <div styleName='control-search-optionList-item'
          key={note.storage + '-' + note.key}
          onClick={(e) => this.handleOptionClick(note.storage + '-' + note.key)(e)}
        >
          <div styleName='control-search-optionList-item-folder'
            style={{borderColor: folder.color}}>
            {folder.name}
            <span styleName='control-search-optionList-item-folder-surfix'>in {storage.name}</span>
          </div>
          {note.type === 'SNIPPET_NOTE'
            ? <i styleName='control-search-optionList-item-type' className='fa fa-code' />
            : <i styleName='control-search-optionList-item-type' className='fa fa-file-text-o' />
          }&nbsp;
          {note.title}
          <div styleName='control-search-optionList-item-matchedContent'>{matchedLine}</div>
        </div>
      })

    return (
      <div className='TopBar'
        styleName={config.isSideNavFolded ? 'root--expanded' : 'root'}
        style={style}
      >
        <div styleName='control'>
          <div styleName='control-search'>
            <i styleName='control-search-icon' className='fa fa-search fa-fw' />
            <div styleName='control-search-input'
              onFocus={(e) => this.handleSearchFocus(e)}
              onBlur={(e) => this.handleSearchBlur(e)}
              tabIndex='-1'
              ref='search'
            >
              <input
                ref='searchInput'
                value={this.state.search}
                onChange={(e) => this.handleSearchChange(e)}
                placeholder='Search'
                type='text'
              />
              {this.state.searchPopupOpen &&
                <div styleName='control-search-optionList'>
                  {searchOptionList.length > 0
                    ? searchOptionList
                    : <div styleName='control-search-optionList-empty'>Empty List</div>
                  }
                </div>
              }
            </div>
            {this.state.search > 0 &&
              <button styleName='left-search-clearButton'
                onClick={(e) => this.handleSearchClearButton(e)}
              >
                <i className='fa fa-times' />
              </button>
            }

          </div>
          <button styleName='control-newPostButton'
            onClick={(e) => this.handleNewPostButtonClick(e)}>
            <i className='fa fa-plus' />
            <span styleName='control-newPostButton-tooltip'>
              Make a Note {OSX ? '⌘' : '^'} + n
            </span>
          </button>
        </div>
      </div>
    )
  }
}

TopBar.contextTypes = {
  router: PropTypes.shape({
    push: PropTypes.func
  })
}

TopBar.propTypes = {
  dispatch: PropTypes.func,
  config: PropTypes.shape({
    isSideNavFolded: PropTypes.bool
  })
}

export default CSSModules(TopBar, styles)
