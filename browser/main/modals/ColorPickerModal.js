import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ColorPickerModal.styl'
import { SketchPicker } from 'react-color'

class ColorPickerModal extends React.Component {
  handleCloseButtonClick (e) {
    this.props.close()
  }
  render () {
    const colorPickerProps = {
      color: this.props.color,
      onChangeComplete: (colorObj) => {
        this.props.onChangeComplete(colorObj)
        this.props.close()
      }
    }
    // TODO: make a function that grabs caller element's position and render next to it
    return (
      <div styleName='colorPicker-wrapper'>
        <SketchPicker {...colorPickerProps} />
      </div>
    )
  }
}

ColorPickerModal.propTypes = {
}

export default CSSModules(ColorPickerModal, styles)
