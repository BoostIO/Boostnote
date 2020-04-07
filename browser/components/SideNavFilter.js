/**
 * @fileoverview Filter for all notes.
 */
import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './SideNavFilter.styl'
import i18n from 'browser/lib/i18n'

/**
 * @param {boolean} isFolded
 * @param {boolean} isHomeActive
 * @param {Function} handleAllNotesButtonClick
 * @param {boolean} isStarredActive
 * @param {Function} handleStarredButtonClick
 * @return {React.Component}
 */
const SideNavFilter = ({
  isFolded,
  isHomeActive,
  handleAllNotesButtonClick,
  isStarredActive,
  handleStarredButtonClick,
  isTrashedActive,
  handleTrashedButtonClick,
  counterDelNote,
  counterTotalNote,
  counterStarredNote,
  handleFilterButtonContextMenu
}) => (
  <div styleName={isFolded ? 'menu--folded' : 'menu'}>
    <button
      styleName={isHomeActive ? 'menu-button--active' : 'menu-button'}
      onClick={handleAllNotesButtonClick}
    >
      <div styleName='iconWrap'>
        <img
          src={
            isHomeActive
              ? '../resources/icon/icon-all-active.svg'
              : '../resources/icon/icon-all.svg'
          }
        />
      </div>
      <span styleName='menu-button-label'>{i18n.__('All Notes')}</span>
      <span styleName='counters'>{counterTotalNote}</span>
    </button>

    <button
      styleName={isStarredActive ? 'menu-button-star--active' : 'menu-button'}
      onClick={handleStarredButtonClick}
    >
      <div styleName='iconWrap'>
        <img
          src={
            isStarredActive
              ? '../resources/icon/icon-star-active.svg'
              : '../resources/icon/icon-star-sidenav.svg'
          }
        />
      </div>
      <span styleName='menu-button-label'>{i18n.__('Starred')}</span>
      <span styleName='counters'>{counterStarredNote}</span>
    </button>

    <button
      styleName={isTrashedActive ? 'menu-button-trash--active' : 'menu-button'}
      onClick={handleTrashedButtonClick}
      onContextMenu={handleFilterButtonContextMenu}
    >
      <div styleName='iconWrap'>
        <img
          src={
            isTrashedActive
              ? '../resources/icon/icon-trash-active.svg'
              : '../resources/icon/icon-trash-sidenav.svg'
          }
        />
      </div>
      <span styleName='menu-button-label'>{i18n.__('Trash')}</span>
      <span styleName='counters'>{counterDelNote}</span>
    </button>
  </div>
)

SideNavFilter.propTypes = {
  isFolded: PropTypes.bool,
  isHomeActive: PropTypes.bool.isRequired,
  handleAllNotesButtonClick: PropTypes.func.isRequired,
  isStarredActive: PropTypes.bool.isRequired,
  isTrashedActive: PropTypes.bool.isRequired,
  handleStarredButtonClick: PropTypes.func.isRequired,
  handleTrashedButtonClick: PropTypes.func.isRequired
}

export default CSSModules(SideNavFilter, styles)
