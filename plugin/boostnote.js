import eventEmitter from 'browser/main/lib/eventEmitter'

module.exports =
class Boostnote {
  constructor() {
    this.currentNote = ''
    this.document = window.document
    this.eventEmitter = eventEmitter
    this.CodeMirror = window.CodeMirror
  }

  nextNote () {
    eventEmitter.emit('list:next')
  }

  focusNote () {
    eventEmitter.emit('detail:focus')
  }

  setCurrentNote (note) {
    this.currentNote = note
  }

  onNoteUpdated (func) {
    eventEmitter.emit('note-updated', func)
  }
}
