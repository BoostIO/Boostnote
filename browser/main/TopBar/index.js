import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './TopBar.styl'
import _ from 'lodash'
import ee from 'browser/main/lib/eventEmitter'
import NewNoteButton from 'browser/main/NewNoteButton'

class TopBar extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      search: '',
      searchOptions: [],
      isSearching: false,
      isAlphabet: false,
      isIME: false,
      isConfirmTranslation: false
    }

    this.focusSearchHandler = () => {
      this.handleOnSearchFocus()
    }

    this.codeInitHandler = this.handleCodeInit.bind(this)
  }

  componentDidMount () {
    ee.on('top:focus-search', this.focusSearchHandler)
    ee.on('code:init', this.codeInitHandler)
  }

  componentWillUnmount () {
    ee.off('top:focus-search', this.focusSearchHandler)
    ee.off('code:init', this.codeInitHandler)
  }

  handleKeyDown (e) {
    // reset states
    this.setState({
      isAlphabet: false,
      isIME: false
    })

    // When the key is an alphabet, del, enter or ctr
    if (e.keyCode <= 90 || e.keyCode >= 186 && e.keyCode <= 222) {
      this.setState({
        isAlphabet: true
      })
    // When the key is an IME input (Japanese, Chinese)
    } else if (e.keyCode === 229) {
      this.setState({
        isIME: true
      })
    }
  }

  handleKeyUp (e) {
    const { router } = this.context
    // reset states
    this.setState({
      isConfirmTranslation: false
    })

    // When the key is translation confirmation (Enter, Space)
    if (this.state.isIME && (e.keyCode === 32 || e.keyCode === 13)) {
      this.setState({
        isConfirmTranslation: true
      })
      router.push('/searched')
      this.setState({
        search: this.refs.searchInput.value
      })
    }
  }

  handleSearchChange (e) {
    const { router } = this.context
    const keyword = this.refs.searchInput.value
    if (this.state.isAlphabet || this.state.isConfirmTranslation) {
      router.push('/searched')
    } else {
      e.preventDefault()
    }
    this.setState({
      search: keyword
    })
    ee.emit('top:search', keyword)
  }

  handleSearchFocus (e) {
    this.setState({
      isSearching: true
    })
  }
  handleSearchBlur (e) {
    e.stopPropagation()

    let el = e.relatedTarget
    let isStillFocused = false
    while (el != null) {
      if (el === this.refs.search) {
        isStillFocused = true
        break
      }
      el = el.parentNode
    }
    if (!isStillFocused) {
      this.setState({
        isSearching: false
      })
    }
  }

  handleOnSearchFocus () {
    if (this.state.isSearching) {
      this.refs.search.childNodes[0].blur()
    } else {
      this.refs.search.childNodes[0].focus()
    }
  }

  handleCodeInit () {
    ee.emit('top:search', this.refs.searchInput.value)
  }

  render () {
    const { config, style, location } = this.props
    return (
      <div className='TopBar'
        styleName={config.isSideNavFolded ? 'root--expanded' : 'root'}
        style={style}
      >
        <div styleName='control'>
          <div styleName='control-search'>
            <div styleName='control-search-input'
              onFocus={(e) => this.handleSearchFocus(e)}
              onBlur={(e) => this.handleSearchBlur(e)}
              tabIndex='-1'
              ref='search'
            >
              <input
                ref='searchInput'
                value={this.state.search}
                onChange={(e) => this.handleSearchChange(e)}
                onKeyDown={(e) => this.handleKeyDown(e)}
                onKeyUp={(e) => this.handleKeyUp(e)}
                placeholder='Search'
                type='text'
                className='searchInput'
              />
            </div>
            {this.state.search > 0 &&
              <button styleName='left-search-clearButton'
                onClick={(e) => this.handleSearchClearButton(e)}
              >
                <i className='fa fa-times' />
              </button>
            }

          </div>
        </div>
        {location.pathname === '/trashed' ? ''
        : <NewNoteButton
          {..._.pick(this.props, [
            'dispatch',
            'data',
            'config',
            'params',
            'location'
          ])}
        />}
      </div>
    )
  }
}

TopBar.contextTypes = {
  router: PropTypes.shape({
    push: PropTypes.func
  })
}

TopBar.propTypes = {
  dispatch: PropTypes.func,
  config: PropTypes.shape({
    isSideNavFolded: PropTypes.bool
  })
}

export default CSSModules(TopBar, styles)
