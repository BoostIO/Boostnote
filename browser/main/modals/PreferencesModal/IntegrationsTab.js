import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ConfigTab.styl'
import ConfigManager from 'browser/main/lib/ConfigManager'
import store from 'browser/main/store'

const electron = require('electron')
const { shell, remote } = electron

class IntegrationsTab extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      config: props.config
    }
  }

  renderGist () {
    let config = this.state.config;

    return (
      <div styleName='group'>
        <div styleName='group-header'>Integrations</div>
        <div styleName='group-header2'>Gist</div>
        <div styleName='group-section'>
          <div styleName='group-section-label'>
            Github API Token
          </div>
          <div styleName='group-section-control'>
            <input styleName='group-section-control-input'
              value={config.integrations.gist.token}
              ref='gistToken'
              onChange={(e) => this.handleUIChange(e)}
              type='text'
            />
          </div>
        </div>
      </div>
    )
  }

  render () {
    return (
      <div styleName='root'>
        {this.renderGist()}
        <div className='group-control'>
          <button styleName='group-control-rightButton'
            onClick={(e) => this.handleSaveUIClick(e)}
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  handleUIChange (e) {
    const gistIntegration = { token: this.refs.gistToken.value }

    const newConfig = {
      ui: this.state.config.ui,
      editor: this.state.config.editor,
      preview: this.state.config.preview,
      integrations: { gist: gistIntegration }
    }

    this.setState({ config: newConfig })
  }

  handleSaveUIClick (e) {
    const newConfig = {
      ui: this.state.config.ui,
      editor: this.state.config.editor,
      preview: this.state.config.preview,
      integrations: this.state.config.integrations
    }

    ConfigManager.set(newConfig)

    store.dispatch({
      type: 'SET_UI',
      config: newConfig
    })
  }
}

IntegrationsTab.propTypes = {
}

export default CSSModules(IntegrationsTab, styles)
