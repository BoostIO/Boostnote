import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './InfoPanel.styl'

const InfoPanel = ({
  storageName, folderName, noteLink, updatedAt, createdAt, exportAsMd, exportAsTxt, wordCount, letterCount, type, print
}) => (
  <div className='infoPanel' styleName='control-infoButton-panel' style={{display: 'none'}}>
    <div>
      <p styleName='modification-date'>{updatedAt}</p>
      <p styleName='modification-date-desc'>MODIFICATION DATE</p>
    </div>

    <hr />

    {type === 'SNIPPET_NOTE'
      ? ''
      : <div styleName='count-wrap'>
        <div styleName='count-number'>
          <p styleName='infoPanel-defaul-count'>{wordCount}</p>
          <p styleName='infoPanel-sub-count'>Words</p>
        </div>
        <div styleName='count-number'>
          <p styleName='infoPanel-defaul-count'>{letterCount}</p>
          <p styleName='infoPanel-sub-count'>Letters</p>
        </div>
      </div>
    }

    {type === 'SNIPPET_NOTE'
      ? ''
      : <hr />
    }

    <div>
      <p styleName='infoPanel-default'>{storageName}</p>
      <p styleName='infoPanel-sub'>STORAGE</p>
    </div>

    <div>
      <p styleName='infoPanel-default'>{folderName}</p>
      <p styleName='infoPanel-sub'>FOLDER</p>
    </div>

    <div>
      <p styleName='infoPanel-default'>{createdAt}</p>
      <p styleName='infoPanel-sub'>CREATION DATE</p>
    </div>

    <div>
      <input styleName='infoPanel-noteLink' value={noteLink} onClick={(e) => { e.target.select() }} />
      <p styleName='infoPanel-sub'>NOTE LINK</p>
    </div>

    <hr />

    <div id='export-wrap'>
      <button styleName='export--enable' onClick={(e) => exportAsMd(e)}>
        <i className='fa fa-file-code-o fa-fw' />
        <p>.md</p>
      </button>

      <button styleName='export--enable' onClick={(e) => exportAsTxt(e)}>
        <i className='fa fa-file-text-o fa-fw' />
        <p>.txt</p>
      </button>

      <button styleName='export--enable' onClick={(e) => print(e)}>
        <i className='fa fa-print fa-fw' />
        <p>Print</p>
      </button>
    </div>
  </div>
)

InfoPanel.propTypes = {
  storageName: PropTypes.string.isRequired,
  folderName: PropTypes.string.isRequired,
  noteLink: PropTypes.string.isRequired,
  updatedAt: PropTypes.string.isRequired,
  createdAt: PropTypes.string.isRequired,
  exportAsMd: PropTypes.func.isRequired,
  exportAsTxt: PropTypes.func.isRequired,
  wordCount: PropTypes.number,
  letterCount: PropTypes.number,
  type: PropTypes.string.isRequired,
  print: PropTypes.func.isRequired
}

export default CSSModules(InfoPanel, styles)
