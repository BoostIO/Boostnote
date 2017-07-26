import React, { PropTypes } from 'react'
import { hashHistory } from 'react-router'
import CSSModules from 'browser/lib/CSSModules'
import { range } from 'lodash'
import styles from './SideNav.styl'
import { openModal } from 'browser/main/lib/modal'
import PreferencesModal from '../modals/PreferencesModal'
import ConfigManager from 'browser/main/lib/ConfigManager'
import StorageItem from './StorageItem'
import SideNavFilter from 'browser/components/SideNavFilter'
import { focusSideNav, unfocusSideNav, focusNoteList } from 'browser/ducks/focus'
import { basePaths, parsePathname } from 'browser/lib/utils/paths'
import movementHandlersInit from './movementHandlers'
import findStorage from 'browser/lib/utils/findStorage'

const movementHandlers = movementHandlersInit()

/**
 * A movementHandlers function will give back a path to go to or an error.
 * handlePathOrError is used to keep the handling of these 2 cases DRY.
 * @type {Object}
 */
const handlePathOrError = {
  Ok ({ value }) {
    hashHistory.push(value)
  },
  Error ({ value }) {
    const error = value
    console.log(error.message)
  }
}

class SideNav extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      closedStorageIndices: new Set()
    }

    this.handleMenuButtonClick = this.handleMenuButtonClick.bind(this)
    this.handleToggleButtonClick = this.handleToggleButtonClick.bind(this)
    this.handleHomeButtonClick = this.handleHomeButtonClick.bind(this)
    this.handleStarredButtonClick = this.handleStarredButtonClick.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.toggleStorageOpenness = this.toggleStorageOpenness.bind(this)
    this.closeAllStorages = this.closeAllStorages.bind(this)
    this.openAllStorages = this.openAllStorages.bind(this)
  }

  // TODO: should not use electron stuff v0.7
  handleMenuButtonClick (e) {
    openModal(PreferencesModal)
  }

  handleHomeButtonClick (e) {
    hashHistory.push(basePaths.home)
  }

  handleStarredButtonClick (e) {
    hashHistory.push(basePaths.starred)
  }

  handleToggleButtonClick (e) {
    const { dispatch, config } = this.props

    ConfigManager.set({isSideNavFolded: !config.isSideNavFolded})
    dispatch({
      type: 'SET_IS_SIDENAV_FOLDED',
      isFolded: !config.isSideNavFolded
    })
  }

  toggleStorageOpenness (storageIndex) {
    const closedStorageIndices = this.state.closedStorageIndices
    if (closedStorageIndices.has(storageIndex)) {
      closedStorageIndices.delete(storageIndex)
    } else {
      closedStorageIndices.add(storageIndex)
    }

    this.setState({
      closedStorageIndices: new Set(closedStorageIndices)
    })
  }

  closeAllStorages () {
    const { data } = this.props
    const closedIndices = range(0, data.storageMap.size)
    this.setState({ closedStorageIndices: new Set(closedIndices) })
  }

  openAllStorages () {
    this.setState({ closedStorageIndices: new Set() })
  }

  closeStorage () {
    const pathname = this.props.location.pathname
    parsePathname(pathname).map(({
      isStoragePathname,
      isFolderPathname,
      storageKey
    }) => {
      if (isStoragePathname || isFolderPathname) {
        // If you're on a storage or folder, close the storage if it's open.
        findStorage(this, storageKey).map(([, { index, isClosed }]) => {
          if (!isClosed) this.toggleStorageOpenness(index)
        })
      }
      if (isFolderPathname) {
        // Specifically, if you're on a folder, go to the parent storage.
        hashHistory.push(basePaths.storages + storageKey)
      }
    })
  }

  openStorage () {
    const pathname = this.props.location.pathname
    parsePathname(pathname).map(({
      isStoragePathname,
      isFolderPathname,
      storageKey
    }) => {
      if (isStoragePathname || isFolderPathname) {
        findStorage(this, storageKey).map(([, { index, isClosed }]) => {
          if (isClosed) this.toggleStorageOpenness(index)
        })
      }
    })
  }

  handleKeyDown (e) {
    e.preventDefault()
    if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
      movementHandlers.up(this).matchWith(handlePathOrError)
    } else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
      movementHandlers.down(this).matchWith(handlePathOrError)
    } else if (e.shiftKey && e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'A')) {
      // CLOSE_ALL_STORAGES
      // NOTE: this condition is MORE specific than CLOSE_STORAGE so it must
      // come before it in this chain of if / else expressions.
      this.closeAllStorages()
      movementHandlers.currentStorage(this).matchWith(handlePathOrError)
    } else if (e.shiftKey && e.ctrlKey && (e.key === 'ArrowRight' || e.key === 'E')) {
      // OPEN_ALL_STORAGES
      // NOTE: this condition is MORE specific than OPEN_STORAGE so it must
      // come before it in this chain of if / else expressions.
      this.openAllStorages()
    } else if ((e.shiftKey && e.key === 'ArrowLeft') || (e.ctrlKey && e.key === 'a')) {
      // CLOSE_STORAGE
      this.closeStorage()
    } else if ((e.shiftKey && e.key === 'ArrowRight') || (e.ctrlKey && e.key === 'e')) {
      // OPEN_STORAGE
      this.openStorage()
    } else if (e.key === 'ArrowRight' || (e.ctrlKey && e.key === 'f')) {
      this.props.dispatch(unfocusSideNav())
      this.props.dispatch(focusNoteList())
    }
  }

  handleFocus () {
    this.props.dispatch(focusSideNav())
  }

  handleBlur () {
    this.props.dispatch(unfocusSideNav())
  }

  handleTrashedButtonClick (e) {
    const { router } = this.context
    router.push('/trashed')
  }

  render () {
    const { data, location, config, focus, dispatch } = this.props

    const isFolded = config.isSideNavFolded
    const isHomeActive = !!location.pathname.match('^' + basePaths.home + '$')
    const isStarredActive = !!location.pathname.match('^' + basePaths.starred + '$')
    const isTrashedActive = !!location.pathname.match('^' + basePaths.trashed + '$')

    const storageList = Array.from(data.storageMap).map(([key, storage], index) => {
      return <StorageItem
        key={storage.key}
        index={index}
        handleKeyDown={this.handleKeyDown}
        toggleStorageOpenness={this.toggleStorageOpenness}
        focus={focus}
        storage={storage}
        data={data}
        location={location}
        isOpen={!this.state.closedStorageIndices.has(index)}
        isFolded={isFolded}
        dispatch={dispatch}
      />
    })

    const style = {}
    if (!isFolded) style.width = this.props.width
    return (
      <div className='SideNav'
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        styleName={isFolded ? 'root--folded' : 'root'}
        tabIndex='1'
        style={style}
      >
        <div styleName='top'>
          <button styleName='top-menu'
            onClick={this.handleMenuButtonClick}
          >
            <i className='fa fa-wrench fa-fw' />
            <span styleName='top-menu-label'>Preferences</span>
          </button>
        </div>

        <SideNavFilter
          isFolded={isFolded}
          isHomeActive={isHomeActive}
          isStarredActive={isStarredActive}
          isTrashedActive={isTrashedActive}
          handleAllNotesButtonClick={this.handleHomeButtonClick}
          handleStarredButtonClick={this.handleStarredButtonClick}
          handleTrashedButtonClick={this.handleTrashedButtonClick}
          handleKeyDown={this.handleKeyDown}
          focus={focus}
        />

        <div styleName='storageList'>
          {storageList.length > 0 ? storageList : (
            <div styleName='storageList-empty'>No storage mount.</div>
          )}
        </div>
        <button styleName='navToggle'
          onClick={this.handleToggleButtonClick}
        >
          {isFolded
            ? <i className='fa fa-angle-double-right' />
            : <i className='fa fa-angle-double-left' />
          }
        </button>
      </div>
    )
  }
}

SideNav.contextTypes = {
  router: PropTypes.shape({})
}

SideNav.propTypes = {
  dispatch: PropTypes.func,
  storages: PropTypes.array,
  config: PropTypes.shape({
    isSideNavFolded: PropTypes.bool
  }),
  focus: PropTypes.object,
  location: PropTypes.shape({
    pathname: PropTypes.string
  })
}

export default CSSModules(SideNav, styles)
