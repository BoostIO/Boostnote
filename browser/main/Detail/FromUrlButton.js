import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './FromUrlButton.styl'
import _ from 'lodash'
import i18n from 'browser/lib/i18n'

class FromUrlButton extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isActive: false
    }
  }

  handleMouseDown(e) {
    this.setState({
      isActive: true
    })
  }

  handleMouseUp(e) {
    this.setState({
      isActive: false
    })
  }

  handleMouseLeave(e) {
    this.setState({
      isActive: false
    })
  }

  render() {
    const { className } = this.props

    return (
      <button
        className={
          _.isString(className) ? 'FromUrlButton ' + className : 'FromUrlButton'
        }
        styleName={
          this.state.isActive || this.props.isActive ? 'root--active' : 'root'
        }
        onMouseDown={e => this.handleMouseDown(e)}
        onMouseUp={e => this.handleMouseUp(e)}
        onMouseLeave={e => this.handleMouseLeave(e)}
        onClick={this.props.onClick}
      >
        <img
          styleName='icon'
          src={
            this.state.isActive || this.props.isActive
              ? '../resources/icon/icon-external.svg'
              : '../resources/icon/icon-external.svg'
          }
        />
        <span styleName='tooltip'>{i18n.__('Convert URL to Markdown')}</span>
      </button>
    )
  }
}

FromUrlButton.propTypes = {
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string
}

export default CSSModules(FromUrlButton, styles)
