const path = require('path')
const fs = require('sander')
const { remote } = require('electron')
const { app } = remote

const themePath = process.env.NODE_ENV === 'production'
  ? path.join(app.getAppPath(), './node_modules/codemirror/theme')
  : require('path').resolve('./node_modules/codemirror/theme')
const themes = fs.readdirSync(themePath)
  .map((themePath) => {
    return themePath.substring(0, themePath.lastIndexOf('.'))
  })
themes.splice(themes.indexOf('solarized'), 1, 'solarized dark', 'solarized light')

const snippetFile = process.env.NODE_ENV !== 'test'
  ? path.join(app.getPath('userData'), 'snippets.json')
  : '' // return nothing as we specified different path to snippets.json in test

const consts = {
  FOLDER_COLORS: [
    '#E10051',
    '#FF8E00',
    '#E8D252',
    '#3FD941',
    '#30D5C8',
    '#2BA5F7',
    '#B013A4'
  ],
  FOLDER_COLOR_NAMES: [
    'Razzmatazz (Red)',
    'Pizazz (Orange)',
    'Confetti (Yellow)',
    'Emerald (Green)',
    'Turquoise',
    'Dodger Blue',
    'Violet Eggplant'
  ],
  THEMES: ['default'].concat(themes),
  SNIPPET_FILE: snippetFile,
  DEFAULT_EDITOR_FONT_FAMILY: [
    'Monaco',
    'Menlo',
    'Ubuntu Mono',
    'Consolas',
    'source-code-pro',
    'monospace'
  ]
}

module.exports = consts
