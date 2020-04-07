import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './SwitchButton.styl'
import i18n from 'browser/lib/i18n'

const TagButton = ({ onClick, isTagActive }) => (
  <button
    styleName={isTagActive ? 'active-button' : 'non-active-button'}
    onClick={onClick}
  >
    <img
      src={
        isTagActive
          ? '../resources/icon/icon-tag-active.svg'
          : '../resources/icon/icon-tag.svg'
      }
    />
    <span styleName='tooltip'>{i18n.__('Tags')}</span>
  </button>
)

TagButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isTagActive: PropTypes.bool.isRequired
}

export default CSSModules(TagButton, styles)
