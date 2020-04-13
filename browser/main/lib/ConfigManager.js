import _ from 'lodash'
import RcParser from 'browser/lib/RcParser'
import i18n from 'browser/lib/i18n'
import ee from 'browser/main/lib/eventEmitter'

const OSX = global.process.platform === 'darwin'
const win = global.process.platform === 'win32'
const electron = require('electron')
const { ipcRenderer } = electron
const consts = require('browser/lib/consts')
const electronConfig = new (require('electron-config'))()

let isInitialized = false

const DEFAULT_MARKDOWN_LINT_CONFIG = `{
  "default": true
}`

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
  listDirection: 'ASCENDING', // 'ASCENDING', 'DESCENDING'
  amaEnabled: true,
  autoUpdateEnabled: true,
  hotkey: {
    toggleMain: OSX ? 'Command + Alt + L' : 'Super + Alt + E',
    toggleMode: OSX ? 'Command + Alt + M' : 'Ctrl + M',
    toggleDirection: OSX ? 'Command + Alt + Right' : 'Ctrl + Alt + Right',
    deleteNote: OSX
      ? 'Command + Shift + Backspace'
      : 'Ctrl + Shift + Backspace',
    pasteSmartly: OSX ? 'Command + Shift + V' : 'Ctrl + Shift + V',
    prettifyMarkdown: OSX ? 'Command + Shift + F' : 'Ctrl + Shift + F',
    sortLines: OSX ? 'Command + Shift + S' : 'Ctrl + Shift + S',
    insertDate: OSX ? 'Command + /' : 'Ctrl + /',
    insertDateTime: OSX ? 'Command + Alt + /' : 'Ctrl + Shift + /',
    toggleMenuBar: 'Alt'
  },
  ui: {
    language: 'en',
    theme: 'default',
    defaultTheme: 'default',
    enableScheduleTheme: false,
    scheduledTheme: 'monokai',
    scheduleStart: 1200,
    scheduleEnd: 360,
    showCopyNotification: true,
    disableDirectWrite: false,
    showScrollBar: true,
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
    lineWrapping: true,
    enableRulers: false,
    rulers: [80, 120],
    displayLineNumbers: true,
    matchingPairs: '()[]{}\'\'""$$**``~~__',
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
    enableSmartPaste: false,
    enableMarkdownLint: false,
    customMarkdownLintConfig: DEFAULT_MARKDOWN_LINT_CONFIG,
    prettierConfig: ` {
      "trailingComma": "es5",
      "tabWidth": 2,
      "semi": false,
      "singleQuote": true
    }`,
    deleteUnusedAttachments: true,
    rtlEnabled: false
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

    customCSS: '/* Drop Your Custom CSS Code Here */',
    sanitize: 'STRICT', // 'STRICT', 'ALLOW_STYLES', 'NONE'
    mermaidHTMLLabel: false,
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
  coloredTags: {}
}

function validate(config) {
  if (!_.isObject(config)) return false
  if (!_.isNumber(config.zoom) || config.zoom < 0) return false
  if (!_.isBoolean(config.isSideNavFolded)) return false
  if (!_.isNumber(config.listWidth) || config.listWidth <= 0) return false

  return true
}

function _save(config) {
  window.localStorage.setItem('config', JSON.stringify(config))
}

function get() {
  const rawStoredConfig = window.localStorage.getItem('config')
  const storedConfig = Object.assign(
    {},
    DEFAULT_CONFIG,
    JSON.parse(rawStoredConfig)
  )
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

  config.autoUpdateEnabled = electronConfig.get(
    'autoUpdateEnabled',
    config.autoUpdateEnabled
  )

  if (!isInitialized) {
    isInitialized = true
    let editorTheme = document.getElementById('editorTheme')
    if (editorTheme == null) {
      editorTheme = document.createElement('link')
      editorTheme.setAttribute('id', 'editorTheme')
      editorTheme.setAttribute('rel', 'stylesheet')
      document.head.appendChild(editorTheme)
    }

    const theme = consts.THEMES.find(
      theme => theme.name === config.editor.theme
    )

    if (theme) {
      editorTheme.setAttribute('href', theme.path)
    } else {
      config.editor.theme = 'default'
    }
  }

  return config
}

function set(updates) {
  const currentConfig = get()

  const arrangedUpdates = updates
  if (updates.preview !== undefined && updates.preview.customCSS === '') {
    arrangedUpdates.preview.customCSS = DEFAULT_CONFIG.preview.customCSS
  }

  const newConfig = Object.assign(
    {},
    DEFAULT_CONFIG,
    currentConfig,
    arrangedUpdates
  )
  if (!validate(newConfig)) throw new Error('INVALID CONFIG')
  _save(newConfig)

  i18n.setLocale(newConfig.ui.language)

  let editorTheme = document.getElementById('editorTheme')
  if (editorTheme == null) {
    editorTheme = document.createElement('link')
    editorTheme.setAttribute('id', 'editorTheme')
    editorTheme.setAttribute('rel', 'stylesheet')
    document.head.appendChild(editorTheme)
  }

  const newTheme = consts.THEMES.find(
    theme => theme.name === newConfig.editor.theme
  )

  if (newTheme) {
    editorTheme.setAttribute('href', newTheme.path)
  }

  electronConfig.set('autoUpdateEnabled', newConfig.autoUpdateEnabled)

  ipcRenderer.send('config-renew', {
    config: get()
  })
  ee.emit('config-renew')
}

function assignConfigValues(originalConfig, rcConfig) {
  const config = Object.assign({}, DEFAULT_CONFIG, originalConfig, rcConfig)
  config.hotkey = Object.assign(
    {},
    DEFAULT_CONFIG.hotkey,
    originalConfig.hotkey,
    rcConfig.hotkey
  )
  config.blog = Object.assign(
    {},
    DEFAULT_CONFIG.blog,
    originalConfig.blog,
    rcConfig.blog
  )
  config.ui = Object.assign(
    {},
    DEFAULT_CONFIG.ui,
    originalConfig.ui,
    rcConfig.ui
  )
  config.editor = Object.assign(
    {},
    DEFAULT_CONFIG.editor,
    originalConfig.editor,
    rcConfig.editor
  )
  config.preview = Object.assign(
    {},
    DEFAULT_CONFIG.preview,
    originalConfig.preview,
    rcConfig.preview
  )

  rewriteHotkey(config)

  return config
}

function rewriteHotkey(config) {
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
