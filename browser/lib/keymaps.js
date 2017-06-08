class CMMarkDownMap {
  constructor (keymap) {
    this.keymap = keymap
  }

  insertAround (doc, start, end) {
    const cursor = doc.getCursor()
    if (doc.somethingSelected()) {
      const selection = doc.getSelection()
      doc.replaceSelection(start + selection + end)
    } else {
      // If no selection then insert start and end args and set cursor position between the two.
      doc.replaceRange(start + end, { line: cursor.line, ch: cursor.ch })
      doc.setCursor({ line: cursor.line, ch: cursor.ch + start.length })
    }
  }

  insertBefore (doc, insertion, cursorOffset) {
    const cursor = doc.getCursor()

    if (doc.somethingSelected()) {
      var selections = doc.listSelections()
      selections.forEach((selection) => {
        var pos = [selection.head.line, selection.anchor.line].sort()

        for (var i = pos[0]; i <= pos[1]; i++) {
          doc.replaceRange(insertion, { line: i, ch: 0 })
        }

        doc.setCursor({ line: pos[0], ch: cursorOffset || 0 })
      })
    } else {
      doc.replaceRange(insertion, { line: cursor.line, ch: 0 })
      doc.setCursor({ line: cursor.line, ch: cursorOffset || 0 })
    }
  }

  getActionHandlers () {
    return {
      'bold': (cm) => {
        this.insertAround(cm, '**', '**')
      },
      'italicize': (cm) => {
        this.insertAround(cm, '*', '*')
      },
      'blockquote': (cm) => {
        this.insertBefore(cm, '>', '2')
      },
      'orderedlist': (cm) => {
        this.insertBefore(cm, '1. ', 3)
      },
      'unorderedlist': (cm) => {
        this.insertBefore(cm, '* ', 2)
      },
      'hr': (cm) => {
        const cursor = cm.getCursor()
        cm.replaceRange('---', { line: cursor.line, ch: cursor.ch })
      },
      'link': (cm) => {
        this.insertAround(cm, '[', '](http://)')
      }
    }
  }

  markdownKeys () {
    const action = this.keymap
    const actionHandlers = this.getActionHandlers()
    const keymap = {}

    for (const name in actionHandlers) {
      keymap[action[name]] = actionHandlers[name]
    }
    return keymap
  }
}

const keymap = {
  'bold': 'Ctrl-B',
  'italicize': 'Ctrl-I',
  'blockquote': 'Ctrl-\'',
  'orderedlist': 'Ctrl-,',
  'unorderedlist': 'Ctrl-.',
  'hr': 'Ctrl-H',
  'link': 'Ctrl-K'
}

const markdownKeys = new CMMarkDownMap(keymap)
export default markdownKeys
