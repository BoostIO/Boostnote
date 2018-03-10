/**
 * @fileoverview Micro component for showing storage.
 */
import PropTypes from 'prop-types'
import React from 'react'
import styles from './StorageItem.styl'
import CSSModules from 'browser/lib/CSSModules'
import _ from 'lodash'
import { SortableHandle } from 'react-sortable-hoc'

/**
 * @param {boolean} isActive
 * @param {Function} handleButtonClick
 * @param {Function} handleContextMenu
 * @param {string} folderName
 * @param {string} folderColor
 * @param {boolean} isFolded
 * @param {number} noteCount
 * @param {Function} handleDrop
 * @param {Function} handleDragEnter
 * @param {Function} handleDragOut
 * @return {React.Component}
 */
const StorageItem = ({
  isActive, handleButtonClick, handleContextMenu, folderName,
  folderColor, isFolded, noteCount, handleDrop, handleDragEnter, handleDragLeave
}) => {
  const FolderDragger = SortableHandle(({ className }) => <i className={className} />)
  return (
    <button styleName={isActive
      ? 'folderList-item--active'
      : 'folderList-item'
    }
      onClick={handleButtonClick}
      onContextMenu={handleContextMenu}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <span styleName={isFolded
        ? 'folderList-item-name--folded' : 'folderList-item-name'
      }>
        <text style={{color: folderColor, paddingRight: '10px'}}>{isActive ? <FolderDragger className='fa fa-folder-open-o' /> : <FolderDragger className='fa fa-folder-o' />}</text>{isFolded ? _.truncate(folderName, {length: 1, omission: ''}) : folderName}
      </span>
      {(!isFolded && _.isNumber(noteCount)) &&
        <span styleName='folderList-item-noteCount'>{noteCount}</span>
      }
      {isFolded &&
        <span styleName='folderList-item-tooltip'>
          {folderName}
        </span>
      }
    </button>
  )
}

StorageItem.propTypes = {
  isActive: PropTypes.bool.isRequired,
  handleButtonClick: PropTypes.func,
  handleContextMenu: PropTypes.func,
  folderName: PropTypes.string.isRequired,
  folderColor: PropTypes.string,
  isFolded: PropTypes.bool.isRequired,
  handleDragEnter: PropTypes.func.isRequired,
  handleDragLeave: PropTypes.func.isRequired,
  noteCount: PropTypes.number
}

export default CSSModules(StorageItem, styles)
