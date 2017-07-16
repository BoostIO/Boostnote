/**
 * @fileoverview Note item component with simple display mode.
 */
import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './NoteItemSimple.styl'

/**
 * @description Note item component when using simple display mode.
 * @param {boolean} isActive
 * @param {boolean} isFocused
 * @param {Object} note
 * @param {Function} handleNoteClick
 * @param {Function} handleDragStart
 */
class NoteItemSimple extends React.Component {
  componentDidMount () {
    // Need to set tabIndex or focus will not work on a <div>
    this.rootEl.tabIndex = '-1'
  }

  componentDidUpdate () {
    if (this.props.isFocused) {
      this.rootEl.focus()
    }
  }

  render () {
    const {
      isActive,
      isFocused,
      note,
      handleNoteClick,
      handleNoteContextMenu,
      handleKeyDown,
      handleDragStart
    } = this.props

    const styleName = isFocused
      ? 'item-simple--active-focused'
      : isActive ? 'item-simple--active' : 'item-simple'

    return (
      <div styleName={styleName}
        key={`${note.storage}-${note.key}`}
        onClick={e => handleNoteClick(e, `${note.storage}-${note.key}`)}
        onContextMenu={e => handleNoteContextMenu(e, `${note.storage}-${note.key}`)}
        onKeyDown={handleKeyDown}
        ref={rootEl => { this.rootEl = rootEl }}
        onDragStart={e => handleDragStart(e, note)}
        draggable='true'
      >
        <div styleName='item-simple-title'>
          {note.type === 'SNIPPET_NOTE'
            ? <i styleName='item-simple-title-icon' className='fa fa-fw fa-code' />
            : <i styleName='item-simple-title-icon' className='fa fa-fw fa-file-text-o' />
          }
          {note.title.trim().length > 0
            ? note.title
            : <span styleName='item-simple-title-empty'>Empty</span>
          }
        </div>
      </div>
    )
  }
}

NoteItemSimple.propTypes = {
  isActive: PropTypes.bool.isRequired,
  isFocused: PropTypes.bool,
  note: PropTypes.shape({
    storage: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isrequired
  }),
  handleNoteClick: PropTypes.func.isRequired,
  handleNoteContextMenu: PropTypes.func.isRequired,
  handleKeyDown: PropTypes.func.isRequired,
  handleDragStart: PropTypes.func.isRequired
}

export default CSSModules(NoteItemSimple, styles)
