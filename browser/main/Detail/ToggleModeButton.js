import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ToggleModeButton.styl'
import i18n from 'browser/lib/i18n'

const ToggleModeButton = ({ onClick, editorType }) => (
  <div styleName='control-toggleModeButton'>
    <div
      styleName={editorType === 'SPLIT' ? 'active' : undefined}
      onClick={() => onClick('SPLIT')}
    >
      <img
        src={
          editorType === 'EDITOR_PREVIEW'
            ? '../resources/icon/icon-mode-markdown-off-active.svg'
            : ''
        }
      />
    </div>
    <div
      styleName={editorType === 'EDITOR_PREVIEW' ? 'active' : undefined}
      onClick={() => onClick('EDITOR_PREVIEW')}
    >
      <img
        src={
          editorType === 'EDITOR_PREVIEW'
            ? ''
            : '../resources/icon/icon-mode-split-on-active.svg'
        }
      />
    </div>
    <span lang={i18n.locale} styleName='tooltip'>
      {i18n.__('Toggle Mode')}
    </span>
  </div>
)

ToggleModeButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  editorType: PropTypes.string.isRequired
}

export default CSSModules(ToggleModeButton, styles)
