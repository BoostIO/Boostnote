/**
 * @fileoverview Note item component.
 */
import React, { PropTypes } from 'react'
import { isArray } from 'lodash'
import CSSModules from 'browser/lib/CSSModules'
import styles from './NoteItem.styl'

/**
 * @description Tag element component.
 * @param {string} tagName
 * @return {React.Component}
 */
const TagElement = ({ tagName }) => (
  <span styleName='item-bottom-tagList-item' key={tagName}>
    #{tagName}
  </span>
)

/**
 * @description Tag element list component.
 * @param {Array|null} tags
 * @return {React.Component}
 */
const TagElementList = (tags) => {
  if (!isArray(tags)) {
    return []
  }

  const tagElements = tags.map(tag => (
    TagElement({tagName: tag})
  ))

  return tagElements
}

/**
 * @description Note item component when using normal display mode.
 * @param {boolean} isActive
 * @param {Object} note
 * @param {Function} handleNoteClick
 * @param {Function} handleNoteContextMenu
 * @param {string} dateDisplay
 */
const NoteItem = ({ isActive, note, dateDisplay, handleNoteClick, handleNoteContextMenu }) => (
  <div styleName={isActive
      ? 'item--active'
      : 'item'
    }
    key={`${note.storage}-${note.key}`}
    onClick={e => handleNoteClick(e, `${note.storage}-${note.key}`)}
    onContextMenu={e => handleNoteContextMenu(e, `${note.storage}-${note.key}`)}
  >
    <div styleName='item-wrapper'>
      {note.type === 'SNIPPET_NOTE'
        ? <i styleName='item-title-icon' className='fa fa-fw fa-code' />
        : <i styleName='item-title-icon' className='fa fa-fw fa-file-text-o' />
      }
      <div styleName='item-title'>
        {note.title.trim().length > 0
          ? note.title
          : <span styleName='item-title-empty'>Empty</span>
        }
      </div>

      <div styleName='item-bottom-time'>{dateDisplay}</div>
      {note.isStarred
        ? <i styleName='item-star' className='fa fa-star' /> : ''
      }
      <div styleName='item-bottom'>
        <div styleName='item-bottom-tagList'>
          {note.tags.length > 0
            ? TagElementList(note.tags)
            : <span styleName='item-bottom-tagList-empty' />
          }
        </div>
      </div>
    </div>
  </div>
)

NoteItem.propTypes = {
  isActive: PropTypes.bool.isRequired,
  dateDisplay: PropTypes.string.isRequired,
  note: PropTypes.shape({
    storage: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isrequired,
    tags: PropTypes.array,
    isStarred: PropTypes.bool.isRequired
  }),
  handleNoteClick: PropTypes.func.isRequired,
  handleNoteContextMenu: PropTypes.func.isRequired
}

export default CSSModules(NoteItem, styles)
