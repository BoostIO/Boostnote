import _ from 'lodash'
import RcParser from 'browser/lib/RcParser'
import i18n from 'browser/lib/i18n'
import ee from 'browser/main/lib/eventEmitter'

const OSX = global.process.platform === 'darwin'
const win = global.process.platform === 'win32'
const electron = require('electron')
const { ipcRenderer } = electron
const consts = require('browser/lib/consts')

let isInitialized = false

export const DEFAULT_CONFIG = {
  zoom: 1,
  isSideNavFolded: false,
  listWidth: 280,
  navWidth: 200,
  sortBy: {
    default: 'UPDATED_AT' // 'CREATED_AT', 'UPDATED_AT', 'APLHABETICAL'
  },
  sortTagsBy: 'ALPHABETICAL', // 'ALPHABETICAL', 'COUNTER'
  listStyle: 'DEFAULT', // 'DEFAULT', 'SMALL'
  amaEnabled: true,
  hotkey: {
    toggleMain: OSX ? 'Command + Alt + L' : 'Super + Alt + E',
    toggleMode: OSX ? 'Command + Alt + M' : 'Ctrl + M',
    deleteNote: OSX ? 'Command + Shift + Backspace' : 'Ctrl + Shift + Backspace',
    pasteSmartly: OSX ? 'Command + Shift + V' : 'Ctrl + Shift + V',
    toggleMenuBar: 'Alt'
  },
  ui: {
    language: 'en',
    theme: 'default',
    showCopyNotification: true,
    disableDirectWrite: false,
    defaultNote: 'ALWAYS_ASK', // 'ALWAYS_ASK', 'SNIPPET_NOTE', 'MARKDOWN_NOTE'
    showMenuBar: false
  },
  editor: {
    theme: 'base16-light',
    keyMap: 'sublime',
    fontSize: '14',
    fontFamily: win ? 'Consolas' : 'Monaco',
    indentType: 'space',
    indentSize: '2',
    enableRulers: false,
    rulers: [80, 120],
    displayLineNumbers: true,
    matchingPairs: '()[]{}\'\'""$$**``',
    matchingTriples: '```"""\'\'\'',
    explodingPairs: '[]{}``$$',
    switchPreview: 'BLUR', // 'BLUR', 'DBL_CLICK', 'RIGHTCLICK'
    delfaultStatus: 'PREVIEW', // 'PREVIEW', 'CODE'
    scrollPastEnd: false,
    type: 'SPLIT', // 'SPLIT', 'EDITOR_PREVIEW'
    fetchUrlTitle: true,
    enableTableEditor: false,
    enableFrontMatterTitle: true,
    frontMatterTitleField: 'title',
    spellcheck: false,
    enableSmartPaste: false
  },
  preview: {
    fontSize: '14',
    fontFamily: win ? 'Segoe UI' : 'Lato',
    codeBlockTheme: 'dracula',
    lineNumber: true,
    latexInlineOpen: '$',
    latexInlineClose: '$',
    latexBlockOpen: '$$',
    latexBlockClose: '$$',
    plantUMLServerAddress: 'http://www.plantuml.com/plantuml',
    scrollPastEnd: false,
    scrollSync: true,
    smartQuotes: true,
    breaks: true,
    smartArrows: false,
    allowCustomCSS: false,
    customCSS: '',
    sanitize: 'STRICT', // 'STRICT', 'ALLOW_STYLES', 'NONE'
    lineThroughCheckbox: true
  },
  blog: {
    type: 'wordpress', // Available value: wordpress, add more types in the future plz
    address: 'http://wordpress.com/wp-json',
    authMethod: 'JWT', // Available value: JWT, USER
    token: '',
    username: '',
    password: ''
  },
  githubGists: {
    clientID: '',
    clientSecret: '',
    loggedInUserToken: ''
  },
  coloredTags: {}
}

function validate (config) {
  if (!_.isObject(config)) return false
  if (!_.isNumber(config.zoom) || config.zoom < 0) return false
  if (!_.isBoolean(config.isSideNavFolded)) return false
  if (!_.isNumber(config.listWidth) || config.listWidth <= 0) return false

  return true
}

function _save (config) {
  window.localStorage.setItem('config', JSON.stringify(config))
}

function get () {
  const rawStoredConfig = window.localStorage.getItem('config')
  const storedConfig = Object.assign({}, DEFAULT_CONFIG, JSON.parse(rawStoredConfig))
  let config = storedConfig

  try {
    const boostnotercConfig = RcParser.parse()
    config = assignConfigValues(storedConfig, boostnotercConfig)

    if (!validate(config)) throw new Error('INVALID CONFIG')
  } catch (err) {
    console.warn('Boostnote resets the invalid configuration.')
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
      if (config.editor.theme.startsWith('solarized')) {
        editorTheme.setAttribute('href', '../node_modules/codemirror/theme/solarized.css')
      } else {
        editorTheme.setAttribute('href', '../node_modules/codemirror/theme/' + config.editor.theme + '.css')
      }
    }
  }

  return config
}

function set (updates) {
  const currentConfig = get()
  const newConfig = Object.assign({}, DEFAULT_CONFIG, currentConfig, updates)
  if (!validate(newConfig)) throw new Error('INVALID CONFIG')
  _save(newConfig)

  if (newConfig.ui.theme === 'dark') {
    document.body.setAttribute('data-theme', 'dark')
  } else if (newConfig.ui.theme === 'white') {
    document.body.setAttribute('data-theme', 'white')
  } else if (newConfig.ui.theme === 'solarized-dark') {
    document.body.setAttribute('data-theme', 'solarized-dark')
  } else if (newConfig.ui.theme === 'monokai') {
    document.body.setAttribute('data-theme', 'monokai')
  } else if (newConfig.ui.theme === 'dracula') {
    document.body.setAttribute('data-theme', 'dracula')
  } else {
    document.body.setAttribute('data-theme', 'default')
  }

  i18n.setLocale(newConfig.ui.language)

  let editorTheme = document.getElementById('editorTheme')
  if (editorTheme == null) {
    editorTheme = document.createElement('link')
    editorTheme.setAttribute('id', 'editorTheme')
    editorTheme.setAttribute('rel', 'stylesheet')
    document.head.appendChild(editorTheme)
  }
  const newTheme = consts.THEMES.some((theme) => theme === newConfig.editor.theme)
    ? newConfig.editor.theme
    : 'default'

  if (newTheme !== 'default') {
    if (newTheme.startsWith('solarized')) {
      editorTheme.setAttribute('href', '../node_modules/codemirror/theme/solarized.css')
    } else {
      editorTheme.setAttribute('href', '../node_modules/codemirror/theme/' + newTheme + '.css')
    }
  }

  ipcRenderer.send('config-renew', {
    config: get()
  })
  ee.emit('config-renew')
}

function assignConfigValues (originalConfig, rcConfig) {
  const config = Object.assign({}, DEFAULT_CONFIG, originalConfig, rcConfig)
  config.hotkey = Object.assign({}, DEFAULT_CONFIG.hotkey, originalConfig.hotkey, rcConfig.hotkey)
  config.blog = Object.assign({}, DEFAULT_CONFIG.blog, originalConfig.blog, rcConfig.blog)
  config.ui = Object.assign({}, DEFAULT_CONFIG.ui, originalConfig.ui, rcConfig.ui)
  config.editor = Object.assign({}, DEFAULT_CONFIG.editor, originalConfig.editor, rcConfig.editor)
  config.preview = Object.assign({}, DEFAULT_CONFIG.preview, originalConfig.preview, rcConfig.preview)

  rewriteHotkey(config)

  return config
}

function rewriteHotkey (config) {
  const keys = [...Object.keys(config.hotkey)]
  keys.forEach(key => {
    config.hotkey[key] = config.hotkey[key].replace(/Cmd\s/g, 'Command ')
    config.hotkey[key] = config.hotkey[key].replace(/Opt\s/g, 'Option ')
  })
  return config
}

export default {
  get,
  set,
  validate
}
