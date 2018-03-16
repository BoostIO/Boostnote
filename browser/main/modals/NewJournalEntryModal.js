import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './NewNoteModal.styl'
import dataApi from 'browser/main/lib/dataApi'
import { hashHistory } from 'react-router'
import ee from 'browser/main/lib/eventEmitter'
import ModalEscButton from 'browser/components/ModalEscButton'
import AwsMobileAnalyticsConfig from 'browser/main/lib/AwsMobileAnalyticsConfig'
import DayPicker from 'browser/components/DayPicker.js'
import moment from 'moment'

class NewJournalEntryModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      selectedDate: new Date()
    }
  }

  componentDidMount () {
    this.refs.rootDiv.focus()
  }

  handleCloseButtonClick (e) {
    this.props.close()
  }

  handleDayClick (targetDate) {
    // const JOURNAL_TITLE = targetDate.toDateString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const JOURNAL_TITLE = targetDate.format('ddd MMM D YYYY')
    AwsMobileAnalyticsConfig.recordDynamicCustomEvent('ADD_MARKDOWN')
    AwsMobileAnalyticsConfig.recordDynamicCustomEvent('ADD_ALLNOTE')
    const { storage, folder, dispatch, location, folderNoteMap, noteMap } = this.props
    const notesInSameFolder = folderNoteMap.get(storage + '-' + folder)
    let noteFoundOnThisDate // TODO: and not in trash
    if (notesInSameFolder) {
      for (const uniqueKey of notesInSameFolder) {
        const note = noteMap.get(uniqueKey)
        const theDate = moment(note.journaledAt)
        if (theDate.year() === targetDate.year() &&
          theDate.month() === targetDate.month() &&
          theDate.date() === targetDate.date() && (!note.isTrashed)
        ) {
          noteFoundOnThisDate = uniqueKey
          break
        }
      }
    }
    if (noteFoundOnThisDate) {
      const note = noteMap.get(noteFoundOnThisDate)
      ee.emit('list:jump', `${note.storage}-${note.key}`)
      ee.emit('detail:focus')
    } else {
      dataApi
      .createNote(storage, {
        type: 'MARKDOWN_NOTE',
        folder: folder,
        title: JOURNAL_TITLE,
        content: '# ' + JOURNAL_TITLE,
        journaledAt: targetDate
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
      })
    }
    this.props.close()
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
        ref='rootDiv'
      >
        <div styleName='header'> <div styleName='title'>Pick a date</div> </div>
        <ModalEscButton handleEscButtonClick={(e) => this.handleCloseButtonClick(e)} />
        <DayPicker
          onDayClick={(d) => { this.handleDayClick(d) }}
          />
      </div>
    )
  }
}

NewJournalEntryModal.propTypes = {
}

export default CSSModules(NewJournalEntryModal, styles)
