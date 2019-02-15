const path = require('path')
const fs = require('sander')
const { remote } = require('electron')
const { app } = remote

const isProduction = process.env.NODE_ENV === 'production'
const paths = [
  isProduction ? path.join(app.getAppPath(), './node_modules/codemirror/theme') : path.resolve('./node_modules/codemirror/theme'),
  isProduction ? path.join(app.getAppPath(), './extra_scripts/codemirror/theme') : path.resolve('./extra_scripts/codemirror/theme')
]

const themes = paths
  .map(directory => fs.readdirSync(directory).map(file => {
    const name = file.substring(0, file.lastIndexOf('.'))

    return {
      name,
      path: path.join(directory.split(/\//g).slice(-3).join('/'), file),
      className: `cm-s-${name}`
    }
  }))
  .reduce((accumulator, value) => accumulator.concat(value), [])
  .sort((a, b) => a.name.localeCompare(b.name))

themes.splice(themes.findIndex(({ name }) => name === 'solarized'), 1, {
  name: 'solarized dark',
  path: 'node_modules/codemirror/theme/solarized.css',
  className: `cm-s-solarized cm-s-dark`
}, {
  name: 'solarized light',
  path: 'node_modules/codemirror/theme/solarized.css',
  className: `cm-s-solarized cm-s-light`
})

themes.splice(0, 0, {
  name: 'default',
  path: '/node_modules/codemirror/theme/elegant.css',
  className: `cm-s-default`
})

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
  THEMES: themes,
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
