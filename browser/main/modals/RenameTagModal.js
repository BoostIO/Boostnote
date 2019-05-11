import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './RenameModal.styl'
import dataApi from 'browser/main/lib/dataApi'
import ModalEscButton from 'browser/components/ModalEscButton'
import i18n from 'browser/lib/i18n'

class RenameTagModal extends React.Component {
  constructor (props) {
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

  componentDidMount () {
    this.nameInput.focus()
    this.nameInput.select()
  }

  handleChange (e) {
    this.setState({
      name: this.nameInput.value
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
        this.handleConfirm()
    }
  }

  handleConfirm () {
    if (this.state.name.trim().length > 0) {
      const { name, oldName } = this.state
      this.renameTag(oldName, name)
    }
  }

  renameTag (tag, updatedTag) {
    const { data, dispatch } = this.props

    const notes = data.noteMap
      .map(note => note)
      .filter(note => note.tags.indexOf(tag) !== -1)
      .map(note => {
        note = Object.assign({}, note)
        note.tags = note.tags.slice()

        note.tags[note.tags.indexOf(tag)] = updatedTag

        return note
      })

    Promise
      .all(notes.map(note => dataApi.updateNote(note.storage, note.key, note)))
      .then(updatedNotes => {
        updatedNotes.forEach(note => {
          dispatch({
            type: 'UPDATE_NOTE',
            note
          })
        })
      })
      .then(() => {
        this.props.close()
      })
  }

  render () {
    const { close } = this.props

    return (
      <div styleName='root'
        tabIndex='-1'
        onKeyDown={(e) => this.handleKeyDown(e)}
      >
        <div styleName='header'>
          <div styleName='title'>{i18n.__('Rename Tag')}</div>
        </div>
        <ModalEscButton handleEscButtonClick={close} />

        <div styleName='control'>
          <input styleName='control-input'
            placeholder={i18n.__('Tag Name')}
            ref={this.setTextInputRef}
            value={this.state.name}
            onChange={this.handleChange}
            onKeyDown={(e) => this.handleInputKeyDown(e)}
          />
          <button styleName='control-confirmButton'
            onClick={() => this.handleConfirm()}
          >
            {i18n.__('Confirm')}
          </button>
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
