import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './SideNav.styl'
import { openModal } from 'browser/main/lib/modal'
import PreferencesModal from '../modals/PreferencesModal'
import ConfigManager from 'browser/main/lib/ConfigManager'
import StorageItem from './StorageItem'
import SideNavFilter from 'browser/components/SideNavFilter'

class SideNav extends React.Component {
  // TODO: should not use electron stuff v0.7
  handleMenuButtonClick (e) {
    openModal(PreferencesModal)
  }

  handleHomeButtonClick (e) {
    let { router } = this.context
    router.push('/home')
  }

  handleStarredButtonClick (e) {
    let { router } = this.context
    router.push('/starred')
  }

  handleToggleButtonClick (e) {
    let { dispatch, config } = this.props

    ConfigManager.set({isSideNavFolded: !config.isSideNavFolded})
    dispatch({
      type: 'SET_IS_SIDENAV_FOLDED',
      isFolded: !config.isSideNavFolded
    })
  }

  handleTrashedButtonClick (e) {
    let { router } = this.context
    router.push('/trashed')
  }

  handleSwitchFolderButtonClick (e) {
    console.log('SwitchfolderButton Clicked')
    let { router } = this.context
    router.push('/home')
  }

  handleSwitchTagButtonClick (e) {
    console.log('SwitchTagButton clicked')
    let { router } = this.context
    router.push('/tag')
  }

  render () {
    let { data, location, config, dispatch } = this.props

    let isFolded = config.isSideNavFolded
    let isHomeActive = !!location.pathname.match(/^\/home$/)
    let isStarredActive = !!location.pathname.match(/^\/starred$/)
    let isTrashedActive = !!location.pathname.match(/^\/trashed$/)

    let storageList = data.storageMap.map((storage, key) => {
      return <StorageItem
        key={storage.key}
        storage={storage}
        data={data}
        location={location}
        isFolded={isFolded}
        dispatch={dispatch}
      />
    })
    let style = {}
    if (!isFolded) style.width = this.props.width
    return (
      <div className='SideNav'
        styleName={isFolded ? 'root--folded' : 'root'}
        tabIndex='1'
        style={style}
      >
        <div styleName='SwitchModeButtons'>
          <button onClick={(e) => this.handleSwitchFolderButtonClick(e)}>Folder</button>
          <button onClick={(e) => this.handleSwitchTagButtonClick(e)}>Tag</button>
        </div>
        <div styleName='top'>
          <button styleName='top-menu'
            onClick={(e) => this.handleMenuButtonClick(e)}
          >
            <i className='fa fa-wrench fa-fw' />
            <span styleName='top-menu-label'>Preferences</span>
          </button>
        </div>

        <SideNavFilter
          isFolded={isFolded}
          isHomeActive={isHomeActive}
          handleAllNotesButtonClick={(e) => this.handleHomeButtonClick(e)}
          isStarredActive={isStarredActive}
          isTrashedActive={isTrashedActive}
          handleStarredButtonClick={(e) => this.handleStarredButtonClick(e)}
          handleTrashedButtonClick={(e) => this.handleTrashedButtonClick(e)}
        />

        <div styleName='storageList'>
          {storageList.length > 0 ? storageList : (
            <div styleName='storageList-empty'>No storage mount.</div>
          )}
        </div>
        <button styleName='navToggle'
          onClick={(e) => this.handleToggleButtonClick(e)}
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
  location: PropTypes.shape({
    pathname: PropTypes.string
  })
}

export default CSSModules(SideNav, styles)
