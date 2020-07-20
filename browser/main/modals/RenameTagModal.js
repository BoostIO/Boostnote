import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './RenameModal.styl'
import dataApi from 'browser/main/lib/dataApi'
import ModalEscButton from 'browser/components/ModalEscButton'
import i18n from 'browser/lib/i18n'
import { replace } from 'connected-react-router'
import ee from 'browser/main/lib/eventEmitter'
import { isEmpty } from 'lodash'
import electron from 'electron'

const { remote } = electron
const { dialog } = remote

class RenameTagModal extends React.Component {
  constructor(props) {
    super(props)

    this.nameInput = null

    this.handleChange = this.handleChange.bind(this)

    this.setTextInputRef = el => {
      this.nameInput = el
    }

    this.state = {
      name: props.tagName,
      oldName: props.tagName
    }
  }

  componentDidMount() {
    this.nameInput.focus()
    this.nameInput.select()
  }

  handleChange(e) {
    this.setState({
      name: this.nameInput.value,
      showerror: false,
      errormessage: ''
    })
  }

  handleKeyDown(e) {
    if (e.keyCode === 27) {
      this.props.close()
    }
  }

  handleInputKeyDown(e) {
    switch (e.keyCode) {
      case 13:
        this.handleConfirm()
    }
  }

  handleConfirm() {
    if (this.state.name.trim().length > 0) {
      const { name, oldName } = this.state
      this.renameTag(oldName, name)
    }
  }

  showError(message) {
    this.setState({
      showerror: true,
      errormessage: message
    })
  }

  renameTag(tag, updatedTag) {
    const { data, dispatch } = this.props

    if (tag === updatedTag) {
      // confirm with-out any change - just dismiss the modal
      this.props.close()
      return
    }

    if (
      data.noteMap
        .map(note => note)
        .some(note => note.tags.indexOf(updatedTag) !== -1)
    ) {
      const alertConfig = {
        type: 'warning',
        message: i18n.__('Confirm tag merge'),
        detail: i18n.__(
          `Tag ${tag} will be merged with existing tag ${updatedTag}`
        ),
        buttons: [i18n.__('Confirm'), i18n.__('Cancel')]
      }

      const dialogButtonIndex = dialog.showMessageBox(
        remote.getCurrentWindow(),
        alertConfig
      )

      if (dialogButtonIndex === 1) {
        return // bail early on cancel click
      }
    }

    const notes = data.noteMap
      .map(note => note)
      .filter(
        note => note.tags.indexOf(tag) !== -1 && note.tags.indexOf(updatedTag)
      )
      .map(note => {
        note = Object.assign({}, note)
        note.tags = note.tags.slice()

        note.tags[note.tags.indexOf(tag)] = updatedTag

        return note
      })

    if (isEmpty(notes)) {
      this.showError(i18n.__('Tag exists'))

      return
    }

    Promise.all(
      notes.map(note => dataApi.updateNote(note.storage, note.key, note))
    )
      .then(updatedNotes => {
        updatedNotes.forEach(note => {
          dispatch({
            type: 'UPDATE_NOTE',
            note
          })
        })
      })
      .then(() => {
        if (window.location.hash.includes(tag)) {
          dispatch(replace(`/tags/${updatedTag}`))
        }
        ee.emit('sidebar:rename-tag', { tag, updatedTag })
        this.props.close()
      })
  }

  render() {
    const { close } = this.props
    const { errormessage } = this.state

    return (
      <div
        styleName='root'
        tabIndex='-1'
        onKeyDown={e => this.handleKeyDown(e)}
      >
        <div styleName='header'>
          <div styleName='title'>{i18n.__('Rename Tag')}</div>
        </div>
        <ModalEscButton handleEscButtonClick={close} />

        <div styleName='control'>
          <input
            styleName='control-input'
            placeholder={i18n.__('Tag Name')}
            ref={this.setTextInputRef}
            value={this.state.name}
            onChange={this.handleChange}
            onKeyDown={e => this.handleInputKeyDown(e)}
          />
          <button
            styleName='control-confirmButton'
            onClick={() => this.handleConfirm()}
          >
            {i18n.__('Confirm')}
          </button>
        </div>
        <div className='error' styleName='error'>
          {errormessage}
        </div>
      </div>
    )
  }
}

RenameTagModal.propTypes = {
  storage: PropTypes.shape({
    key: PropTypes.string
  }),
  folder: PropTypes.shape({
    key: PropTypes.string,
    name: PropTypes.string
  })
}

export default CSSModules(RenameTagModal, styles)
