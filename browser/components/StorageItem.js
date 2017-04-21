/**
 * @fileoverview Micro component for showing storage.
 */
import React, { PropTypes } from 'react'
import styles from './StorageItem.styl'
import CSSModules from 'browser/lib/CSSModules'
import { isNumber } from 'lodash'

/**
 * @param {boolean} isActive
 * @param {Function} handleButtonClick
 * @param {Function} handleContextMenu
 * @param {string} folderName
 * @param {string} folderColor
 * @param {boolean} isFolded
 * @param {number} noteCount
 * @param {Function} handleDragStart
 * @param {Function} handleDrop
 * @return {React.Component}
 */
const StorageItem = ({
  isActive, handleButtonClick, handleContextMenu, folderName,
  folderColor, isFolded, noteCount, handleDragStart, handleDrop
}) => (
  <button styleName={isActive
      ? 'folderList-item--active'
      : 'folderList-item'
    }
    onClick={handleButtonClick}
    onContextMenu={handleContextMenu}
    onDragStart={handleDragStart}
    onDrop={handleDrop}
    draggable='true'
  >
    <span styleName={isFolded
      ? 'folderList-item-name--folded' : 'folderList-item-name'
    }
      style={{borderColor: folderColor}}
    >
      {isFolded ? folderName.substring(0, 1) : folderName}
    </span>
    {(!isFolded && isNumber(noteCount)) &&
      <span styleName='folderList-item-noteCount'>{noteCount}</span>
    }
    {isFolded &&
      <span styleName='folderList-item-tooltip'>
        {folderName}
      </span>
    }
  </button>
)

StorageItem.propTypes = {
  isActive: PropTypes.bool.isRequired,
  handleButtonClick: PropTypes.func,
  handleContextMenu: PropTypes.func,
  folderName: PropTypes.string.isRequired,
  folderColor: PropTypes.string,
  isFolded: PropTypes.bool.isRequired,
  noteCount: PropTypes.number,
  handleDragStart: PropTypes.func.isRequired,
  handleDrop: PropTypes.func.isRequired
}

export default CSSModules(StorageItem, styles)
