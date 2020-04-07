const { TouchBar } = require('electron')
const { TouchBarButton, TouchBarSpacer } = TouchBar
const mainWindow = require('./main-window')

const allNotes = new TouchBarButton({
  label: '📒',
  click: () => {
    mainWindow.webContents.send('list:navigate', '/home')
  }
})

const starredNotes = new TouchBarButton({
  label: '⭐️',
  click: () => {
    mainWindow.webContents.send('list:navigate', '/starred')
  }
})

const trash = new TouchBarButton({
  label: '🗑',
  click: () => {
    mainWindow.webContents.send('list:navigate', '/trashed')
  }
})

const newNote = new TouchBarButton({
  label: '✎',
  click: () => {
    mainWindow.webContents.send('list:navigate', '/home')
    mainWindow.webContents.send('top:new-note')
  }
})

module.exports = new TouchBar([
  allNotes,
  starredNotes,
  trash,
  new TouchBarSpacer({ size: 'small' }),
  newNote
])
