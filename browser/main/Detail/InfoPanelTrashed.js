import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './InfoPanel.styl'

const InfoPanelTrashed = ({
  storageName, folderName, updatedAt, createdAt, exportAsMd, exportAsTxt
}) => (
  <div className='infoPanel' styleName='control-infoButton-panel-trash' style={{display: 'none'}}>
    <div>
      <p styleName='modification-date'>{updatedAt}</p>
      <p styleName='modification-date-desc'>MODIFICATION DATE</p>
    </div>

    <hr />

    <div>
      <p styleName='infoPanel-default'>{storageName}</p>
      <p styleName='infoPanel-sub'>STORAGE</p>
    </div>

    <div>
      <p styleName='infoPanel-default'><text styleName='infoPanel-trash'>Trash</text>{folderName}</p>
      <p styleName='infoPanel-sub'>FOLDER</p>
    </div>

    <div>
      <p styleName='infoPanel-default'>{createdAt}</p>
      <p styleName='infoPanel-sub'>CREATION DATE</p>
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
