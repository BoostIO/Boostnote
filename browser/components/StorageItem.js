/**
 * @fileoverview Micro component for showing storage.
 */
import React, { PropTypes } from 'react'
import styles from './StorageItem.styl'
import CSSModules from 'browser/lib/CSSModules'
import { isNumber } from 'lodash'

/**
 * @param {boolean} isActive
 * @param {boolean} isFocused
 * @param {Function} handleButtonClick
 * @param {Function} handleContextMenu
 * @param {string} folderName
 * @param {string} folderColor
 * @param {boolean} isFolded
 * @param {number} noteCount
 * @param {Function} handleDrop
 * @param {Function} handleDragEnter
 * @param {Function} handleDragOut
 * @param {Function} handleKeyDown
 * @return {React.Component}
 */
class StorageItem extends React.Component {
  componentDidUpdate () {
    if (this.props.isFocused) {
      this.button.focus()
    }
  }

  render () {
    const {
      isActive,
      handleButtonClick,
      handleContextMenu,
      folderName,
      folderColor,
      isFolded,
      noteCount,
      handleDrop,
      handleDragEnter,
      handleDragLeave,
      isFocused,
      handleKeyDown
    } = this.props

    const styleName = isFocused
      ? 'folderList-item--active-focused'
      : isActive ? 'folderList-item--active' : 'folderList-item'

    return (
      <button styleName={styleName}
        ref={button => { this.button = button }}
        onClick={handleButtonClick}
        onContextMenu={handleContextMenu}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onKeyDown={handleKeyDown}
      >
        <span styleName={isFolded
          ? 'folderList-item-name--folded' : 'folderList-item-name'
        }
          style={{ borderColor: folderColor }}
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
  }
}

StorageItem.propTypes = {
  isActive: PropTypes.bool.isRequired,
  isFocused: PropTypes.bool,
  handleButtonClick: PropTypes.func,
  handleContextMenu: PropTypes.func,
  folderName: PropTypes.string.isRequired,
  folderColor: PropTypes.string,
  isFolded: PropTypes.bool.isRequired,
  handleDragEnter: PropTypes.func.isRequired,
  handleDragLeave: PropTypes.func.isRequired,
  noteCount: PropTypes.number,
  handleKeyDown: PropTypes.func
}

export default CSSModules(StorageItem, styles)
