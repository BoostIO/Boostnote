import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './LockButton.styl'
import eventEmitter from 'browser/main/lib/eventEmitter'

class LockButton extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      isLocked: false
    }

    this.handleLockButtonMouseDown = this.handleLockButtonMouseDown.bind(this)
  }

  handleFocus (e) {
    this.props.focus()
  }

  handleLockButtonMouseDown (e) {
    e.preventDefault()
    eventEmitter.emit('editor:lock')
    this.setState({ isLocked: !this.state.isLocked })
    if (this.state.isLocked) eventEmitter.emit('detail:focus')
  }

  render () {
    return (
      <button styleName='control-lockButton'
        onFocus={this.handleFocus}
        onMouseDown={this.handleLockButtonMouseDown}
      >
        <i className={`fa ${this.state.isLocked ? 'fa-lock' : 'fa-unlock-alt'}`} styleName='lock-button' />
        <span styleName='control-lockButton-tooltip'>
          {this.state.isLocked ? 'Unlock' : 'Lock'}
        </span>
      </button>
    )
  }
}

export default CSSModules(LockButton, styles)
