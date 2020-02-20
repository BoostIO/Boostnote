import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './SwitchButton.styl'
import i18n from 'browser/lib/i18n'

const ListButton = ({ onClick, isTagActive }) => (
  <button
    styleName={isTagActive ? 'non-active-button' : 'active-button'}
    onClick={onClick}
  >
    <img
      src={
        isTagActive
          ? '../resources/icon/icon-list.svg'
          : '../resources/icon/icon-list-active.svg'
      }
    />
    <span styleName='tooltip'>{i18n.__('Notes')}</span>
  </button>
)

ListButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isTagActive: PropTypes.bool.isRequired
}

export default CSSModules(ListButton, styles)
