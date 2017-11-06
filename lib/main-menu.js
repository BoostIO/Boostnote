const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const shell = electron.shell
const mainWindow = require('./main-window')

const macOS = process.platform === 'darwin'
// const WIN = process.platform === 'win32'
const LINUX = process.platform === 'linux'

const boost = macOS
  ? {
    label: 'Boostnote',
    submenu: [
      {
        label: 'About Boostnote',
        selector: 'orderFrontStandardAboutPanel:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide Boostnote',
        accelerator: 'Command+H',
        selector: 'hide:'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:'
      },
      {
        label: 'Show All',
        selector: 'unhideAllApplications:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit Boostnote',
        role: 'quit',
        accelerator: 'CommandOrControl+Q'
      }
    ]
  }
  : {
    label: 'Boostnote',
    submenu: [
      {
        role: 'quit',
        accelerator: 'Control+Q'
      }
    ]
  }

const file = {
  label: 'File',
  submenu: [
    {
      label: 'New Note',
      accelerator: 'CommandOrControl+N',
      click () {
        mainWindow.webContents.send('top:new-note')
      }
    },
    {
      label: 'Focus Note',
      accelerator: 'Control+E',
      click () {
        mainWindow.webContents.send('detail:focus')
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Export as',
      submenu: [
        {
          label: 'Plain Text (.txt)',
          click () {
            mainWindow.webContents.send('list:isMarkdownNote')
            mainWindow.webContents.send('export:save-text')
          }
        },
        {
          label: 'MarkDown (.md)',
          click () {
            mainWindow.webContents.send('list:isMarkdownNote')
            mainWindow.webContents.send('export:save-md')
          }
        }
      ]
    },
    {
      type: 'separator'
    },
    {
      label: 'Import from',
      submenu: [
        {
          label: 'Plain Text, MarkDown (.txt, .md)',
          click () {
            mainWindow.webContents.send('import:file')
          }
        }
      ]
    },
    {
      type: 'separator'
    },
    {
      label: 'Print',
      accelerator: 'CommandOrControl+P',
      click () {
        mainWindow.webContents.send('list:isMarkdownNote')
        mainWindow.webContents.send('print')
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete Note',
      accelerator: macOS ? 'Control+Backspace' : 'Control+Delete',
      click () {
        mainWindow.webContents.send('detail:delete')
      }
    }
  ]
}

if (LINUX) {
  file.submenu.push({
    type: 'separator'
  }, {
    role: 'quit',
    accelerator: 'Control+Q'
  })
}

const edit = {
  label: 'Edit',
  submenu: [
    {
      label: 'Undo',
      accelerator: 'Command+Z',
      selector: 'undo:'
    },
    {
      label: 'Redo',
      accelerator: 'Shift+Command+Z',
      selector: 'redo:'
    },
    {
      type: 'separator'
    },
    {
      label: 'Cut',
      accelerator: 'Command+X',
      selector: 'cut:'
    },
    {
      label: 'Copy',
      accelerator: 'Command+C',
      selector: 'copy:'
    },
    {
      label: 'Paste',
      accelerator: 'Command+V',
      selector: 'paste:'
    },
    {
      label: 'Select All',
      accelerator: 'Command+A',
      selector: 'selectAll:'
    }
  ]
}

const view = {
  label: 'View',
  submenu: [
    {
      label: 'Reload',
      accelerator: 'CommandOrControl+R',
      click () {
        BrowserWindow.getFocusedWindow().reload()
      }
    },
    {
      label: 'Toggle Developer Tools',
      accelerator: macOS ? 'Command+Alt+I' : 'Control+Shift+I',
      click () {
        BrowserWindow.getFocusedWindow().toggleDevTools()
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Next Note',
      accelerator: 'Control+J',
      click () {
        mainWindow.webContents.send('list:next')
      }
    },
    {
      label: 'Previous Note',
      accelerator: 'Control+K',
      click () {
        mainWindow.webContents.send('list:prior')
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Focus Search',
      accelerator: 'Control+S',
      click () {
        mainWindow.webContents.send('top:focus-search')
      }
    }
  ]
}

const window = {
  label: 'Window',
  submenu: [
    {
      label: 'Minimize',
      accelerator: 'Command+M',
      selector: 'performMiniaturize:'
    },
    {
      label: 'Close',
      accelerator: 'Command+W',
      selector: 'performClose:'
    },
    {
      type: 'separator'
    },
    {
      label: 'Bring All to Front',
      selector: 'arrangeInFront:'
    }
  ]
}

const help = {
  label: 'Help',
  role: 'help',
  submenu: [
    {
      label: 'Boostnote official site',
      click () { shell.openExternal('https://boostnote.io/') }
    },
    {
      label: 'Issue Tracker',
      click () { shell.openExternal('https://github.com/BoostIO/Boostnote/issues') }
    },
    {
      label: 'Changelog',
      click () { shell.openExternal('https://github.com/BoostIO/boost-releases') }
    }
  ]
}

module.exports = process.platform === 'darwin'
  ? [boost, file, edit, view, window, help]
  : process.platform === 'win32'
  ? [boost, file, view, help]
  : [file, view, help]
