import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './TrashButton.styl'
import i18n from 'browser/lib/i18n'

const TrashButton = ({ onClick }) => (
  <button styleName='control-trashButton' onClick={e => onClick(e)}>
    <img src='../resources/icon/icon-trash.svg' />
    <span lang={i18n.locale} styleName='tooltip'>
      {i18n.__('Trash')}
    </span>
  </button>
)

TrashButton.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default CSSModules(TrashButton, styles)
