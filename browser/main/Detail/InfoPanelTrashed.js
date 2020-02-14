import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './InfoPanel.styl'
import i18n from 'browser/lib/i18n'

const InfoPanelTrashed = ({
  storageName,
  folderName,
  updatedAt,
  createdAt,
  exportAsMd,
  exportAsTxt,
  exportAsHtml,
  exportAsPdf
}) => (
  <div
    className='infoPanel'
    styleName='control-infoButton-panel-trash'
    style={{ display: 'none' }}
  >
    <div>
      <p styleName='modification-date'>{updatedAt}</p>
      <p styleName='modification-date-desc'>{i18n.__('MODIFICATION DATE')}</p>
    </div>

    <hr />

    <div>
      <p styleName='infoPanel-default'>{storageName}</p>
      <p styleName='infoPanel-sub'>{i18n.__('STORAGE')}</p>
    </div>

    <div>
      <p styleName='infoPanel-default'>
        <text styleName='infoPanel-trash'>Trash</text>
        {folderName}
      </p>
      <p styleName='infoPanel-sub'>{i18n.__('FOLDER')}</p>
    </div>

    <div>
      <p styleName='infoPanel-default'>{createdAt}</p>
      <p styleName='infoPanel-sub'>{i18n.__('CREATION DATE')}</p>
    </div>

    <div id='export-wrap'>
      <button
        styleName='export--enable'
        onClick={e => exportAsMd(e, 'export-md')}
      >
        <i className='fa fa-file-code-o' />
        <p>.md</p>
      </button>

      <button
        styleName='export--enable'
        onClick={e => exportAsTxt(e, 'export-txt')}
      >
        <i className='fa fa-file-text-o' />
        <p>.txt</p>
      </button>

      <button
        styleName='export--enable'
        onClick={e => exportAsHtml(e, 'export-html')}
      >
        <i className='fa fa-html5' />
        <p>.html</p>
      </button>

      <button
        styleName='export--enable'
        onClick={e => exportAsPdf(e, 'export-pdf')}
      >
        <i className='fa fa-file-pdf-o' />
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
  exportAsTxt: PropTypes.func.isRequired,
  exportAsHtml: PropTypes.func.isRequired,
  exportAsPdf: PropTypes.func.isRequired
}

export default CSSModules(InfoPanelTrashed, styles)
