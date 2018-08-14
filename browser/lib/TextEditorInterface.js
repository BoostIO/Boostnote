import { Point } from '@susisu/mte-kernel'

export default class TextEditorInterface {
  constructor (editor) {
    this.editor = editor
  }

  getCursorPosition () {
    const pos = this.editor.getCursor()
    return new Point(pos.line, pos.ch)
  }

  setCursorPosition (pos) {
    this.editor.setCursor({line: pos.row, ch: pos.column})
  }

  setSelectionRange (range) {
    this.editor.setSelection({
      anchor: {line: range.start.row, ch: range.start.column},
      head: {line: range.end.row, ch: range.end.column}
    })
  }

  getLastRow () {
    return this.editor.lastLine()
  }

  acceptsTableEdit (row) {
    return true
  }

  getLine (row) {
    return this.editor.getLine(row)
  }

  insertLine (row, line) {
    this.editor.replaceRange(line, {line: row, ch: 0})
  }

  deleteLine (row) {
    this.editor.replaceRange('', {line: row, ch: 0}, {line: row, ch: this.editor.getLine(row).length})
  }

  replaceLines (startRow, endRow, lines) {
    endRow-- // because endRow is a first line after a table.
    const endRowCh = this.editor.getLine(endRow).length
    this.editor.replaceRange(lines, {line: startRow, ch: 0}, {line: endRow, ch: endRowCh})
  }

  transact (func) {
    func()
  }
}
