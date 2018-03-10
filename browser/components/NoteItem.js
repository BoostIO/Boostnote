/**
 * @fileoverview Note item component.
 */
import PropTypes from 'prop-types'
import React from 'react'
import { isArray } from 'lodash'
import CSSModules from 'browser/lib/CSSModules'
import { getTodoStatus } from 'browser/lib/getTodoStatus'
import styles from './NoteItem.styl'
import TodoProcess from './TodoProcess'

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
 * @param {Function} handleDragStart
 * @param {string} dateDisplay
 */
const NoteItem = ({
  isActive,
  note,
  dateDisplay,
  handleNoteClick,
  handleNoteContextMenu,
  handleDragStart,
  pathname,
  storageName,
  folderName,
  viewType
}) => (
  <div styleName={isActive
    ? 'item--active'
    : 'item'
  }
    key={`${note.storage}-${note.key}`}
    onClick={e => handleNoteClick(e, `${note.storage}-${note.key}`)}
    onContextMenu={e => handleNoteContextMenu(e, `${note.storage}-${note.key}`)}
    onDragStart={e => handleDragStart(e, note)}
    draggable='true'
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
      {['ALL', 'STORAGE'].includes(viewType) && <div styleName='item-middle'>
        <div styleName='item-middle-time'>{dateDisplay}</div>
        <div styleName='item-middle-app-meta'>
          <div title={viewType === 'ALL' ? storageName : viewType === 'STORAGE' ? folderName : null} styleName='item-middle-app-meta-label'>
            {viewType === 'ALL' && storageName}
            {viewType === 'STORAGE' && folderName}
          </div>
        </div>
      </div>}

      <div styleName='item-bottom'>
        <div styleName='item-bottom-tagList'>
          {note.tags.length > 0
            ? TagElementList(note.tags)
            : <span style={{ fontStyle: 'italic', opacity: 0.5 }} styleName='item-bottom-tagList-empty'>No tags</span>
          }
        </div>
        <div>
          {note.isStarred
            ? <img styleName='item-star' src='../resources/icon/icon-starred.svg' /> : ''
          }
          {note.isPinned && !pathname.match(/\/home|\/starred|\/trash/)
            ? <i styleName='item-pin' className='fa fa-thumb-tack' /> : ''
          }
          {note.type === 'MARKDOWN_NOTE'
            ? <TodoProcess todoStatus={getTodoStatus(note.content)} />
            : ''
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
    isStarred: PropTypes.bool.isRequired,
    isTrashed: PropTypes.bool.isRequired,
    blog: {
      blogLink: PropTypes.string,
      blogId: PropTypes.number
    }
  }),
  handleNoteClick: PropTypes.func.isRequired,
  handleNoteContextMenu: PropTypes.func.isRequired,
  handleDragStart: PropTypes.func.isRequired,
  handleDragEnd: PropTypes.func.isRequired
}

export default CSSModules(NoteItem, styles)
