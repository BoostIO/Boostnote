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

  render () {
    let { data, location, config, dispatch } = this.props

    let isFolded = config.isSideNavFolded
    let isHomeActive = !!location.pathname.match(/^\/home$/)
    let isStarredActive = !!location.pathname.match(/^\/starred$/)

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
        <div styleName='top'>
          <button styleName='top-menu'
            onClick={(e) => this.handleMenuButtonClick(e)}
          >
            <i className='fa fa-navicon fa-fw' />
            <span styleName='top-menu-label'>菜单</span>
          </button>
        </div>

        <SideNavFilter
          isFolded={isFolded}
          isHomeActive={isHomeActive}
          handleAllNotesButtonClick={(e) => this.handleHomeButtonClick(e)}
          isStarredActive={isStarredActive}
          handleStarredButtonClick={(e) => this.handleStarredButtonClick(e)}
        />

        <div styleName='storageList'>
          {storageList.length > 0 ? storageList : (
            <div styleName='storageList-empty'>文件夹为空</div>
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
