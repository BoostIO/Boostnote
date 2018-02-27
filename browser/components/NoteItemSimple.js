/**
 * @fileoverview Note item component with simple display mode.
 */
import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './NoteItemSimple.styl'

/**
 * @description Note item component when using simple display mode.
 * @param {boolean} isActive
 * @param {Object} note
 * @param {Function} handleNoteClick
 * @param {Function} handleNoteContextMenu
 * @param {Function} handleDragStart
 */
const NoteItemSimple = ({
  isActive,
  isAllNotesView,
  note,
  handleNoteClick,
  handleNoteContextMenu,
  handleDragStart,
  pathname,
  storage
}) => (
  <div styleName={isActive
    ? 'item-simple--active'
    : 'item-simple'
  }
    key={`${note.storage}-${note.key}`}
    onClick={e => handleNoteClick(e, `${note.storage}-${note.key}`)}
    onContextMenu={e => handleNoteContextMenu(e, `${note.storage}-${note.key}`)}
    onDragStart={e => handleDragStart(e, note)}
    draggable='true'
  >
    <div styleName='item-simple-title'>
      {note.type === 'SNIPPET_NOTE'
        ? <i styleName='item-simple-title-icon' className='fa fa-fw fa-code' />
        : <i styleName='item-simple-title-icon' className='fa fa-fw fa-file-text-o' />
      }
      {note.isPinned && !pathname.match(/\/starred|\/trash/)
        ? <i styleName='item-pin' className='fa fa-thumb-tack' />
        : ''
      }
      {note.title.trim().length > 0
        ? note.title
        : <span styleName='item-simple-title-empty'>Empty</span>
      }
      {isAllNotesView && <div styleName='item-simple-right'>
        <span styleName='item-simple-right-storageName'>
          {storage.name}
        </span>
      </div>}
    </div>
  </div>
)

NoteItemSimple.propTypes = {
  isActive: PropTypes.bool.isRequired,
  note: PropTypes.shape({
    storage: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isrequired
  }),
  handleNoteClick: PropTypes.func.isRequired,
  handleNoteContextMenu: PropTypes.func.isRequired,
  handleDragStart: PropTypes.func.isRequired
}

export default CSSModules(NoteItemSimple, styles)
