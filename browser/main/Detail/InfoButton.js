import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './InfoButton.styl'
import i18n from 'browser/lib/i18n'

const InfoButton = ({ onClick }) => (
  <button styleName='control-infoButton' onClick={e => onClick(e)}>
    <img className='infoButton' src='../resources/icon/icon-info.svg' />
    <span styleName='tooltip'>{i18n.__('Info')}</span>
  </button>
)

InfoButton.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default CSSModules(InfoButton, styles)
