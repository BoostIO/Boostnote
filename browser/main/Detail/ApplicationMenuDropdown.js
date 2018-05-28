import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ApplicationMenuDropdown.styl'
import _ from 'lodash'
import i18n from 'browser/lib/i18n'

class ApplicationMenuDropdown extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      isActive: false,
      menu: props.menu.items,
      open: props.open
    }

    console.log(this.state.menu, "submenu");
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      menu: nextProps.menu.items,
      open: nextProps.open
    })
  }

  handleMouseDown (e) {
    this.setState({
      isActive: true
    })
  }

  handleMouseUp (e) {
    this.setState({
      isActive: false
    })
  }

  handleMouseLeave (e) {
    this.setState({
      isActive: false
    })
  }

  clickMenu(key) {
    this.state.menu[key].click();
  }

  render () {
    const { className } = this.props

    return (
      <div className="ApplicationMenuDropdown"
        styleName={this.state.open == true ? "root" : "root-hidden"}>
        <ul className="dropdown-items"
          styleName="dropdown-items">
          {Object.keys(this.state.menu).map(key => {
            return <li className="submenu-item" styleName="submenu-item" onClick={() => this.state.menu[key].click()}>{this.state.menu[key].label}</li>
          })}
        </ul>
      </div>
    )
  }
}

ApplicationMenuDropdown.propTypes = {
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string
}

export default CSSModules(ApplicationMenuDropdown, styles)
