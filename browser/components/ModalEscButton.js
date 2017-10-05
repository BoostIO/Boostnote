import React, {PropTypes} from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ModalEscButton.styl'

const ModalEscButton = ({
  handleEscButtonClick
}) => (
  <button styleName='escButton' onClick={handleEscButtonClick}>
    <div styleName='esc-mark'>×</div>
    <div styleName='esc-text'>esc</div>
  </button>
)

ModalEscButton.propTypes = {
  handleEscButtonClick: PropTypes.func.isRequired
}

export default CSSModules(ModalEscButton, styles)
