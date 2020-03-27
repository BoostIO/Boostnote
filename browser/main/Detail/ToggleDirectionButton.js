import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ToggleDirectionButton.styl'
import i18n from 'browser/lib/i18n'

const ToggleDirectionButton = ({ onClick, isRTL }) => (
  <div styleName='control-toggleModeButton'>
    <div styleName={isRTL ? 'active' : undefined} onClick={() => onClick()}>
      <img src={!isRTL ? '../resources/icon/icon-left-to-right.svg' : ''} />
    </div>
    <div styleName={!isRTL ? 'active' : undefined} onClick={() => onClick()}>
      <img src={!isRTL ? '' : '../resources/icon/icon-right-to-left.svg'} />
    </div>
    <span lang={i18n.locale} styleName='tooltip'>
      {i18n.__('Toggle Direction')}
    </span>
  </div>
)

ToggleDirectionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isRTL: PropTypes.bool.isRequired
}

export default CSSModules(ToggleDirectionButton, styles)
