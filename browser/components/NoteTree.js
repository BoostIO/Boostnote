/**
 * @fileoverview Note item component with simple display mode.
 */
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './NoteTree.styl'
import NoteItemSimple from 'browser/components/NoteItemSimple'
import { connect } from 'react-redux'

/**
 * @description Note item component when using simple display mode.
 * @param {boolean} isActive
 * @param {Object} noteTreeData
 * @param {Function} handleNoteClick
 * @param {Function} handleNoteContextMenu
 * @param {Function} handleDragStart
 */

function getNoteKey (note) {
  return `${note.storage}-${note.key}`
}

class NoteTree extends React.Component {

  handleToggleButtonClick (path) {
    this.props.handleToggleButtonClick && this.props.handleToggleButtonClick(path)
  }

  render () {
    const subTree = this.props.subTree
    const fullpath = this.props.fullpath
    const subTreeDisplay = (Array.isArray(subTree))
      ? subTree.map(note => {
        const uniqueKey = getNoteKey(note)
        const isActive = this.props.selectedNoteKeys.includes(uniqueKey)
        const pathname = this.props.location.pathname

        return (
          <NoteItemSimple
            isActive={isActive}
            note={note}
            key={uniqueKey}
            handleNoteClick={this.props.handleNoteClick}
            pathname={pathname}
          />
        )
      })
      : Object.keys(subTree).map(k => {
        const newPath = this.props.fullpath + '/' + k
        return (
          <NoteTree className='NoteTree'
            label={k}
            subTree={subTree[k]}
            fullpath={newPath}
            key={newPath}
            handleToggleButtonClick={this.props.handleToggleButtonClick}
            isOpen={this.props.isOpen}
            selectedNoteKeys={this.props.selectedNoteKeys}
            location={this.props.location}
            handleNoteClick={this.props.handleNoteClick}
          />
        )
      })

    const isOpen = this.props.isOpen.get(fullpath)
    return (
      <ol className='NoteTree' styleName='tree'>
        <button className={styles['toggleButton']}
          onMouseDown={e => { return this.props.handleToggleButtonClick(fullpath) }}
        >
          <img src={isOpen
            ? '../resources/icon/icon-down.svg'
            : '../resources/icon/icon-right.svg'
          }
          />
        </button>
        {this.props.label}
        {isOpen && subTreeDisplay}
      </ol>
    )
  }
}
const actionToggleOpen = path => ({ type: 'TOGGLE_TREE', path })
const mapStateToProps = state => ({
  isOpen: state.data.treeVisibilityMap
})
const mapDispatchToProps = dispatch => {
  return {
    handleToggleButtonClick: path => dispatch(actionToggleOpen(path))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CSSModules(NoteTree, styles))
