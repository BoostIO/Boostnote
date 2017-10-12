import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ShareButton.styl'

const ShareButton = ({
  onClick
}) => (
  <button styleName='control-shareButton'
    onClick={onClick}
  >
    <i className='fa fa-share shareButton' styleName='share-button' />
  </button>
)

ShareButton.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default CSSModules(ShareButton, styles)
