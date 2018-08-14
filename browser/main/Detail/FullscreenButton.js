import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './FullscreenButton.styl'
import i18n from 'browser/lib/i18n'

const OSX = global.process.platform === 'darwin'
const hotkey = (OSX ? i18n.__('Command(⌘)') : i18n.__('Ctrl(^)')) + '+B'
const FullscreenButton = ({
 onClick
}) => (
  <button styleName='control-fullScreenButton' title={i18n.__('Fullscreen')} onMouseDown={(e) => onClick(e)}>
    <img styleName='iconInfo' src='../resources/icon/icon-full.svg' />
    <span styleName='tooltip'>{i18n.__('Fullscreen')}({hotkey})</span>
  </button>
)

FullscreenButton.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default CSSModules(FullscreenButton, styles)
