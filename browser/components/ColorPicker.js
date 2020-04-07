import React from 'react'
import PropTypes from 'prop-types'
import { SketchPicker } from 'react-color'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ColorPicker.styl'

const componentHeight = 330

class ColorPicker extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      color: this.props.color || '#939395'
    }

    this.onColorChange = this.onColorChange.bind(this)
    this.handleConfirm = this.handleConfirm.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    this.onColorChange(nextProps.color)
  }

  onColorChange(color) {
    this.setState({
      color
    })
  }

  handleConfirm() {
    this.props.onConfirm(this.state.color)
  }

  render() {
    const { onReset, onCancel, targetRect } = this.props
    const { color } = this.state

    const clientHeight = document.body.clientHeight
    const alignX = targetRect.right + 4
    let alignY = targetRect.top
    if (targetRect.top + componentHeight > clientHeight) {
      alignY = targetRect.bottom - componentHeight
    }

    return (
      <div
        styleName='colorPicker'
        style={{ top: `${alignY}px`, left: `${alignX}px` }}
      >
        <div styleName='cover' onClick={onCancel} />
        <SketchPicker color={color} onChange={this.onColorChange} />
        <div styleName='footer'>
          <button styleName='btn-reset' onClick={onReset}>
            Reset
          </button>
          <button styleName='btn-cancel' onClick={onCancel}>
            Cancel
          </button>
          <button styleName='btn-confirm' onClick={this.handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    )
  }
}

ColorPicker.propTypes = {
  color: PropTypes.string,
  targetRect: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired
}

export default CSSModules(ColorPicker, styles)
