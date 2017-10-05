import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './TopBar.styl'
import _ from 'lodash'
import NewNoteModal from 'browser/main/modals/NewNoteModal'
import ee from 'browser/main/lib/eventEmitter'
import NewNoteButton from 'browser/main/NewNoteButton'

const { remote } = require('electron')
const { dialog } = remote

const OSX = window.process.platform === 'darwin'

class TopBar extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      search: '',
      searchOptions: [],
      isSearching: false
    }

    this.focusSearchHandler = () => {
      this.handleOnSearchFocus()
    }
  }

  componentDidMount () {
    ee.on('top:focus-search', this.focusSearchHandler)
  }

  componentWillUnmount () {
    ee.off('top:focus-search', this.focusSearchHandler)
  }

  handleSearchChange (e) {
    let { router } = this.context
    router.push('/searched')
    this.setState({
      search: this.refs.searchInput.value
    })
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

  render () {
    let { config, style, data, location } = this.props
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
