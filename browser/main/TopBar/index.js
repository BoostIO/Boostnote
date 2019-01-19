import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './TopBar.styl'
import _ from 'lodash'
import ee from 'browser/main/lib/eventEmitter'
import NewNoteButton from 'browser/main/NewNoteButton'
import i18n from 'browser/lib/i18n'
import debounce from 'lodash/debounce'

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

    this.updateKeyword = debounce(this.updateKeyword, 1000 / 60, {
      maxWait: 1000 / 8
    })
  }

  componentDidMount () {
    const { params } = this.props
    const searchWord = params.searchword
    if (searchWord !== undefined) {
      this.setState({
        search: searchWord,
        isSearching: true
      })
    }
    ee.on('top:focus-search', this.focusSearchHandler)
    ee.on('code:init', this.codeInitHandler)
  }

  componentWillUnmount () {
    ee.off('top:focus-search', this.focusSearchHandler)
    ee.off('code:init', this.codeInitHandler)
  }

  handleSearchClearButton (e) {
    const { router } = this.context
    this.setState({
      search: '',
      isSearching: false
    })
    this.refs.search.childNodes[0].blur
    router.push('/searched')
    e.preventDefault()
  }

  handleKeyDown (e) {
    // reset states
    this.setState({
      isAlphabet: false,
      isIME: false
    })

    // Clear search on ESC
    if (e.keyCode === 27) {
      return this.handleSearchClearButton(e)
    }

    // Next note on DOWN key
    if (e.keyCode === 40) {
      ee.emit('list:next')
      e.preventDefault()
    }

    // Prev note on UP key
    if (e.keyCode === 38) {
      ee.emit('list:prior')
      e.preventDefault()
    }

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
    // reset states
    this.setState({
      isConfirmTranslation: false
    })

    // When the key is translation confirmation (Enter, Space)
    if (this.state.isIME && (e.keyCode === 32 || e.keyCode === 13)) {
      this.setState({
        isConfirmTranslation: true
      })
      const keyword = this.refs.searchInput.value
      this.updateKeyword(keyword)
    }
  }

  handleSearchChange (e) {
    if (this.state.isAlphabet || this.state.isConfirmTranslation) {
      const keyword = this.refs.searchInput.value
      this.updateKeyword(keyword)
    } else {
      e.preventDefault()
    }
  }

  updateKeyword (keyword) {
    this.context.router.push(`/searched/${encodeURIComponent(keyword)}`)
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
    const el = this.refs.search.childNodes[0]
    if (this.state.isSearching) {
      el.blur()
    } else {
      el.select()
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
                placeholder={i18n.__('Search')}
                type='text'
                className='searchInput'
              />
              {this.state.search !== '' &&
                <button styleName='control-search-input-clear'
                  onClick={(e) => this.handleSearchClearButton(e)}
                >
                  <i className='fa fa-fw fa-times' />
                  <span styleName='control-search-input-clear-tooltip'>{i18n.__('Clear Search')}</span>
                </button>
              }
            </div>
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
