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
        label: '关于 Boostnote',
        selector: 'orderFrontStandardAboutPanel:'
      },
      {
        type: 'separator'
      },
      {
        label: '隐藏 Boostnote',
        accelerator: 'Command+H',
        selector: 'hide:'
      },
      {
        label: '隐藏其他',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:'
      },
      {
        label: '显示所有',
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
  label: '文件',
  submenu: [
    {
      label: '新笔记',
      accelerator: 'CmdOrCtrl + N',
      click: function () {
        mainWindow.webContents.send('top:new-note')
      }
    },
    {
      label: '当前笔记',
      accelerator: 'Control + E',
      click () {
        mainWindow.webContents.send('detail:focus')
      }
    },
    {
      type: 'separator'
    },
    {
      label: '导出为',
      submenu: [
        {
          label: '纯文本 (.txt)',
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
      label: '删除笔记',
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
  label: '编辑',
  submenu: [
    {
      label: '撤销',
      accelerator: 'Command+Z',
      selector: 'undo:'
    },
    {
      label: '恢复',
      accelerator: 'Shift+Command+Z',
      selector: 'redo:'
    },
    {
      type: 'separator'
    },
    {
      label: '剪切',
      accelerator: 'Command+X',
      selector: 'cut:'
    },
    {
      label: '复制',
      accelerator: 'Command+C',
      selector: 'copy:'
    },
    {
      label: '粘贴',
      accelerator: 'Command+V',
      selector: 'paste:'
    },
    {
      label: '全选',
      accelerator: 'Command+A',
      selector: 'selectAll:'
    }
  ]
}

var view = {
  label: '视图',
  submenu: [
    {
      label: '重加载',
      accelerator: 'CmdOrCtrl+R',
      click: function () {
        BrowserWindow.getFocusedWindow().reload()
      }
    },
    {
      label: '开发者工具',
      accelerator: OSX ? 'Command+Alt+I' : 'Ctrl+Shift+I',
      click: function () {
        BrowserWindow.getFocusedWindow().toggleDevTools()
      }
    },
    {
      type: 'separator'
    },
    {
      label: '下一个笔记',
      accelerator: 'Control + J',
      click () {
        mainWindow.webContents.send('list:next')
      }
    },
    {
      label: '上一个笔记',
      accelerator: 'Control + U',
      click () {
        mainWindow.webContents.send('list:prior')
      }
    },
    {
      label: '返回顶部',
      accelerator: 'Control + G',
      click () {
        mainWindow.webContents.send('list:jumpToTop')
      }
    },
    {
      type: 'separator'
    },
    {
      label: '搜索',
      accelerator: 'Control + S',
      click () {
        mainWindow.webContents.send('top:focus-search')
      }
    }
  ]
}

var window = {
  label: 'Window',
  submenu: [
    {
      label: '最小化',
      accelerator: 'Command+M',
      selector: 'performMiniaturize:'
    },
    {
      label: '关闭',
      accelerator: 'Command+W',
      selector: 'performClose:'
    },
    {
      type: 'separator'
    },
    {
      label: '置顶',
      selector: 'arrangeInFront:'
    }
  ]
}

var help = {
  label: '帮助',
  role: 'help',
  submenu: [
    {
      label: 'Boostnote 官网',
      click: function () { shell.openExternal('https://boostnote.io/') }
    },
    {
      label: '问题跟踪',
      click: function () { shell.openExternal('https://github.com/BoostIO/Boostnote/issues') }
    },
    {
      label: '更新日志',
      click: function () { shell.openExternal('https://github.com/BoostIO/boost-releases') }
    }
  ]
}

module.exports = process.platform === 'darwin'
  ? [boost, file, edit, view, window, help]
  : process.platform === 'win32'
  ? [boost, file, view, help]
  : [file, view, help]
