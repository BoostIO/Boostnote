/**
 * @fileoverview Filter for all notes.
 */
import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './SideNavFilter.styl'

/**
 * @param {boolean} isFolded
 * @param {boolean} isHomeActive
 * @param {Function} handleAllNotesButtonClick
 * @param {boolean} isStarredActive
 * @param {Function} handleStarredButtonClick
 * @return {React.Component}
 */
class SideNavFilter extends React.Component {
  componentDidUpdate () {
    const { isHomeActive, isStarredActive, sideNavIsFocused } = this.props

    if (sideNavIsFocused) {
      if (isHomeActive) return this.homeButton.focus()
      if (isStarredActive) return this.starredButton.focus()
    }
  }

  render () {
    const {
      sideNavIsFocused,
      isFolded,
      isHomeActive,
      handleAllNotesButtonClick,
      isStarredActive,
      handleStarredButtonClick,
      handleKeyDown,
      isTrashedActive,
      handleTrashedButtonClick
    } = this.props

    const homeStyleName = isHomeActive && sideNavIsFocused
      ? 'menu-button--active-focused'
      : isHomeActive ? 'menu-button--active' : 'menu-button'
    const starredStyleName = isStarredActive && sideNavIsFocused
      ? 'menu-button-star--active-focused'
      : isStarredActive ? 'menu-button-star--active' : 'menu-button'

    return (
      <div styleName={isFolded ? 'menu--folded' : 'menu'}>
        <button styleName={homeStyleName}
          onClick={handleAllNotesButtonClick}
          ref={button => { this.homeButton = button }}
          onKeyDown={handleKeyDown}
          >
          <i className='fa fa-archive fa-fw' />
          <span styleName='menu-button-label'>All Notes</span>
        </button>
        <button styleName={starredStyleName}
          onClick={handleStarredButtonClick}
          ref={button => { this.starredButton = button }}
          onKeyDown={handleKeyDown}
          >
          <i className='fa fa-star fa-fw' />
          <span styleName='menu-button-label'>Starred</span>
        </button>
        <button styleName={isTrashedActive ? 'menu-button--active' : 'menu-button'}
          onClick={handleTrashedButtonClick}
        >
          <i className='fa fa-trash fa-fw' />
          <span styleName='menu-button-label'>Trashed</span>
        </button>
      </div>
    )
  }
}

SideNavFilter.propTypes = {
  sideNavIsFocused: PropTypes.bool,
  isFolded: PropTypes.bool,
  isHomeActive: PropTypes.bool.isRequired,
  handleAllNotesButtonClick: PropTypes.func.isRequired,
  isStarredActive: PropTypes.bool.isRequired,
  isTrashedActive: PropTypes.bool.isRequired,
  handleStarredButtonClick: PropTypes.func.isRequired,
  handleTrashdButtonClick: PropTypes.func.isRequired
}

export default CSSModules(SideNavFilter, styles)
