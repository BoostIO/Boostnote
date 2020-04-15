import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import Markdown from 'browser/lib/markdown'
import _ from 'lodash'
import CodeMirror from 'codemirror'
import 'codemirror-mode-elixir'
import consts from 'browser/lib/consts'
import Raphael from 'raphael'
import flowchart from 'flowchart'
import mermaidRender from './render/MermaidRender'
import SequenceDiagram from '@rokt33r/js-sequence-diagrams'
import Chart from 'chart.js'
import eventEmitter from 'browser/main/lib/eventEmitter'
import config from 'browser/main/lib/ConfigManager'
import htmlTextHelper from 'browser/lib/htmlTextHelper'
import convertModeName from 'browser/lib/convertModeName'
import copy from 'copy-to-clipboard'
import mdurl from 'mdurl'
import exportNote from 'browser/main/lib/dataApi/exportNote'
import { escapeHtmlCharacters } from 'browser/lib/utils'
import yaml from 'js-yaml'
import { render } from 'react-dom'
import Carousel from 'react-image-carousel'
import { push } from 'connected-react-router'
import ConfigManager from '../main/lib/ConfigManager'
import uiThemes from 'browser/lib/ui-themes'
import i18n from 'browser/lib/i18n'

const { remote, shell } = require('electron')
const attachmentManagement = require('../main/lib/dataApi/attachmentManagement')
const buildMarkdownPreviewContextMenu = require('browser/lib/contextMenuBuilder')
  .buildMarkdownPreviewContextMenu

const { app } = remote
const path = require('path')
const fileUrl = require('file-url')

const dialog = remote.dialog

const markdownStyle = require('!!css!stylus?sourceMap!./markdown.styl')[0][1]
const appPath = fileUrl(
  process.env.NODE_ENV === 'production' ? app.getAppPath() : path.resolve()
)
const CSS_FILES = [
  `${appPath}/node_modules/katex/dist/katex.min.css`,
  `${appPath}/node_modules/codemirror/lib/codemirror.css`,
  `${appPath}/node_modules/react-image-carousel/lib/css/main.min.css`
]

/**
 * @param {Object} opts
 * @param {String} opts.fontFamily
 * @param {Numberl} opts.fontSize
 * @param {String} opts.codeBlockFontFamily
 * @param {String} opts.theme
 * @param {Boolean} [opts.lineNumber] Should show line number
 * @param {Boolean} [opts.scrollPastEnd]
 * @param {Boolean} [opts.allowCustomCSS] Should add custom css
 * @param {String} [opts.customCSS] Will be added to bottom, only if `opts.allowCustomCSS` is truthy
 * @returns {String}
 */
function buildStyle(opts) {
  const {
    fontFamily,
    fontSize,
    codeBlockFontFamily,
    lineNumber,
    scrollPastEnd,
    theme,
    allowCustomCSS,
    customCSS,
    RTL
  } = opts
  return `
@font-face {
  font-family: 'Lato';
  src: url('${appPath}/resources/fonts/Lato-Regular.woff2') format('woff2'), /* Modern Browsers */
       url('${appPath}/resources/fonts/Lato-Regular.woff') format('woff'), /* Modern Browsers */
       url('${appPath}/resources/fonts/Lato-Regular.ttf') format('truetype');
  font-style: normal;
  font-weight: normal;
  text-rendering: optimizeLegibility;
}
@font-face {
  font-family: 'Lato';
  src: url('${appPath}/resources/fonts/Lato-Black.woff2') format('woff2'), /* Modern Browsers */
       url('${appPath}/resources/fonts/Lato-Black.woff') format('woff'), /* Modern Browsers */
       url('${appPath}/resources/fonts/Lato-Black.ttf') format('truetype');
  font-style: normal;
  font-weight: 700;
  text-rendering: optimizeLegibility;
}
@font-face {
  font-family: 'Material Icons';
  font-style: normal;
  font-weight: 400;
  src: local('Material Icons'),
       local('MaterialIcons-Regular'),
       url('${appPath}/resources/fonts/MaterialIcons-Regular.woff2') format('woff2'),
       url('${appPath}/resources/fonts/MaterialIcons-Regular.woff') format('woff'),
       url('${appPath}/resources/fonts/MaterialIcons-Regular.ttf') format('truetype');
}

${markdownStyle}

body {
  font-family: '${fontFamily.join("','")}';
  font-size: ${fontSize}px;

  ${
    scrollPastEnd
      ? `
    padding-bottom: 90vh;
    box-sizing: border-box;
    `
      : ''
  }
  ${RTL ? 'direction: rtl;' : ''}
  ${RTL ? 'text-align: right;' : ''}
}
@media print {
  body {
    padding-bottom: initial;
  }
}
code {
  font-family: '${codeBlockFontFamily.join("','")}';
  background-color: rgba(0,0,0,0.04);
  text-align: left;
  direction: ltr;
}

p code,
li code,
td code
{
  padding: 2px;
  border-width: 1px;
  border-style: solid;
  border-radius: 5px;
}
[data-theme="default"] p code,
[data-theme="default"] li code,
[data-theme="default"] td code
{
  background-color: #F4F4F4;
  border-color: #d9d9d9;
  color: inherit;
}
[data-theme="white"] p code,
[data-theme="white"] li code,
[data-theme="white"] td code
{
  background-color: #F4F4F4;
  border-color: #d9d9d9;
  color: inherit;
}
[data-theme="dark"] p code,
[data-theme="dark"] li code,
[data-theme="dark"] td code
{
  background-color: #444444;
  border-color: #555;
  color: #FFFFFF;
}
[data-theme="dracula"] p code,
[data-theme="dracula"] li code,
[data-theme="dracula"] td code
{
  background-color: #444444;
  border-color: #555;
  color: #FFFFFF;
}
[data-theme="monokai"] p code,
[data-theme="monokai"] li code,
[data-theme="monokai"] td code
{
  background-color: #444444;
  border-color: #555;
  color: #FFFFFF;
}
[data-theme="nord"] p code,
[data-theme="nord"] li code,
[data-theme="nord"] td code
{
  background-color: #444444;
  border-color: #555;
  color: #FFFFFF;
}
[data-theme="solarized-dark"] p code,
[data-theme="solarized-dark"] li code,
[data-theme="solarized-dark"] td code
{
  background-color: #444444;
  border-color: #555;
  color: #FFFFFF;
}
[data-theme="vulcan"] p code,
[data-theme="vulcan"] li code,
[data-theme="vulcan"] td code
{
  background-color: #444444;
  border-color: #555;
  color: #FFFFFF;
}

.lineNumber {
  ${lineNumber && 'display: block !important;'}
  font-family: '${codeBlockFontFamily.join("','")}';
}

.clipboardButton {
  color: rgba(147,147,149,0.8);;
  fill: rgba(147,147,149,1);;
  border-radius: 50%;
  margin: 0px 10px;
  border: none;
  background-color: transparent;
  outline: none;
  height: 15px;
  width: 15px;
  cursor: pointer;
}

.clipboardButton:hover {
  transition: 0.2s;
  color: #939395;
  fill: #939395;
  background-color: rgba(0,0,0,0.1);
}

h1, h2 {
  border: none;
}

h3 {
  margin: 1em 0 0.8em;
}

h4, h5, h6 {
  margin: 1.1em 0 0.5em;
}

h1 {
  padding: 0.2em 0 0.2em;
  margin: 1em 0 8px;
}

h2 {
  padding: 0.2em 0 0.2em;
  margin: 1em 0 0.7em;
}

body p {
  white-space: normal;
}

@media print {
  body[data-theme="${theme}"] {
    color: #000;
    background-color: #fff;
  }
  .clipboardButton {
    display: none
  }
}

${allowCustomCSS ? customCSS : ''}
`
}

const scrollBarStyle = `
::-webkit-scrollbar {
  ${config.get().ui.showScrollBar ? '' : 'display: none;'}
  width: 12px;
}

::-webkit-scrollbar-thumb {
  ${config.get().ui.showScrollBar ? '' : 'display: none;'}
  background-color: rgba(0, 0, 0, 0.15);
}

::-webkit-scrollbar-track-piece {
  background-color: inherit;
}
`
const scrollBarDarkStyle = `
::-webkit-scrollbar {
  ${config.get().ui.showScrollBar ? '' : 'display: none;'}
  width: 12px;
}

::-webkit-scrollbar-thumb {
  ${config.get().ui.showScrollBar ? '' : 'display: none;'}
  background-color: rgba(0, 0, 0, 0.3);
}

::-webkit-scrollbar-track-piece {
  background-color: inherit;
}
`

const OSX = global.process.platform === 'darwin'

const defaultFontFamily = ['helvetica', 'arial', 'sans-serif']
if (!OSX) {
  defaultFontFamily.unshift('Microsoft YaHei')
  defaultFontFamily.unshift('meiryo')
}
const defaultCodeBlockFontFamily = [
  'Monaco',
  'Menlo',
  'Ubuntu Mono',
  'Consolas',
  'source-code-pro',
  'monospace'
]

// return the line number of the line that used to generate the specified element
// return -1 if the line is not found
function getSourceLineNumberByElement(element) {
  let isHasLineNumber = element.dataset.line !== undefined
  let parent = element
  while (!isHasLineNumber && parent.parentElement !== null) {
    parent = parent.parentElement
    isHasLineNumber = parent.dataset.line !== undefined
  }
  return parent.dataset.line !== undefined ? parseInt(parent.dataset.line) : -1
}

class MarkdownPreview extends React.Component {
  constructor(props) {
    super(props)

    this.contextMenuHandler = e => this.handleContextMenu(e)
    this.mouseDownHandler = e => this.handleMouseDown(e)
    this.mouseUpHandler = e => this.handleMouseUp(e)
    this.DoubleClickHandler = e => this.handleDoubleClick(e)
    this.scrollHandler = _.debounce(this.handleScroll.bind(this), 100, {
      leading: false,
      trailing: true
    })
    this.checkboxClickHandler = e => this.handleCheckboxClick(e)
    this.saveAsTextHandler = () => this.handleSaveAsText()
    this.saveAsMdHandler = () => this.handleSaveAsMd()
    this.saveAsHtmlHandler = () => this.handleSaveAsHtml()
    this.saveAsPdfHandler = () => this.handleSaveAsPdf()
    this.printHandler = () => this.handlePrint()
    this.resizeHandler = _.throttle(this.handleResize.bind(this), 100)

    this.linkClickHandler = this.handleLinkClick.bind(this)
    this.initMarkdown = this.initMarkdown.bind(this)
    this.initMarkdown()
  }

  initMarkdown() {
    const { smartQuotes, sanitize, breaks } = this.props
    this.markdown = new Markdown({
      typographer: smartQuotes,
      sanitize,
      breaks
    })
  }

  handleCheckboxClick(e) {
    this.props.onCheckboxClick(e)
  }

  handleScroll(e) {
    if (this.props.onScroll) {
      this.props.onScroll(e)
    }
  }

  handleContextMenu(event) {
    const menu = buildMarkdownPreviewContextMenu(this, event)
    const switchPreview = ConfigManager.get().editor.switchPreview
    if (menu != null && switchPreview !== 'RIGHTCLICK') {
      menu.popup(remote.getCurrentWindow())
    } else if (_.isFunction(this.props.onContextMenu)) {
      this.props.onContextMenu(event)
    }
  }

  handleDoubleClick(e) {
    if (this.props.onDoubleClick != null) this.props.onDoubleClick(e)
  }

  handleMouseDown(e) {
    const config = ConfigManager.get()
    const clickElement = e.target
    const targetTag = clickElement.tagName // The direct parent HTML of where was clicked ie "BODY" or "DIV"
    const lineNumber = getSourceLineNumberByElement(clickElement) // Line location of element clicked.

    if (
      config.editor.switchPreview === 'RIGHTCLICK' &&
      e.buttons === 2 &&
      config.editor.type === 'SPLIT'
    ) {
      eventEmitter.emit('topbar:togglemodebutton', 'CODE')
    }
    if (e.ctrlKey) {
      if (config.editor.type === 'SPLIT') {
        if (lineNumber !== -1) {
          eventEmitter.emit('line:jump', lineNumber)
        }
      } else {
        if (lineNumber !== -1) {
          eventEmitter.emit('editor:focus')
          eventEmitter.emit('line:jump', lineNumber)
        }
      }
    }

    if (this.props.onMouseDown != null && targetTag === 'BODY')
      this.props.onMouseDown(e)
  }

  handleMouseUp(e) {
    if (!this.props.onMouseUp) return
    if (e.target != null && e.target.tagName === 'A') {
      return null
    }
    if (this.props.onMouseUp != null) this.props.onMouseUp(e)
  }

  handleSaveAsText() {
    this.exportAsDocument('txt')
  }

  handleSaveAsMd() {
    this.exportAsDocument('md')
  }

  htmlContentFormatter(noteContent, exportTasks, targetDir) {
    const {
      fontFamily,
      fontSize,
      codeBlockFontFamily,
      lineNumber,
      codeBlockTheme,
      scrollPastEnd,
      theme,
      allowCustomCSS,
      customCSS,
      RTL
    } = this.getStyleParams()

    const inlineStyles = buildStyle({
      fontFamily,
      fontSize,
      codeBlockFontFamily,
      lineNumber,
      scrollPastEnd,
      theme,
      allowCustomCSS,
      customCSS,
      RTL
    })
    let body = this.refs.root.contentWindow.document.body.innerHTML
    body = attachmentManagement.fixLocalURLS(body, this.props.storagePath)
    const files = [this.getCodeThemeLink(codeBlockTheme), ...CSS_FILES]
    files.forEach(file => {
      if (global.process.platform === 'win32') {
        file = file.replace('file:///', '')
      } else {
        file = file.replace('file://', '')
      }
      exportTasks.push({
        src: file,
        dst: 'css'
      })
    })

    let styles = ''
    files.forEach(file => {
      styles += `<link rel="stylesheet" href="../css/${path.basename(file)}">`
    })

    return `<html>
               <head>
                 <base href="file://${targetDir}/">
                 <meta charset="UTF-8">
                 <meta name = "viewport" content = "width = device-width, initial-scale = 1, maximum-scale = 1">
                 <style id="style">${inlineStyles}</style>
                 ${styles}
               </head>
               <body>${body}</body>
            </html>`
  }

  handleSaveAsHtml() {
    this.exportAsDocument('html', (noteContent, exportTasks, targetDir) =>
      Promise.resolve(
        this.htmlContentFormatter(noteContent, exportTasks, targetDir)
      )
    )
  }

  handleSaveAsPdf() {
    this.exportAsDocument('pdf', (noteContent, exportTasks, targetDir) => {
      const printout = new remote.BrowserWindow({
        show: false,
        webPreferences: { webSecurity: false, javascript: false }
      })
      printout.loadURL(
        'data:text/html;charset=UTF-8,' +
          this.htmlContentFormatter(noteContent, exportTasks, targetDir)
      )
      return new Promise((resolve, reject) => {
        printout.webContents.on('did-finish-load', () => {
          printout.webContents.printToPDF({}, (err, data) => {
            if (err) reject(err)
            else resolve(data)
            printout.destroy()
          })
        })
      })
    })
  }

  handlePrint() {
    this.refs.root.contentWindow.print()
  }

  exportAsDocument(fileType, contentFormatter) {
    const options = {
      filters: [{ name: 'Documents', extensions: [fileType] }],
      properties: ['openFile', 'createDirectory']
    }

    dialog.showSaveDialog(remote.getCurrentWindow(), options, filename => {
      if (filename) {
        const content = this.props.value
        const storage = this.props.storagePath
        const nodeKey = this.props.noteKey

        exportNote(nodeKey, storage, content, filename, contentFormatter)
          .then(res => {
            dialog.showMessageBox(remote.getCurrentWindow(), {
              type: 'info',
              message: `Exported to ${filename}`,
              buttons: [i18n.__('Ok')]
            })
          })
          .catch(err => {
            dialog.showErrorBox(
              'Export error',
              err ? err.message || err : 'Unexpected error during export'
            )
            throw err
          })
      }
    })
  }

  fixDecodedURI(node) {
    if (
      node &&
      node.children.length === 1 &&
      typeof node.children[0] === 'string'
    ) {
      const { innerText, href } = node

      node.innerText = mdurl.decode(href) === innerText ? href : innerText
    }
  }

  /**
   * @description Convert special characters between three ```
   * @param {string[]} splitWithCodeTag Array of HTML strings separated by three ```
   * @returns {string} HTML in which special characters between three ``` have been converted
   */
  escapeHtmlCharactersInCodeTag(splitWithCodeTag) {
    for (let index = 0; index < splitWithCodeTag.length; index++) {
      const codeTagRequired =
        splitWithCodeTag[index] !== '```' && index < splitWithCodeTag.length - 1
      if (codeTagRequired) {
        splitWithCodeTag.splice(index + 1, 0, '```')
      }
    }
    let inCodeTag = false
    let result = ''
    for (let content of splitWithCodeTag) {
      if (content === '```') {
        inCodeTag = !inCodeTag
      } else if (inCodeTag) {
        content = escapeHtmlCharacters(content)
      }
      result += content
    }
    return result
  }

  getScrollBarStyle() {
    const { theme } = this.props

    return uiThemes.some(item => item.name === theme && item.isDark)
      ? scrollBarDarkStyle
      : scrollBarStyle
  }

  componentDidMount() {
    const { onDrop } = this.props

    this.refs.root.setAttribute('sandbox', 'allow-scripts')
    this.refs.root.contentWindow.document.body.addEventListener(
      'contextmenu',
      this.contextMenuHandler
    )

    let styles = `
      <style id='style'></style>
      <link rel="stylesheet" id="codeTheme">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>
        ${this.getScrollBarStyle()}
      </style>
    `

    CSS_FILES.forEach(file => {
      styles += `<link rel="stylesheet" href="${file}">`
    })

    this.refs.root.contentWindow.document.head.innerHTML = styles
    this.rewriteIframe()
    this.applyStyle()

    this.refs.root.contentWindow.document.addEventListener(
      'mousedown',
      this.mouseDownHandler
    )
    this.refs.root.contentWindow.document.addEventListener(
      'mouseup',
      this.mouseUpHandler
    )
    this.refs.root.contentWindow.document.addEventListener(
      'dblclick',
      this.DoubleClickHandler
    )
    this.refs.root.contentWindow.document.addEventListener(
      'drop',
      onDrop || this.preventImageDroppedHandler
    )
    this.refs.root.contentWindow.document.addEventListener(
      'dragover',
      this.preventImageDroppedHandler
    )
    this.refs.root.contentWindow.document.addEventListener(
      'scroll',
      this.scrollHandler
    )
    this.refs.root.contentWindow.addEventListener('resize', this.resizeHandler)
    eventEmitter.on('export:save-text', this.saveAsTextHandler)
    eventEmitter.on('export:save-md', this.saveAsMdHandler)
    eventEmitter.on('export:save-html', this.saveAsHtmlHandler)
    eventEmitter.on('export:save-pdf', this.saveAsPdfHandler)
    eventEmitter.on('print', this.printHandler)
  }

  componentWillUnmount() {
    const { onDrop } = this.props

    this.refs.root.contentWindow.document.body.removeEventListener(
      'contextmenu',
      this.contextMenuHandler
    )
    this.refs.root.contentWindow.document.removeEventListener(
      'mousedown',
      this.mouseDownHandler
    )
    this.refs.root.contentWindow.document.removeEventListener(
      'mouseup',
      this.mouseUpHandler
    )
    this.refs.root.contentWindow.document.removeEventListener(
      'dblclick',
      this.DoubleClickHandler
    )
    this.refs.root.contentWindow.document.removeEventListener(
      'drop',
      onDrop || this.preventImageDroppedHandler
    )
    this.refs.root.contentWindow.document.removeEventListener(
      'dragover',
      this.preventImageDroppedHandler
    )
    this.refs.root.contentWindow.document.removeEventListener(
      'scroll',
      this.scrollHandler
    )
    this.refs.root.contentWindow.removeEventListener(
      'resize',
      this.resizeHandler
    )
    eventEmitter.off('export:save-text', this.saveAsTextHandler)
    eventEmitter.off('export:save-md', this.saveAsMdHandler)
    eventEmitter.off('export:save-html', this.saveAsHtmlHandler)
    eventEmitter.off('export:save-pdf', this.saveAsPdfHandler)
    eventEmitter.off('print', this.printHandler)
  }

  componentDidUpdate(prevProps) {
    // actual rewriteIframe function should be called only once
    let needsRewriteIframe = false
    if (prevProps.value !== this.props.value) needsRewriteIframe = true
    if (
      prevProps.smartQuotes !== this.props.smartQuotes ||
      prevProps.sanitize !== this.props.sanitize ||
      prevProps.mermaidHTMLLabel !== this.props.mermaidHTMLLabel ||
      prevProps.smartArrows !== this.props.smartArrows ||
      prevProps.breaks !== this.props.breaks ||
      prevProps.lineThroughCheckbox !== this.props.lineThroughCheckbox
    ) {
      this.initMarkdown()
      needsRewriteIframe = true
    }
    if (
      prevProps.fontFamily !== this.props.fontFamily ||
      prevProps.fontSize !== this.props.fontSize ||
      prevProps.codeBlockFontFamily !== this.props.codeBlockFontFamily ||
      prevProps.codeBlockTheme !== this.props.codeBlockTheme ||
      prevProps.lineNumber !== this.props.lineNumber ||
      prevProps.showCopyNotification !== this.props.showCopyNotification ||
      prevProps.theme !== this.props.theme ||
      prevProps.scrollPastEnd !== this.props.scrollPastEnd ||
      prevProps.allowCustomCSS !== this.props.allowCustomCSS ||
      prevProps.customCSS !== this.props.customCSS ||
      prevProps.RTL !== this.props.RTL
    ) {
      this.applyStyle()
      needsRewriteIframe = true
    }

    if (needsRewriteIframe) {
      this.rewriteIframe()
    }

    // Should scroll to top after selecting another note
    if (prevProps.noteKey !== this.props.noteKey) {
      this.scrollTo(0, 0)
    }
  }

  getStyleParams() {
    const {
      fontSize,
      lineNumber,
      codeBlockTheme,
      scrollPastEnd,
      theme,
      allowCustomCSS,
      customCSS,
      RTL
    } = this.props
    let { fontFamily, codeBlockFontFamily } = this.props
    fontFamily =
      _.isString(fontFamily) && fontFamily.trim().length > 0
        ? fontFamily
            .split(',')
            .map(fontName => fontName.trim())
            .concat(defaultFontFamily)
        : defaultFontFamily
    codeBlockFontFamily =
      _.isString(codeBlockFontFamily) && codeBlockFontFamily.trim().length > 0
        ? codeBlockFontFamily
            .split(',')
            .map(fontName => fontName.trim())
            .concat(defaultCodeBlockFontFamily)
        : defaultCodeBlockFontFamily

    return {
      fontFamily,
      fontSize,
      codeBlockFontFamily,
      lineNumber,
      codeBlockTheme,
      scrollPastEnd,
      theme,
      allowCustomCSS,
      customCSS,
      RTL
    }
  }

  applyStyle() {
    const {
      fontFamily,
      fontSize,
      codeBlockFontFamily,
      lineNumber,
      codeBlockTheme,
      scrollPastEnd,
      theme,
      allowCustomCSS,
      customCSS,
      RTL
    } = this.getStyleParams()

    this.getWindow().document.getElementById(
      'codeTheme'
    ).href = this.getCodeThemeLink(codeBlockTheme)
    this.getWindow().document.getElementById('style').innerHTML = buildStyle({
      fontFamily,
      fontSize,
      codeBlockFontFamily,
      lineNumber,
      scrollPastEnd,
      theme,
      allowCustomCSS,
      customCSS,
      RTL
    })
  }

  getCodeThemeLink(name) {
    const theme = consts.THEMES.find(theme => theme.name === name)

    return theme != null
      ? theme.path
      : `${appPath}/node_modules/codemirror/theme/elegant.css`
  }

  rewriteIframe() {
    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll(
        'input[type="checkbox"]'
      ),
      el => {
        el.removeEventListener('click', this.checkboxClickHandler)
      }
    )

    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('a'),
      el => {
        el.removeEventListener('click', this.linkClickHandler)
      }
    )

    const {
      theme,
      indentSize,
      showCopyNotification,
      storagePath,
      noteKey,
      sanitize,
      mermaidHTMLLabel
    } = this.props
    let { value, codeBlockTheme } = this.props

    this.refs.root.contentWindow.document.body.setAttribute('data-theme', theme)
    if (sanitize === 'NONE') {
      const splitWithCodeTag = value.split('```')
      value = this.escapeHtmlCharactersInCodeTag(splitWithCodeTag)
    }
    const renderedHTML = this.markdown.render(value)
    attachmentManagement.migrateAttachments(value, storagePath, noteKey)
    this.refs.root.contentWindow.document.body.innerHTML = attachmentManagement.fixLocalURLS(
      renderedHTML,
      storagePath
    )
    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll(
        'input[type="checkbox"]'
      ),
      el => {
        el.addEventListener('click', this.checkboxClickHandler)
      }
    )

    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('a'),
      el => {
        this.fixDecodedURI(el)
        el.addEventListener('click', this.linkClickHandler)
      }
    )

    codeBlockTheme = consts.THEMES.find(theme => theme.name === codeBlockTheme)

    const codeBlockThemeClassName = codeBlockTheme
      ? codeBlockTheme.className
      : 'cm-s-default'

    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('.code code'),
      el => {
        let syntax = CodeMirror.findModeByName(convertModeName(el.className))
        if (syntax == null) syntax = CodeMirror.findModeByName('Plain Text')
        CodeMirror.requireMode(syntax.mode, () => {
          const content = htmlTextHelper.decodeEntities(el.innerHTML)
          const copyIcon = document.createElement('i')
          copyIcon.innerHTML =
            '<button class="clipboardButton"><svg width="13" height="13" viewBox="0 0 1792 1792" ><path d="M768 1664h896v-640h-416q-40 0-68-28t-28-68v-416h-384v1152zm256-1440v-64q0-13-9.5-22.5t-22.5-9.5h-704q-13 0-22.5 9.5t-9.5 22.5v64q0 13 9.5 22.5t22.5 9.5h704q13 0 22.5-9.5t9.5-22.5zm256 672h299l-299-299v299zm512 128v672q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-160h-544q-40 0-68-28t-28-68v-1344q0-40 28-68t68-28h1088q40 0 68 28t28 68v328q21 13 36 28l408 408q28 28 48 76t20 88z"/></svg></button>'
          copyIcon.onclick = e => {
            e.preventDefault()
            e.stopPropagation()
            copy(content)
            if (showCopyNotification) {
              this.notify('Saved to Clipboard!', {
                body: 'Paste it wherever you want!',
                silent: true
              })
            }
          }

          el.parentNode.appendChild(copyIcon)
          el.innerHTML = ''
          el.parentNode.className += ` ${codeBlockThemeClassName}`

          CodeMirror.runMode(content, syntax.mime, el, {
            tabSize: indentSize
          })
        })
      }
    )
    const opts = {}
    // if (this.props.theme === 'dark') {
    //   opts['font-color'] = '#DDD'
    //   opts['line-color'] = '#DDD'
    //   opts['element-color'] = '#DDD'
    //   opts['fill'] = '#3A404C'
    // }
    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('.flowchart'),
      el => {
        Raphael.setWindow(this.getWindow())
        try {
          const diagram = flowchart.parse(
            htmlTextHelper.decodeEntities(el.innerHTML)
          )
          el.innerHTML = ''
          diagram.drawSVG(el, opts)
          _.forEach(el.querySelectorAll('a'), el => {
            el.addEventListener('click', this.linkClickHandler)
          })
        } catch (e) {
          el.className = 'flowchart-error'
          el.innerHTML = 'Flowchart parse error: ' + e.message
        }
      }
    )

    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('.sequence'),
      el => {
        Raphael.setWindow(this.getWindow())
        try {
          const diagram = SequenceDiagram.parse(
            htmlTextHelper.decodeEntities(el.innerHTML)
          )
          el.innerHTML = ''
          diagram.drawSVG(el, { theme: 'simple' })
          _.forEach(el.querySelectorAll('a'), el => {
            el.addEventListener('click', this.linkClickHandler)
          })
        } catch (e) {
          el.className = 'sequence-error'
          el.innerHTML = 'Sequence diagram parse error: ' + e.message
        }
      }
    )

    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('.chart'),
      el => {
        try {
          const format = el.attributes.getNamedItem('data-format').value
          const chartConfig =
            format === 'yaml'
              ? yaml.load(el.innerHTML)
              : JSON.parse(el.innerHTML)
          el.innerHTML = ''

          const canvas = document.createElement('canvas')
          el.appendChild(canvas)

          const height = el.attributes.getNamedItem('data-height')
          if (height && height.value !== 'undefined') {
            el.style.height = height.value + 'vh'
            canvas.height = height.value + 'vh'
          }

          // eslint-disable-next-line no-unused-vars
          const chart = new Chart(canvas, chartConfig)
        } catch (e) {
          el.className = 'chart-error'
          el.innerHTML = 'chartjs diagram parse error: ' + e.message
        }
      }
    )
    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('.mermaid'),
      el => {
        mermaidRender(
          el,
          htmlTextHelper.decodeEntities(el.innerHTML),
          theme,
          mermaidHTMLLabel
        )
      }
    )

    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('.gallery'),
      el => {
        const images = el.innerHTML.split(/\n/g).filter(i => i.length > 0)
        el.innerHTML = ''

        const height = el.attributes.getNamedItem('data-height')
        if (height && height.value !== 'undefined') {
          el.style.height = height.value + 'vh'
        }

        let autoplay = el.attributes.getNamedItem('data-autoplay')
        if (autoplay && autoplay.value !== 'undefined') {
          autoplay = parseInt(autoplay.value, 10) || 0
        } else {
          autoplay = 0
        }

        render(<Carousel images={images} autoplay={autoplay} />, el)
      }
    )

    const markdownPreviewIframe = document.querySelector('.MarkdownPreview')
    const rect = markdownPreviewIframe.getBoundingClientRect()
    const config = { attributes: true, subtree: true }
    const imgObserver = new MutationObserver(mutationList => {
      for (const mu of mutationList) {
        if (mu.target.className === 'carouselContent-enter-done') {
          this.setImgOnClickEventHelper(mu.target, rect)
          break
        }
      }
    })

    const imgList = markdownPreviewIframe.contentWindow.document.body.querySelectorAll(
      'img'
    )
    for (const img of imgList) {
      const parentEl = img.parentElement
      this.setImgOnClickEventHelper(img, rect)
      imgObserver.observe(parentEl, config)
    }

    const aList = markdownPreviewIframe.contentWindow.document.body.querySelectorAll(
      'a'
    )
    for (const a of aList) {
      a.removeEventListener('click', this.linkClickHandler)
      a.addEventListener('click', this.linkClickHandler)
    }
  }

  setImgOnClickEventHelper(img, rect) {
    img.onclick = () => {
      const widthMagnification = document.body.clientWidth / img.width
      const heightMagnification = document.body.clientHeight / img.height
      const baseOnWidth = widthMagnification < heightMagnification
      const magnification = baseOnWidth
        ? widthMagnification
        : heightMagnification

      const zoomImgWidth = img.width * magnification
      const zoomImgHeight = img.height * magnification
      const zoomImgTop = (document.body.clientHeight - zoomImgHeight) / 2
      const zoomImgLeft = (document.body.clientWidth - zoomImgWidth) / 2
      const originalImgTop = img.y + rect.top
      const originalImgLeft = img.x + rect.left
      const originalImgRect = {
        top: `${originalImgTop}px`,
        left: `${originalImgLeft}px`,
        width: `${img.width}px`,
        height: `${img.height}px`
      }
      const zoomInImgRect = {
        top: `${baseOnWidth ? zoomImgTop : 0}px`,
        left: `${baseOnWidth ? 0 : zoomImgLeft}px`,
        width: `${zoomImgWidth}px`,
        height: `${zoomImgHeight}px`
      }
      const animationSpeed = 300

      const zoomImg = document.createElement('img')
      zoomImg.src = img.src
      zoomImg.style = `
        position: absolute;
        top: ${baseOnWidth ? zoomImgTop : 0}px;
        left: ${baseOnWidth ? 0 : zoomImgLeft}px;
        width: ${zoomImgWidth};
        height: ${zoomImgHeight}px;
        `
      zoomImg.animate([originalImgRect, zoomInImgRect], animationSpeed)

      const overlay = document.createElement('div')
      overlay.style = `
        background-color: rgba(0,0,0,0.5);
        cursor: zoom-out;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: ${document.body.clientHeight}px;
        z-index: 100;
      `
      overlay.onclick = () => {
        zoomImg.style = `
          position: absolute;
          top: ${originalImgTop}px;
          left: ${originalImgLeft}px;
          width: ${img.width}px;
          height: ${img.height}px;
          `
        const zoomOutImgAnimation = zoomImg.animate(
          [zoomInImgRect, originalImgRect],
          animationSpeed
        )
        zoomOutImgAnimation.onfinish = () => overlay.remove()
      }

      overlay.appendChild(zoomImg)
      document.body.appendChild(overlay)
    }
  }

  handleResize() {
    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('svg[ratio]'),
      el => {
        el.setAttribute('height', el.clientWidth / el.getAttribute('ratio'))
      }
    )
  }

  focus() {
    this.refs.root.focus()
  }

  getWindow() {
    return this.refs.root.contentWindow
  }

  /**
   * @public
   * @param {Number} targetRow
   */
  scrollToRow(targetRow) {
    const blocks = this.getWindow().document.querySelectorAll(
      'body>[data-line]'
    )

    for (let index = 0; index < blocks.length; index++) {
      let block = blocks[index]
      const row = parseInt(block.getAttribute('data-line'))
      if (row > targetRow || index === blocks.length - 1) {
        block = blocks[index - 1]
        block != null && this.scrollTo(0, block.offsetTop)
        break
      }
    }
  }

  /**
   * `document.body.scrollTo`
   * @param {Number} x
   * @param {Number} y
   */
  scrollTo(x, y) {
    this.getWindow().document.body.scrollTo(x, y)
  }

  preventImageDroppedHandler(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  notify(title, options) {
    if (global.process.platform === 'win32') {
      options.icon = path.join(
        'file://',
        global.__dirname,
        '../../resources/app.png'
      )
    }
    return new window.Notification(title, options)
  }

  handleLinkClick(e) {
    e.preventDefault()
    e.stopPropagation()

    const rawHref = e.target.getAttribute('href')
    const { dispatch } = this.props
    if (!rawHref) return // not checked href because parser will create file://... string for [empty link]()

    const parser = document.createElement('a')
    parser.href = rawHref
    const isStartWithHash = rawHref[0] === '#'
    const { href, hash } = parser

    const linkHash = hash === '' ? rawHref : hash // needed because we're having special link formats that are removed by parser e.g. :line:10

    const extractIdRegex = /file:\/\/.*main.?\w*.html#/ // file://path/to/main(.development.)html
    const regexNoteInternalLink = new RegExp(`${extractIdRegex.source}(.+)`)
    if (isStartWithHash || regexNoteInternalLink.test(rawHref)) {
      const posOfHash = linkHash.indexOf('#')
      if (posOfHash > -1) {
        const extractedId = linkHash.slice(posOfHash + 1)
        const targetId = mdurl.encode(extractedId)
        const targetElement = this.getWindow().document.getElementById(targetId)

        if (targetElement != null) {
          this.scrollTo(0, targetElement.offsetTop)
        }
        return
      }
    }

    // this will match the new uuid v4 hash and the old hash
    // e.g.
    // :note:1c211eb7dcb463de6490 and
    // :note:7dd23275-f2b4-49cb-9e93-3454daf1af9c
    const regexIsNoteLink = /^:note:([a-zA-Z0-9-]{20,36})$/
    if (regexIsNoteLink.test(linkHash)) {
      eventEmitter.emit('list:jump', linkHash.replace(':note:', ''))
      return
    }

    const regexIsLine = /^:line:[0-9]/
    if (regexIsLine.test(linkHash)) {
      const numberPattern = /\d+/g

      const lineNumber = parseInt(linkHash.match(numberPattern)[0])
      eventEmitter.emit('line:jump', lineNumber)
      return
    }

    // this will match the old link format storage.key-note.key
    // e.g.
    // 877f99c3268608328037-1c211eb7dcb463de6490
    const regexIsLegacyNoteLink = /^(.{20})-(.{20})$/
    if (regexIsLegacyNoteLink.test(linkHash)) {
      eventEmitter.emit('list:jump', linkHash.split('-')[1])
      return
    }

    const regexIsTagLink = /^:tag:([\w]+)$/
    if (regexIsTagLink.test(rawHref)) {
      const tag = rawHref.match(regexIsTagLink)[1]
      dispatch(push(`/tags/${encodeURIComponent(tag)}`))
      return
    }

    // other case
    this.openExternal(href)
  }

  openExternal(href) {
    try {
      const success =
        shell.openExternal(href) || shell.openExternal(decodeURI(href))
      if (!success) console.error('failed to open url ' + href)
    } catch (e) {
      // URI Error threw from decodeURI
      console.error(e)
    }
  }

  render() {
    const { className, style, tabIndex } = this.props
    return (
      <iframe
        className={
          className != null ? 'MarkdownPreview ' + className : 'MarkdownPreview'
        }
        style={style}
        tabIndex={tabIndex}
        ref='root'
      />
    )
  }
}

MarkdownPreview.propTypes = {
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onMouseUp: PropTypes.func,
  onMouseDown: PropTypes.func,
  onContextMenu: PropTypes.func,
  className: PropTypes.string,
  value: PropTypes.string,
  showCopyNotification: PropTypes.bool,
  storagePath: PropTypes.string,
  smartQuotes: PropTypes.bool,
  smartArrows: PropTypes.bool,
  breaks: PropTypes.bool
}

export default connect(
  null,
  null,
  null,
  { forwardRef: true }
)(MarkdownPreview)
