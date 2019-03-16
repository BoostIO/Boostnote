import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './InfoButton.styl'
import i18n from 'browser/lib/i18n'

const GistButton = ({
    onClick,
    isGisted,
    gistId
}) => {
  return (
    <button styleName='control-infoButton'
      onClick={(e) => onClick(e)}
        >
      <img className='infoButton' src='../resources/icon/icon-gist.svg' />
      {isGisted ? 1 : 0}
      <span styleName='tooltip'>{isGisted ? i18n.__('Hide in All Notes') : gistId ? i18n.__('Show in All Notes') : i18n.__('Upload Gist and Show in All Notes')}</span>
    </button>
  )
}

GistButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isGisted: PropTypes.bool,
  gistId: PropTypes.bool
}

export default CSSModules(GistButton, styles)
