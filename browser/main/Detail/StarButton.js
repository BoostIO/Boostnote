import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './StarButton.styl'
import _ from 'lodash'
import i18n from 'browser/lib/i18n'

class StarButton extends React.Component {
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
          _.isString(className) ? 'StarButton ' + className : 'StarButton'
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
              ? '../resources/icon/icon-starred.svg'
              : '../resources/icon/icon-star.svg'
          }
        />
        <span lang={i18n.locale} styleName='tooltip'>
          {i18n.__('Star')}
        </span>
      </button>
    )
  }
}

StarButton.propTypes = {
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string
}

export default CSSModules(StarButton, styles)
