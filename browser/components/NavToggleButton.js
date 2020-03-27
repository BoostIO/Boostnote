/**
 * @fileoverview Micro component for toggle SideNav
 */
import PropTypes from 'prop-types'
import React from 'react'
import styles from './NavToggleButton.styl'
import CSSModules from 'browser/lib/CSSModules'

/**
 * @param {boolean} isFolded
 * @param {Function} handleToggleButtonClick
 */

const NavToggleButton = ({ isFolded, handleToggleButtonClick }) => (
  <button styleName='navToggle' onClick={e => handleToggleButtonClick(e)}>
    {isFolded ? (
      <i className='fa fa-angle-double-right fa-2x' />
    ) : (
      <i className='fa fa-angle-double-left fa-2x' />
    )}
  </button>
)

NavToggleButton.propTypes = {
  isFolded: PropTypes.bool.isRequired,
  handleToggleButtonClick: PropTypes.func.isRequired
}

export default CSSModules(NavToggleButton, styles)
