import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './PreferenceButton.styl'
import i18n from 'browser/lib/i18n'

const PreferenceButton = ({ onClick }) => (
  <button styleName='top-menu-preference' onClick={e => onClick(e)}>
    <img src='../resources/icon/icon-setting.svg' />
    <span styleName='tooltip'>{i18n.__('Preferences')}</span>
  </button>
)

PreferenceButton.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default CSSModules(PreferenceButton, styles)
