import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './NewNoteModal.styl'
import dataApi from 'browser/main/lib/dataApi'
import { hashHistory } from 'react-router'
import ee from 'browser/main/lib/eventEmitter'
import ModalEscButton from 'browser/components/ModalEscButton'
import AwsMobileAnalyticsConfig from 'browser/main/lib/AwsMobileAnalyticsConfig'

class NewNoteModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
    }
  }

  componentDidMount () {
    this.refs.markdownButton.focus()
  }

  handleCloseButtonClick (e) {
    this.props.close()
  }

  handleMarkdownNoteButtonClick (e) {
    AwsMobileAnalyticsConfig.recordDynamicCustomEvent('ADD_MARKDOWN')
    AwsMobileAnalyticsConfig.recordDynamicCustomEvent('ADD_ALLNOTE')
    const { storage, folder, dispatch, location } = this.props
    dataApi
      .createNote(storage, {
        type: 'MARKDOWN_NOTE',
        folder: folder,
        title: '',
        content: ''
      })
      .then((note) => {
        const noteHash = `${note.storage}-${note.key}`
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
  }

  handleMarkdownNoteButtonKeyDown (e) {
    if (e.keyCode === 9) {
      e.preventDefault()
      this.refs.snippetButton.focus()
    }
  }

  handleSnippetNoteButtonClick (e) {
    AwsMobileAnalyticsConfig.recordDynamicCustomEvent('ADD_SNIPPET')
    AwsMobileAnalyticsConfig.recordDynamicCustomEvent('ADD_ALLNOTE')
    const { storage, folder, dispatch, location } = this.props

    dataApi
      .createNote(storage, {
        type: 'SNIPPET_NOTE',
        folder: folder,
        title: '',
        description: '',
        snippets: [{
          name: '',
          mode: 'text',
          content: ''
        }]
      })
      .then((note) => {
        const noteHash = `${note.storage}-${note.key}`
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
  }

  handleSnippetNoteButtonKeyDown (e) {
    if (e.keyCode === 9) {
      e.preventDefault()
      this.refs.markdownButton.focus()
    }
  }

  handleKeyDown (e) {
    if (e.keyCode === 27) {
      this.props.close()
    }
  }

  render () {
    return (
      <div styleName='root'
        tabIndex='-1'
        onKeyDown={(e) => this.handleKeyDown(e)}
      >
        <div styleName='header'>
          <div styleName='title'>Make a note</div>
        </div>
        <ModalEscButton handleEscButtonClick={(e) => this.handleCloseButtonClick(e)} />
        <div styleName='control'>
          <button styleName='control-button'
            onClick={(e) => this.handleMarkdownNoteButtonClick(e)}
            onKeyDown={(e) => this.handleMarkdownNoteButtonKeyDown(e)}
            ref='markdownButton'
          >
            <i styleName='control-button-icon'
              className='fa fa-file-text-o'
            /><br />
            <span styleName='control-button-label'>Markdown Note</span><br />
            <span styleName='control-button-description'>This format is for creating text documents. Checklists, code blocks and Latex blocks are available.</span>
          </button>

          <button styleName='control-button'
            onClick={(e) => this.handleSnippetNoteButtonClick(e)}
            onKeyDown={(e) => this.handleSnippetNoteButtonKeyDown(e)}
            ref='snippetButton'
          >
            <i styleName='control-button-icon'
              className='fa fa-code'
            /><br />
            <span styleName='control-button-label'>Snippet Note</span><br />
            <span styleName='control-button-description'>This format is for creating code snippets. Multiple snippets can be grouped into a single note.
            </span>
          </button>

        </div>
        <div styleName='description'><i className='fa fa-arrows-h' /> Tab to switch format</div>

      </div>
    )
  }
}

NewNoteModal.propTypes = {
}

export default CSSModules(NewNoteModal, styles)
