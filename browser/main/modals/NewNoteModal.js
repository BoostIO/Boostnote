import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './NewNoteModal.styl'
import ModalEscButton from 'browser/components/ModalEscButton'
import i18n from 'browser/lib/i18n'
import { openModal } from 'browser/main/lib/modal'
import CreateMarkdownFromURLModal from '../modals/CreateMarkdownFromURLModal'
import { createMarkdownNote, createSnippetNote } from 'browser/lib/newNote'
import queryString from 'query-string'

class NewNoteModal extends React.Component {
  constructor(props) {
    super(props)
    this.lock = false
    this.state = {}
  }

  componentDidMount() {
    this.refs.markdownButton.focus()
  }

  handleCloseButtonClick(e) {
    this.props.close()
  }

  handleCreateMarkdownFromUrlClick(e) {
    this.props.close()

    const { storage, folder, dispatch, location } = this.props
    openModal(CreateMarkdownFromURLModal, {
      storage: storage,
      folder: folder,
      dispatch,
      location
    })
  }

  handleMarkdownNoteButtonClick(e) {
    const { storage, folder, dispatch, location, config } = this.props
    const params = location.search !== '' && queryString.parse(location.search)
    if (!this.lock) {
      this.lock = true
      createMarkdownNote(
        storage,
        folder,
        dispatch,
        location,
        params,
        config
      ).then(() => {
        setTimeout(this.props.close, 200)
      })
    }
  }

  handleMarkdownNoteButtonKeyDown(e) {
    if (e.keyCode === 9) {
      e.preventDefault()
      this.refs.snippetButton.focus()
    }
  }

  handleSnippetNoteButtonClick(e) {
    const { storage, folder, dispatch, location, config } = this.props
    const params = location.search !== '' && queryString.parse(location.search)
    if (!this.lock) {
      this.lock = true
      createSnippetNote(
        storage,
        folder,
        dispatch,
        location,
        params,
        config
      ).then(() => {
        setTimeout(this.props.close, 200)
      })
    }
  }

  handleSnippetNoteButtonKeyDown(e) {
    if (e.keyCode === 9) {
      e.preventDefault()
      this.refs.markdownButton.focus()
    }
  }

  handleKeyDown(e) {
    if (e.keyCode === 27) {
      this.props.close()
    }
  }

  render() {
    return (
      <div
        styleName='root'
        tabIndex='-1'
        onKeyDown={e => this.handleKeyDown(e)}
      >
        <div styleName='header'>
          <div styleName='title'>{i18n.__('Make a note')}</div>
        </div>
        <ModalEscButton
          handleEscButtonClick={e => this.handleCloseButtonClick(e)}
        />
        <div styleName='control'>
          <button
            styleName='control-button'
            onClick={e => this.handleMarkdownNoteButtonClick(e)}
            onKeyDown={e => this.handleMarkdownNoteButtonKeyDown(e)}
            ref='markdownButton'
          >
            <i styleName='control-button-icon' className='fa fa-file-text-o' />
            <br />
            <span styleName='control-button-label'>
              {i18n.__('Markdown Note')}
            </span>
            <br />
            <span styleName='control-button-description'>
              {i18n.__(
                'This format is for creating text documents. Checklists, code blocks and Latex blocks are available.'
              )}
            </span>
          </button>

          <button
            styleName='control-button'
            onClick={e => this.handleSnippetNoteButtonClick(e)}
            onKeyDown={e => this.handleSnippetNoteButtonKeyDown(e)}
            ref='snippetButton'
          >
            <i styleName='control-button-icon' className='fa fa-code' />
            <br />
            <span styleName='control-button-label'>
              {i18n.__('Snippet Note')}
            </span>
            <br />
            <span styleName='control-button-description'>
              {i18n.__(
                'This format is for creating code snippets. Multiple snippets can be grouped into a single note.'
              )}
            </span>
          </button>
        </div>
        <div styleName='description'>
          <i className='fa fa-arrows-h' />
          {i18n.__('Tab to switch format')}
        </div>
        <div
          styleName='from-url'
          onClick={e => this.handleCreateMarkdownFromUrlClick(e)}
        >
          Or, create a new markdown note from a URL
        </div>
      </div>
    )
  }
}

NewNoteModal.propTypes = {}

export default CSSModules(NewNoteModal, styles)
