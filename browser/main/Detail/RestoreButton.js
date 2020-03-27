import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './RestoreButton.styl'
import i18n from 'browser/lib/i18n'

const RestoreButton = ({ onClick }) => (
  <button styleName='control-restoreButton' onClick={onClick}>
    <i className='fa fa-undo fa-fw' styleName='iconRestore' />
    <span styleName='tooltip'>{i18n.__('Restore')}</span>
  </button>
)

RestoreButton.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default CSSModules(RestoreButton, styles)
