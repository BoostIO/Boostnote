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
            <button onClick={this.props.onStarred}>
              <img src='../resources/icon/icon-starred.svg' />
              <span styleName='tooltip'>{i18n.__('Star')}</span>
            </button>
            <button onClick={this.props.onUnStarred}>
              <img src='../resources/icon/icon-star.svg' />
              <span styleName='tooltip'>{i18n.__('Un-star')}</span>
            </button>
          </div>
          <div styleName='button-box'>
            <button onClick={this.props.onPined}>
              <i className='fa fa-thumb-tack' />
              <span styleName='tooltip'>{i18n.__('Pin')}</span>
            </button>
            <button onClick={this.props.onUnPined}>
              Un-pin
              <span styleName='tooltip'>{i18n.__('Un-pin')}</span>
            </button>
          </div>
        </div>
        <div styleName='row'>
          <div styleName='button-box'>
            <button onClick={this.props.onTrashed}>
              <img src='../resources/icon/icon-trash.svg' />
              <span styleName='tooltip'>{i18n.__('Trash')}</span>
            </button>
            <button onClick={this.props.onDeleted}>
              <img src='../resources/icon/icon-permanent-delete.svg' />
              <span styleName='tooltip'>{i18n.__('Permanently Delete')}</span>
            </button>
          </div>
          <div styleName='button-box'>
            <button>
              <img src='../resources/icon/icon-external.svg' />
              <span styleName='tooltip'>{i18n.__('Export')}</span>
            </button>
            <button>
              Publish
              <span styleName='tooltip'>{i18n.__('Publish')}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default CSSModules(MultipleSelectionDialog, styles)
