import React, { PropTypes } from 'react'
import { hashHistory } from 'react-router'
import CSSModules from 'browser/lib/CSSModules'
import styles from './SideNav.styl'
import { openModal } from 'browser/main/lib/modal'
import PreferencesModal from '../modals/PreferencesModal'
import ConfigManager from 'browser/main/lib/ConfigManager'
import StorageItem from './StorageItem'
import SideNavFilter from 'browser/components/SideNavFilter'
import { focusSideNav, unfocusSideNav } from 'browser/ducks/focus'
import { basePaths } from 'browser/lib/utils/paths'
import movementHandlersInit from './movementHandlers'

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

  handleKeyDown (e) {
    e.preventDefault()
    if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
      movementHandlers.up(this).matchWith(handlePathOrError)
    } else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
      movementHandlers.down(this).matchWith(handlePathOrError)
    }
  }

  handleFocus () {
    this.props.dispatch(focusSideNav())
  }

  handleBlur () {
    this.props.dispatch(unfocusSideNav())
  }

  render () {
    const { data, location, config, focus } = this.props

    const isFolded = config.isSideNavFolded
    const isHomeActive = !!location.pathname.match('^' + basePaths.home + '$')
    const isStarredActive = !!location.pathname.match('^' + basePaths.starred + '$')

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
            <i className='fa fa-navicon fa-fw' />
            <span styleName='top-menu-label'>Menu</span>
          </button>
        </div>

        <SideNavFilter
          isFolded={isFolded}
          isHomeActive={isHomeActive}
          handleAllNotesButtonClick={this.handleHomeButtonClick}
          isStarredActive={isStarredActive}
          handleStarredButtonClick={this.handleStarredButtonClick}
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
