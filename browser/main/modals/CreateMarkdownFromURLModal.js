import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './CreateMarkdownFromURLModal.styl'
import dataApi from 'browser/main/lib/dataApi'
import store from 'browser/main/store'
import consts from 'browser/lib/consts'
import ModalEscButton from 'browser/components/ModalEscButton'
import AwsMobileAnalyticsConfig from 'browser/main/lib/AwsMobileAnalyticsConfig'
import i18n from 'browser/lib/i18n'
const http = require('http')
const https = require('https')
const TurndownService = require('turndown')
import { hashHistory } from 'react-router'
import ee from 'browser/main/lib/eventEmitter'

class CreateMarkdownFromURLModal extends React.Component {
  constructor (props) {
    super(props)
    let td = new TurndownService();

    this.state = {
      name: '',
      showerror: false,
      errormessage: '',
      turndownService: td
    }

  }

  componentDidMount () {
    this.refs.name.focus()
    this.refs.name.select()
  }

  handleCloseButtonClick (e) {
    this.props.close()
  }

  handleChange (e) {
    this.setState({
      name: this.refs.name.value
    })
  }

  handleKeyDown (e) {
    if (e.keyCode === 27) {
      this.props.close()
    }
  }

  handleInputKeyDown (e) {
    switch (e.keyCode) {
      case 13:
        this.confirm()
    }
  }

  handleConfirmButtonClick (e) {
    this.confirm()
  }

  showError(message) {
    this.setState({
      showerror: true,
      errormessage: message
    });
  }

  hideError() {
    this.setState({
      showerror: false,
      errormessage: ''
    })
  }

  validateUrl(str) {
    if(/^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(str)) {
      return true;
    } else {
      return false;
    }
  }

  confirm () {
    if(this.validateUrl(this.state.name)) {
      this.hideError()
      let url = this.state.name;
      let request = http;
      if(url.includes('https'))
        request = https;
      let req = request.request(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          console.log("receiving data", data);

          let html = document.createElement('html');
          html.innerHTML = data;

          let scripts = html.getElementsByTagName('script');
          for(let i = scripts.length - 1; i >= 0; i--) {
            scripts[i].parentNode.removeChild(scripts[i]);
          }

          let body = html.getElementsByTagName('body')[0].innerHTML;
          let markdownHTML = this.state.turndownService.turndown(body);
          console.log('markdown', markdownHTML);
          html.innerHTML = '';
          const { storage, folder, dispatch, location } = this.props

          dataApi
            .createNote(storage, {
              type: 'MARKDOWN_NOTE',
              folder: folder,
              title: '',
              content: markdownHTML
            })
            .then((note) => {
              const noteHash = note.key
              dispatch({
                type: 'UPDATE_NOTE',
                note: note
              })
              hashHistory.push({
                pathname: location.pathname,
                query: {key: noteHash}
              })
              ee.emit('list:jump', noteHash)
              ee.emit('detail:focus')
              this.props.close()
            })
        })
      });
      req.on('error', (e) => {
        console.log("Error in request", e.message);
      });
      req.end();
    } else {
      this.showError("Please check your URL is in correct format. (Example, 'https://google.com')")
    }
  }

  render () {
    return (
      <div styleName='root'
        tabIndex='-1'
        onKeyDown={(e) => this.handleKeyDown(e)}
      >
        <div styleName='header'>
          <div styleName='title'>{i18n.__('Import Markdown From URL')}</div>
        </div>
        <ModalEscButton handleEscButtonClick={(e) => this.handleCloseButtonClick(e)} />
        <div styleName='control'>
          <div styleName='control-folder'>
            <div styleName='control-folder-label'>{i18n.__('Insert URL Here')}</div>
            <input styleName='control-folder-input'
              ref='name'
              value={this.state.name}
              onChange={(e) => this.handleChange(e)}
              onKeyDown={(e) => this.handleInputKeyDown(e)}
            />
          </div>
          <button styleName='control-confirmButton'
            onClick={(e) => this.handleConfirmButtonClick(e)}
          >
            {i18n.__('Import')}
          </button>
          <div className="error" styleName="error">{this.state.errormessage}</div>
        </div>
      </div>
    )
  }
}

CreateMarkdownFromURLModal.propTypes = {
  storage: PropTypes.shape({
    key: PropTypes.string
  })
}

export default CSSModules(CreateMarkdownFromURLModal, styles)
