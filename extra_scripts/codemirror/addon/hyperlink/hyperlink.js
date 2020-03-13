;(function(mod) {
  if (typeof exports === 'object' && typeof module === 'object') {
    // Common JS
    mod(require('../codemirror/lib/codemirror'))
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['../codemirror/lib/codemirror'], mod)
  } else {
    // Plain browser env
    mod(CodeMirror)
  }
})(function(CodeMirror) {
  'use strict'

  const shell = require('electron').shell
  const remote = require('electron').remote
  const eventEmitter = {
    emit: function() {
      remote.getCurrentWindow().webContents.send.apply(null, arguments)
    }
  }
  const yOffset = 2

  const macOS = global.process.platform === 'darwin'
  const modifier = macOS ? 'metaKey' : 'ctrlKey'

  class HyperLink {
    constructor(cm) {
      this.cm = cm
      this.lineDiv = cm.display.lineDiv

      this.onMouseDown = this.onMouseDown.bind(this)
      this.onMouseEnter = this.onMouseEnter.bind(this)
      this.onMouseLeave = this.onMouseLeave.bind(this)
      this.onMouseMove = this.onMouseMove.bind(this)

      this.tooltip = document.createElement('div')
      this.tooltipContent = document.createElement('div')
      this.tooltipIndicator = document.createElement('div')
      this.tooltip.setAttribute(
        'class',
        'CodeMirror-hover CodeMirror-matchingbracket CodeMirror-selected'
      )
      this.tooltip.setAttribute('cm-ignore-events', 'true')
      this.tooltip.appendChild(this.tooltipContent)
      this.tooltip.appendChild(this.tooltipIndicator)
      this.tooltipContent.textContent = `${
        macOS ? 'Cmd(⌘)' : 'Ctrl(^)'
      } + click to follow link`

      this.lineDiv.addEventListener('mousedown', this.onMouseDown)
      this.lineDiv.addEventListener('mouseenter', this.onMouseEnter, {
        capture: true,
        passive: true
      })
      this.lineDiv.addEventListener('mouseleave', this.onMouseLeave, {
        capture: true,
        passive: true
      })
      this.lineDiv.addEventListener('mousemove', this.onMouseMove, {
        passive: true
      })
    }
    getUrl(el) {
      const className = el.className.split(' ')

      if (className.indexOf('cm-url') !== -1) {
        // multiple cm-url because of search term
        const cmUrlSpans = Array.from(
          el.parentNode.getElementsByClassName('cm-url')
        )
        const textContent =
          cmUrlSpans.length > 1
            ? cmUrlSpans.map(span => span.textContent).join('')
            : el.textContent

        const match = /^\((.*)\)|\[(.*)\]|(.*)$/.exec(textContent)
        const url = match[1] || match[2] || match[3]

        // `:storage` is the value of the variable `STORAGE_FOLDER_PLACEHOLDER` defined in `browser/main/lib/dataApi/attachmentManagement`
        return /^:storage(?:\/|%5C)/.test(url) ? null : url
      }

      return null
    }
    specialLinkHandler(e, rawHref, linkHash) {
      const isStartWithHash = rawHref[0] === '#'

      const extractIdRegex = /file:\/\/.*main.?\w*.html#/ // file://path/to/main(.development.)html
      const regexNoteInternalLink = new RegExp(`${extractIdRegex.source}(.+)`)
      if (isStartWithHash || regexNoteInternalLink.test(rawHref)) {
        const posOfHash = linkHash.indexOf('#')
        if (posOfHash > -1) {
          const extractedId = linkHash.slice(posOfHash + 1)
          const targetId = mdurl.encode(extractedId)
          const targetElement = document.getElementById(targetId) // this.getWindow().document.getElementById(targetId)

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
        eventEmitter.emit('dispatch:push', `/tags/${encodeURIComponent(tag)}`)
        return
      }
    }
    onMouseDown(e) {
      const { target } = e
      if (!e[modifier]) {
        return
      }

      // Create URL spans array used for special case "search term is hitting a link".
      const cmUrlSpans = Array.from(
        e.target.parentNode.getElementsByClassName('cm-url')
      )

      const innerText =
        cmUrlSpans.length > 1
          ? cmUrlSpans.map(span => span.textContent).join('')
          : e.target.innerText
      const rawHref = innerText.trim().slice(1, -1) // get link text from markdown text

      if (!rawHref) return // not checked href because parser will create file://... string for [empty link]()

      const parser = document.createElement('a')
      parser.href = rawHref
      const { href, hash } = parser

      const linkHash = hash === '' ? rawHref : hash // needed because we're having special link formats that are removed by parser e.g. :line:10

      this.specialLinkHandler(target, rawHref, linkHash)

      const url = this.getUrl(target)

      // all special cases handled --> other case
      if (url) {
        e.preventDefault()

        shell.openExternal(url)
      }
    }
    onMouseEnter(e) {
      const { target } = e

      const url = this.getUrl(target)
      if (url) {
        if (e[modifier]) {
          target.classList.add(
            'CodeMirror-activeline-background',
            'CodeMirror-hyperlink'
          )
        } else {
          target.classList.add('CodeMirror-activeline-background')
        }

        this.showInfo(target)
      }
    }
    onMouseLeave(e) {
      if (this.tooltip.parentElement === this.lineDiv) {
        e.target.classList.remove(
          'CodeMirror-activeline-background',
          'CodeMirror-hyperlink'
        )

        this.lineDiv.removeChild(this.tooltip)
      }
    }
    onMouseMove(e) {
      if (this.tooltip.parentElement === this.lineDiv) {
        if (e[modifier]) {
          e.target.classList.add('CodeMirror-hyperlink')
        } else {
          e.target.classList.remove('CodeMirror-hyperlink')
        }
      }
    }
    showInfo(relatedTo) {
      const b1 = relatedTo.getBoundingClientRect()
      const b2 = this.lineDiv.getBoundingClientRect()
      const tdiv = this.tooltip

      tdiv.style.left = b1.left - b2.left + 'px'
      this.lineDiv.appendChild(tdiv)

      const b3 = tdiv.getBoundingClientRect()
      const top = b1.top - b2.top - b3.height - yOffset
      if (top < 0) {
        tdiv.style.top = b1.top - b2.top + b1.height + yOffset + 'px'
      } else {
        tdiv.style.top = top + 'px'
      }
    }
  }

  CodeMirror.defineOption('hyperlink', true, cm => {
    const addon = new HyperLink(cm)
  })
})
