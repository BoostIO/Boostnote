import _ from 'lodash'

const OSX = global.process.platform === 'darwin'
const electron = require('electron')
const { ipcRenderer } = electron
const consts = require('browser/lib/consts')

let isInitialized = false

export const DEFAULT_CONFIG = {
  zoom: 1,
  isSideNavFolded: false,
  listWidth: 280,
  navWidth: 200,
  sortBy: 'UPDATED_AT', // 'CREATED_AT', 'UPDATED_AT', 'APLHABETICAL'
  listStyle: 'DEFAULT', // 'DEFAULT', 'SMALL'
  hotkey: {
    toggleFinder: OSX ? 'Cmd + Alt + S' : 'Super + Alt + S',
    toggleMain: OSX ? 'Cmd + Alt + L' : 'Super + Alt + E'
  },
  ui: {
    theme: 'default',
    disableDirectWrite: false,
    defaultNote: 'ALWAYS_ASK' // 'ALWAYS_ASK', 'SNIPPET_NOTE', 'MARKDOWN_NOTE'
  },
  editor: {
    theme: 'default',
    keyMap: 'sublime',
    fontSize: '14',
    fontFamily: 'Monaco, Consolas',
    indentType: 'space',
    indentSize: '2',
    switchPreview: 'BLUR' // Available value: RIGHTCLICK, BLUR
  },
  preview: {
    fontSize: '14',
    fontFamily: 'Lato',
    codeBlockTheme: 'elegant',
    lineNumber: true
  }
}

function validate (config) {
  if (!_.isObject(config)) return false
  if (!_.isNumber(config.zoom) || config.zoom < 0) return false
  if (!_.isBoolean(config.isSideNavFolded)) return false
  if (!_.isNumber(config.listWidth) || config.listWidth <= 0) return false

  return true
}

function _save (config) {
  console.log(config)
  window.localStorage.setItem('config', JSON.stringify(config))
}

function get () {
  let config = window.localStorage.getItem('config')

  try {
    config = Object.assign({}, DEFAULT_CONFIG, JSON.parse(config))
    config.hotkey = Object.assign({}, DEFAULT_CONFIG.hotkey, config.hotkey)
    config.ui = Object.assign({}, DEFAULT_CONFIG.ui, config.ui)
    config.editor = Object.assign({}, DEFAULT_CONFIG.editor, config.editor)
    config.preview = Object.assign({}, DEFAULT_CONFIG.preview, config.preview)
    if (!validate(config)) throw new Error('INVALID CONFIG')
  } catch (err) {
    console.warn('Boostnote resets the malformed configuration.')
    config = DEFAULT_CONFIG
    _save(config)
  }

  if (!isInitialized) {
    isInitialized = true
    let editorTheme = document.getElementById('editorTheme')
    if (editorTheme == null) {
      editorTheme = document.createElement('link')
      editorTheme.setAttribute('id', 'editorTheme')
      editorTheme.setAttribute('rel', 'stylesheet')
      document.head.appendChild(editorTheme)
    }

    config.editor.theme = consts.THEMES.some((theme) => theme === config.editor.theme)
      ? config.editor.theme
      : 'default'

    if (config.editor.theme !== 'default') {
      editorTheme.setAttribute('href', '../node_modules/codemirror/theme/' + config.editor.theme + '.css')
    }
  }

  return config
}

function set (updates) {
  let currentConfig = get()
  let newConfig = Object.assign({}, DEFAULT_CONFIG, currentConfig, updates)
  if (!validate(newConfig)) throw new Error('INVALID CONFIG')
  _save(newConfig)

  if (newConfig.ui.theme === 'dark') {
    document.body.setAttribute('data-theme', 'dark')
  } else {
    document.body.setAttribute('data-theme', 'default')
  }

  let editorTheme = document.getElementById('editorTheme')
  if (editorTheme == null) {
    editorTheme = document.createElement('link')
    editorTheme.setAttribute('id', 'editorTheme')
    editorTheme.setAttribute('rel', 'stylesheet')
    document.head.appendChild(editorTheme)
  }
  let newTheme = consts.THEMES.some((theme) => theme === newConfig.editor.theme)
    ? newConfig.editor.theme
    : 'default'

  if (newTheme !== 'default') {
    editorTheme.setAttribute('href', '../node_modules/codemirror/theme/' + newTheme + '.css')
  }

  ipcRenderer.send('config-renew', {
    config: get()
  })
}

export default {
  get,
  set,
  validate
}
