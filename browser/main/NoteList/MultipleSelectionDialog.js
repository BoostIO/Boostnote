import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './MultipleSelectionDialog.styl'
import i18n from 'browser/lib/i18n'
/**
 * Dialog shown when multiple notes are selected
 */
class MultipleSelectionDialog extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      nSelectedNotes: 7,
      isVisible: true // change to false
    }
  }
  render() {
    return (
      <div
        className='multipleSelectionDialog'
        styleName='multipleSelectionDialog'
        style={{
          display: this.state.isVisible ? 'block' : 'none'
        }}
      >
        <div className='row'>{`${this.state.nSelectedNotes} ${i18n.__(
          'notes selected'
        )}`}</div>
        <div styleName='row'>
          <div styleName='button-box'>
            <button>
              <img src='../resources/icon/icon-starred.svg' />
            </button>
            <button>
              <img src='../resources/icon/icon-star.svg' />
            </button>
          </div>
          <div styleName='button-box'>
            <button>
              <i className='fa fa-thumb-tack' />
            </button>
            <button>Un-pin</button>
          </div>
        </div>
        <div styleName='row'>
          <div styleName='button-box'>
            <button>
              <img src='../resources/icon/icon-trash.svg' />
            </button>
            <button>Permanent Delete</button>
          </div>
          <div styleName='button-box'>
            <button>
              <img src='../resources/icon/icon-external.svg' />
            </button>
            <button>Publish</button>
          </div>
        </div>
      </div>
    )
  }
}

export default CSSModules(MultipleSelectionDialog, styles)
