import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './Main.styl'
import { connect } from 'react-redux'
import SideNav from './SideNav'
import TopBar from './TopBar'
import NoteList from './NoteList'
import Detail from './Detail'
import dataApi from 'browser/main/lib/dataApi'
import _ from 'lodash'
import ConfigManager from 'browser/main/lib/ConfigManager'
import modal from 'browser/main/lib/modal'
import InitModal from 'browser/main/modals/InitModal'
import mixpanel from 'browser/main/lib/mixpanel'

function focused () {
  mixpanel.track('MAIN_FOCUSED')
}

class Main extends React.Component {
  constructor (props) {
    super(props)

    let { config } = props

    this.state = {
      isRightSliderFocused: false,
      listWidth: config.listWidth,
      navWidth: config.navWidth,
      isLeftSliderFocused: false
    }
  }

  getChildContext () {
    let { status, config } = this.props

    return {
      status,
      config
    }
  }

  componentDidMount () {
    let { dispatch, config } = this.props

    if (config.ui.theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark')
    } else {
      document.body.setAttribute('data-theme', 'default')
    }

    // Reload all data
    dataApi.init()
      .then((data) => {
        dispatch({
          type: 'INIT_ALL',
          storages: data.storages,
          notes: data.notes
        })

        if (data.storages.length < 1) {
          modal.open(InitModal)
        }
      })

    window.addEventListener('focus', focused)
  }

  componentWillUnmount () {
    window.removeEventListener('focus', focused)
  }

  handleLeftSlideMouseDown (e) {
    e.preventDefault()
    this.setState({
      isLeftSliderFocused: true
    })
  }

  handleRightSlideMouseDown (e) {
    e.preventDefault()
    this.setState({
      isRightSliderFocused: true
    })
  }

  handleMouseUp (e) {
    // Change width of NoteList component.
    if (this.state.isRightSliderFocused) {
      this.setState({
        isRightSliderFocused: false
      }, () => {
        let { dispatch } = this.props
        let newListWidth = this.state.listWidth
        // TODO: ConfigManager should dispatch itself.
        ConfigManager.set({listWidth: newListWidth})
        dispatch({
          type: 'SET_LIST_WIDTH',
          listWidth: newListWidth
        })
      })
    }

    // Change width of SideNav component.
    if (this.state.isLeftSliderFocused) {
      this.setState({
        isLeftSliderFocused: false
      }, () => {
        let { dispatch } = this.props
        let navWidth = this.state.navWidth
        // TODO: ConfigManager should dispatch itself.
        ConfigManager.set({ navWidth })
        dispatch({
          type: 'SET_NAV_WIDTH',
          navWidth
        })
      })
    }
  }

  handleMouseMove (e) {
    if (this.state.isRightSliderFocused) {
      let offset = this.refs.body.getBoundingClientRect().left
      let newListWidth = e.pageX - offset
      if (newListWidth < 10) {
        newListWidth = 10
      } else if (newListWidth > 600) {
        newListWidth = 600
      }
      this.setState({
        listWidth: newListWidth
      })
    }
    if (this.state.isLeftSliderFocused) {
      let navWidth = e.pageX
      if (navWidth < 80) {
        navWidth = 80
      } else if (navWidth > 600) {
        navWidth = 600
      }
      this.setState({
        navWidth: navWidth
      })
    }
  }

  render () {
    let { config } = this.props

    return (
      <div
        className='Main'
        styleName='root'
        onMouseMove={(e) => this.handleMouseMove(e)}
        onMouseUp={(e) => this.handleMouseUp(e)}
      >
        <SideNav
          {..._.pick(this.props, [
            'dispatch',
            'data',
            'config',
            'location'
          ])}
          width={this.state.navWidth}
        />
        {!config.isSideNavFolded &&
          <div styleName={this.state.isLeftSliderFocused ? 'slider--active' : 'slider'}
            style={{left: this.state.navWidth}}
            onMouseDown={(e) => this.handleLeftSlideMouseDown(e)}
            draggable='false'
          >
            <div styleName='slider-hitbox' />
          </div>
        }
        <div styleName={config.isSideNavFolded ? 'body--expanded' : 'body'}
          ref='body'
          style={{left: config.isSideNavFolded ? 44 : this.state.navWidth}}
        >
          <TopBar style={{width: this.state.listWidth}}
            {..._.pick(this.props, [
              'dispatch',
              'config',
              'data',
              'params',
              'location'
            ])}
          />
          <NoteList style={{width: this.state.listWidth}}
            {..._.pick(this.props, [
              'dispatch',
              'data',
              'config',
              'params',
              'location'
            ])}
          />
          <div styleName={this.state.isRightSliderFocused ? 'slider-right--active' : 'slider-right'}
            style={{left: this.state.listWidth - 1}}
            onMouseDown={(e) => this.handleRightSlideMouseDown(e)}
            draggable='false'
          >
            <div styleName='slider-hitbox' />
          </div>
          <Detail
            style={{left: this.state.listWidth}}
            {..._.pick(this.props, [
              'dispatch',
              'data',
              'config',
              'params',
              'location'
            ])}
            ignorePreviewPointerEvents={this.state.isRightSliderFocused}
          />
        </div>
      </div>
    )
  }
}

Main.childContextTypes = {
  status: PropTypes.shape({
    updateReady: PropTypes.bool.isRequired
  }).isRequired,
  config: PropTypes.shape({}).isRequired
}

Main.propTypes = {
  dispatch: PropTypes.func,
  data: PropTypes.shape({}).isRequired
}

export default connect((x) => x)(CSSModules(Main, styles))
