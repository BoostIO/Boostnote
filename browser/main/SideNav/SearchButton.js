import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './SearchButton.styl'
import i18n from 'browser/lib/i18n'

const SearchButton = ({ onClick, isActive }) => (
  <button styleName='top-menu-search' onClick={e => onClick(e)}>
    <img
      styleName='icon-search'
      src={
        isActive
          ? '../resources/icon/icon-search-active.svg'
          : '../resources/icon/icon-search.svg'
      }
    />
    <span styleName='tooltip'>{i18n.__('Search')}</span>
  </button>
)

SearchButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool
}

export default CSSModules(SearchButton, styles)
