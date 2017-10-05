import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './InfoPanel.styl'

const InfoPanelTrashed = ({
  storageName, folderName, updatedAt, createdAt, exportAsMd, exportAsTxt
}) => (
  <div className='infoPanel' styleName='control-infoButton-panel-trash' style={{display: 'none'}}>
    <div styleName='group-section'>
      <div styleName='group-section-label'>
        Storage
      </div>
      <div styleName='group-section-control'>
        {storageName}
      </div>
    </div>
    <div styleName='group-section'>
      <div styleName='group-section-label'>
        Folder
      </div>
      <div styleName='group-section-control'>
        <text>Trash</text>{folderName}
      </div>
    </div>
    <div styleName='group-section'>
      <div styleName='group-section-label'>
        Created
      </div>
      <div styleName='group-section-control'>
        {createdAt}
      </div>
    </div>
    <div styleName='group-section'>
      <div styleName='group-section-label'>
        Updated
      </div>
      <div styleName='group-section-control'>
        {updatedAt}
      </div>
    </div>

    <div id='export-wrap'>
      <button styleName='export--enable' onClick={(e) => exportAsMd(e)}>
        <i className='fa fa-file-code-o fa-fw' />
        <p>.md</p>
      </button>

      <button styleName='export--enable' onClick={(e) => exportAsTxt(e)}>
        <i className='fa fa-file-text-o fa-fw' />
        <p>.txt</p>
      </button>

      <button styleName='export--unable'>
        <i className='fa fa-file-pdf-o fa-fw' />
        <p>.pdf</p>
      </button>
    </div>
  </div>
)

InfoPanelTrashed.propTypes = {
  storageName: PropTypes.string.isRequired,
  folderName: PropTypes.string.isRequired,
  updatedAt: PropTypes.string.isRequired,
  createdAt: PropTypes.string.isRequired,
  exportAsMd: PropTypes.func.isRequired,
  exportAsTxt: PropTypes.func.isRequired
}

export default CSSModules(InfoPanelTrashed, styles)
