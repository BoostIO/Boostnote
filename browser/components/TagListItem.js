/**
 * @fileoverview Micro component for showing TagList.
 */
import PropTypes from 'prop-types'
import React from 'react'
import styles from './TagListItem.styl'
import CSSModules from 'browser/lib/CSSModules'

/**
 * @param {string} name
 * @param {Function} handleClickTagListItem
 * @param {Function} handleClickNarrowToTag
 * @param {boolean} isActive
 * @param {boolean} isRelated
 * @param {string} bgColor tab backgroundColor
 */

const TagListItem = ({
  name,
  handleClickTagListItem,
  handleClickNarrowToTag,
  handleContextMenu,
  isActive,
  isRelated,
  count,
  color
}) => (
  <div
    styleName='tagList-itemContainer'
    onContextMenu={e => handleContextMenu(e, name)}
  >
    {isRelated ? (
      <button
        styleName={
          isActive ? 'tagList-itemNarrow-active' : 'tagList-itemNarrow'
        }
        onClick={() => handleClickNarrowToTag(name)}
      >
        <i className={isActive ? 'fa fa-minus-circle' : 'fa fa-plus-circle'} />
      </button>
    ) : (
      <div
        styleName={
          isActive ? 'tagList-itemNarrow-active' : 'tagList-itemNarrow'
        }
      />
    )}
    <button
      styleName={isActive ? 'tagList-item-active' : 'tagList-item'}
      onClick={() => handleClickTagListItem(name)}
    >
      <span
        styleName='tagList-item-color'
        style={{ backgroundColor: color || 'transparent' }}
      />
      <span styleName='tagList-item-name'>
        {`# ${name}`}
        <span styleName='tagList-item-count'>{count !== 0 ? count : ''}</span>
      </span>
    </button>
  </div>
)

TagListItem.propTypes = {
  name: PropTypes.string.isRequired,
  handleClickTagListItem: PropTypes.func.isRequired,
  color: PropTypes.string
}

export default CSSModules(TagListItem, styles)
