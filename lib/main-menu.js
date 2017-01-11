const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const shell = electron.shell
const mainWindow = require('./main-window')

const OSX = process.platform === 'darwin'
// const WIN = process.platform === 'win32'
const LINUX = process.platform === 'linux'

var boost = OSX
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
        role: 'quit'
      }
    ]
  }
  : {
    label: 'Boostnote',
    submenu: [
      {
        role: 'quit'
      }
    ]
  }

var file = {
  label: 'File',
  submenu: [
    {
      label: 'New Note',
      accelerator: 'CmdOrCtrl + N',
      click: function () {
        mainWindow.webContents.send('top:new-note')
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete Note',
      accelerator: OSX ? 'Control + Backspace' : 'Control + Delete',
      click: function () {
        mainWindow.webContents.send('detail:delete')
      }
    }
  ]
}

if (LINUX) {
  file.submenu.push({
    type: 'separator'
  })
  file.submenu.push({
    role: 'quit'
  })
}

var edit = {
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

var view = {
  label: 'View',
  submenu: [
    {
      label: 'Reload',
      accelerator: 'CmdOrCtrl+R',
      click: function () {
        BrowserWindow.getFocusedWindow().reload()
      }
    },
    {
      label: 'Toggle Developer Tools',
      accelerator: OSX ? 'Command+Alt+I' : 'Ctrl+Shift+I',
      click: function () {
        BrowserWindow.getFocusedWindow().toggleDevTools()
      }
    }
  ]
}

var window = {
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

var help = {
  label: 'Help',
  role: 'help',
  submenu: [
    {
      label: 'Boostnote official site',
      click: function () { shell.openExternal('https://b00st.io/') }
    },
    {
      label: 'Issue Tracker',
      click: function () { shell.openExternal('https://github.com/BoostIO/Boostnote/issues') }
    },
    {
      label: 'Changelog',
      click: function () { shell.openExternal('https://github.com/BoostIO/boost-releases') }
    }
  ]
}

module.exports = process.platform === 'darwin'
  ? [boost, file, edit, view, window, help]
  : process.platform === 'win32'
  ? [boost, file, view, help]
  : [file, view, help]
