import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './TrashButton.styl'
import i18n from 'browser/lib/i18n'

const PermanentDeleteButton = ({ onClick }) => (
  <button styleName='control-trashButton--in-trash' onClick={e => onClick(e)}>
    <img src='../resources/icon/icon-trash.svg' />
    <span styleName='tooltip'>{i18n.__('Permanent Delete')}</span>
  </button>
)

PermanentDeleteButton.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default CSSModules(PermanentDeleteButton, styles)
