import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './MultipleSelectionDialog.styl'
import i18n from 'browser/lib/i18n'
/**
 * Dialog shown when multiple notes are selected
 */
class MultipleSelectionDialog extends React.Component {
  // constructor(props) {
  //   super(props)
  // }
  render() {
    return (
      <div
        className='multipleSelectionDialog'
        styleName='multipleSelectionDialog'
        style={{
          display: this.props.nSelectedNotes > 1 ? 'block' : 'none'
        }}
      >
        <h3>{`${this.props.nSelectedNotes} ${i18n.__('notes selected')}`}</h3>
        <div styleName='row'>
          <div styleName='button-box'>
            <button onClick={this.props.onStar}>
              <img src='../resources/icon/icon-starred.svg' />
              <span styleName='tooltip'>{i18n.__('Star')}</span>
            </button>
            <button onClick={this.props.onUnStar}>
              <img src='../resources/icon/icon-star.svg' />
              <span styleName='tooltip'>{i18n.__('Un-star')}</span>
            </button>
          </div>
          <div styleName='button-box'>
            <button onClick={this.props.onPin}>
              <img src='../resources/icon/icon-pin.svg' />
              <span styleName='tooltip'>{i18n.__('Pin')}</span>
            </button>
            <button onClick={this.props.onUnPin}>
              <img src='../resources/icon/icon-unpin.svg' />
              <span styleName='tooltip'>{i18n.__('Un-pin')}</span>
            </button>
          </div>
        </div>
        <div styleName='row'>
          <div styleName='button-box'>
            <button onClick={this.props.onTrash}>
              <img src='../resources/icon/icon-trash.svg' />
              <span styleName='tooltip'>{i18n.__('Trash')}</span>
            </button>
            <button onClick={this.props.onDelete}>
              <img src='../resources/icon/icon-permanent-delete.svg' />
              <span styleName='tooltip'>{i18n.__('Permanently Delete')}</span>
            </button>
          </div>
          <div styleName='button-box'>
            <button>
              <i className='fa fa-file-code-o' />
              <span styleName='tooltip'>{i18n.__('Export as .md')}</span>
            </button>
            <button>
              <i className='fa fa-file-text-o' />
              <span styleName='tooltip'>{i18n.__('Export as .txt')}</span>
            </button>
            <button>
              <i className='fa fa-html5' />
              <span styleName='tooltip'>{i18n.__('Export as .html')}</span>
            </button>
            <button>
              <i className='fa fa-file-pdf-o' />
              <span styleName='tooltip'>{i18n.__('Export as .pdf')}</span>
            </button>
          </div>
          <div styleName='button-box'>
            <button>
              <img src='../resources/icon/icon-external.svg' />
              <span styleName='tooltip'>{i18n.__('Publish')}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default CSSModules(MultipleSelectionDialog, styles)
