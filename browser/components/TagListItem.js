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
* @param {bool} isActive
*/

const TagListItem = ({name, handleClickTagListItem, isActive, count}) => (
  <button styleName={isActive ? 'tagList-item-active' : 'tagList-item'} onClick={() => handleClickTagListItem(name)}>
    <span styleName='tagList-item-name'>
      {`# ${name}`}
      <span styleName='tagList-item-count'> {count}</span>
    </span>
  </button>
)

TagListItem.propTypes = {
  name: PropTypes.string.isRequired,
  handleClickTagListItem: PropTypes.func.isRequired
}

export default CSSModules(TagListItem, styles)
