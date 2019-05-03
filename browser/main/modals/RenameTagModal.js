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

    this.state = {
      name: props.tagName,
      oldName: props.tagName
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

  confirm () {
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
    return (
      <div styleName='root'
        tabIndex='-1'
        onKeyDown={(e) => this.handleKeyDown(e)}
      >
        <div styleName='header'>
          <div styleName='title'>{i18n.__('Rename Tag')}</div>
        </div>
        <ModalEscButton handleEscButtonClick={(e) => this.handleCloseButtonClick(e)} />

        <div styleName='control'>
          <input styleName='control-input'
            placeholder={i18n.__('Tag Name')}
            ref='name'
            value={this.state.name}
            onChange={(e) => this.handleChange(e)}
            onKeyDown={(e) => this.handleInputKeyDown(e)}
          />
          <button styleName='control-confirmButton'
            onClick={(e) => this.handleConfirmButtonClick(e)}
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
