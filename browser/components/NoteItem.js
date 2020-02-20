/**
 * @fileoverview Note item component.
 */
import PropTypes from 'prop-types'
import React from 'react'
import { isArray, sortBy } from 'lodash'
import invertColor from 'invert-color'
import Emoji from 'react-emoji-render'
import CSSModules from 'browser/lib/CSSModules'
import { getTodoStatus } from 'browser/lib/getTodoStatus'
import styles from './NoteItem.styl'
import TodoProcess from './TodoProcess'
import i18n from 'browser/lib/i18n'

/**
 * @description Tag element component.
 * @param {string} tagName
 * @param {string} color
 * @return {React.Component}
 */
const TagElement = ({ tagName, color }) => {
  const style = {}
  if (color) {
    style.backgroundColor = color
    style.color = invertColor(color, {
      black: '#222',
      white: '#f1f1f1',
      threshold: 0.3
    })
  }
  return (
    <span styleName='item-bottom-tagList-item' key={tagName} style={style}>
      #{tagName}
    </span>
  )
}

/**
 * @description Tag element list component.
 * @param {Array|null} tags
 * @param {boolean} showTagsAlphabetically
 * @param {Object} coloredTags
 * @return {React.Component}
 */
const TagElementList = (tags, showTagsAlphabetically, coloredTags) => {
  if (!isArray(tags)) {
    return []
  }

  if (showTagsAlphabetically) {
    return sortBy(tags).map(tag =>
      TagElement({ tagName: tag, color: coloredTags[tag] })
    )
  } else {
    return tags.map(tag =>
      TagElement({ tagName: tag, color: coloredTags[tag] })
    )
  }
}

/**
 * @description Note item component when using normal display mode.
 * @param {boolean} isActive
 * @param {Object} note
 * @param {Function} handleNoteClick
 * @param {Function} handleNoteContextMenu
 * @param {Function} handleDragStart
 * @param {Object} coloredTags
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
  viewType,
  showTagsAlphabetically,
  coloredTags
}) => (
  <div
    styleName={isActive ? 'item--active' : 'item'}
    key={note.key}
    onClick={e => handleNoteClick(e, note.key)}
    onContextMenu={e => handleNoteContextMenu(e, note.key)}
    onDragStart={e => handleDragStart(e, note)}
    draggable='true'
  >
    <div styleName='item-wrapper'>
      {note.type === 'SNIPPET_NOTE' ? (
        <i styleName='item-title-icon' className='fa fa-fw fa-code' />
      ) : (
        <i styleName='item-title-icon' className='fa fa-fw fa-file-text-o' />
      )}
      <div styleName='item-title'>
        {note.title.trim().length > 0 ? (
          <Emoji text={note.title} />
        ) : (
          <span styleName='item-title-empty'>{i18n.__('Empty note')}</span>
        )}
      </div>
      <div styleName='item-middle'>
        <div styleName='item-middle-time'>{dateDisplay}</div>
        <div styleName='item-middle-app-meta'>
          <div
            title={
              viewType === 'ALL'
                ? storageName
                : viewType === 'STORAGE'
                ? folderName
                : null
            }
            styleName='item-middle-app-meta-label'
          >
            {viewType === 'ALL' && storageName}
            {viewType === 'STORAGE' && folderName}
          </div>
        </div>
      </div>
      <div styleName='item-bottom'>
        <div styleName='item-bottom-tagList'>
          {note.tags.length > 0 ? (
            TagElementList(note.tags, showTagsAlphabetically, coloredTags)
          ) : (
            <span
              style={{ fontStyle: 'italic', opacity: 0.5 }}
              styleName='item-bottom-tagList-empty'
            >
              {i18n.__('No tags')}
            </span>
          )}
        </div>
        <div>
          {note.isStarred ? (
            <img
              styleName='item-star'
              src='../resources/icon/icon-starred.svg'
            />
          ) : (
            ''
          )}
          {note.isPinned && !pathname.match(/\/starred|\/trash/) ? (
            <i styleName='item-pin' className='fa fa-thumb-tack' />
          ) : (
            ''
          )}
          {note.type === 'MARKDOWN_NOTE' ? (
            <TodoProcess todoStatus={getTodoStatus(note.content)} />
          ) : (
            ''
          )}
        </div>
      </div>
    </div>
  </div>
)

NoteItem.propTypes = {
  isActive: PropTypes.bool.isRequired,
  dateDisplay: PropTypes.string.isRequired,
  coloredTags: PropTypes.object,
  note: PropTypes.shape({
    storage: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isrequired,
    tags: PropTypes.array,
    isStarred: PropTypes.bool.isRequired,
    isTrashed: PropTypes.bool.isRequired,
    blog: PropTypes.shape({
      blogLink: PropTypes.string,
      blogId: PropTypes.number
    })
  }),
  handleNoteClick: PropTypes.func.isRequired,
  handleNoteContextMenu: PropTypes.func.isRequired,
  handleDragStart: PropTypes.func.isRequired
}

export default CSSModules(NoteItem, styles)
