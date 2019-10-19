/**
 * @fileoverview Micro component for showing storage.
 */
import PropTypes from 'prop-types'
import React from 'react'
import styles from './StorageItem.styl'
import CSSModules from 'browser/lib/CSSModules'
import _ from 'lodash'
import { SortableHandle } from 'react-sortable-hoc'

const DraggableIcon = SortableHandle(({ className }) => (
  <i className={`fa ${className}`} />
))

const FolderIcon = ({ className, color, isActive }) => {
  const iconStyle = isActive ? 'fa-folder-open-o' : 'fa-folder-o'
  return (
    <i className={`fa ${iconStyle} ${className}`} style={{ color: color }} />
  )
}

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
  styles,
  isActive,
  handleButtonClick,
  handleContextMenu,
  folderName,
  folderColor,
  isFolded,
  noteCount,
  handleDrop,
  handleDragEnter,
  handleDragLeave
}) => {
  let isSubFolder
  let name = folderName
  const paths = folderName.split('/')
  if (paths.length > 1) {
    isSubFolder = true
    name = paths[paths.length - 1]
  }
  const folderStyle = `${isSubFolder ? 'sub' : ''}folderList-item`
  return (
    <button
      styleName={isActive ? `${folderStyle}--active` : folderStyle}
      onClick={handleButtonClick}
      onContextMenu={handleContextMenu}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {!isFolded &&
        <DraggableIcon className={styles['folderList-item-reorder']} />}
      <span
        styleName={
          isFolded ? 'folderList-item-name--folded' : 'folderList-item-name'
        }
      >
        <FolderIcon
          styleName='folderList-item-icon'
          color={folderColor}
          isActive={isActive}
        />
        {isFolded
          ? _.truncate(name, { length: 1, omission: '' })
          : name}
      </span>
      {!isFolded &&
        _.isNumber(noteCount) &&
        <span styleName='folderList-item-noteCount'>{noteCount}</span>}
      {isFolded &&
        <span styleName='folderList-item-tooltip'>{folderName}</span>}
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
