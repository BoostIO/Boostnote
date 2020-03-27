;(function(mod) {
  if (typeof exports == 'object' && typeof module == 'object')
    // CommonJS
    mod(
      require('../codemirror/lib/codemirror'),
      require('../codemirror/mode/gfm/gfm'),
      require('../codemirror/mode/yaml-frontmatter/yaml-frontmatter')
    )
  else if (typeof define == 'function' && define.amd)
    // AMD
    define([
      '../codemirror/lib/codemirror',
      '../codemirror/mode/gfm/gfm',
      '../codemirror/mode/yaml-frontmatter/yaml-frontmatter'
    ], mod)
  // Plain browser env
  else mod(CodeMirror)
})(function(CodeMirror) {
  'use strict'

  const fencedCodeRE = /^(~~~+|```+)[ \t]*([\w+#-]+)?(?:\(((?:\s*\w[-\w]*(?:=(?:'(?:.*?[^\\])?'|"(?:.*?[^\\])?"|(?:[^'"][^\s]*)))?)*)\))?(?::([^:]*)(?::(\d+))?)?\s*$/

  function getMode(name, params, config, cm) {
    if (!name) {
      return null
    }

    const parameters = {}
    if (params) {
      const regex = /(\w[-\w]*)(?:=(?:'(.*?[^\\])?'|"(.*?[^\\])?"|([^'"][^\s]*)))?/g

      let match
      while ((match = regex.exec(params))) {
        parameters[match[1]] = match[2] || match[3] || match[4] || null
      }
    }

    if (name === 'chart') {
      name = parameters.hasOwnProperty('yaml') ? 'yaml' : 'json'
    }

    const found = CodeMirror.findModeByName(name)
    if (!found) {
      return null
    }

    if (CodeMirror.modes.hasOwnProperty(found.mode)) {
      const mode = CodeMirror.getMode(config, found.mode)

      return mode.name === 'null' ? null : mode
    } else {
      CodeMirror.requireMode(found.mode, () => {
        cm.setOption('mode', cm.getOption('mode'))
      })
    }
  }

  CodeMirror.defineMode(
    'bfm',
    function(config, baseConfig) {
      baseConfig.name = 'yaml-frontmatter'
      const baseMode = CodeMirror.getMode(config, baseConfig)

      return {
        startState: function() {
          return {
            baseState: CodeMirror.startState(baseMode),

            basePos: 0,
            baseCur: null,
            overlayPos: 0,
            overlayCur: null,
            streamSeen: null,

            fencedEndRE: null,

            inTable: false,
            rowIndex: 0
          }
        },
        copyState: function(s) {
          return {
            baseState: CodeMirror.copyState(baseMode, s.baseState),

            basePos: s.basePos,
            baseCur: null,
            overlayPos: s.overlayPos,
            overlayCur: null,

            fencedMode: s.fencedMode,
            fencedState: s.fencedMode
              ? CodeMirror.copyState(s.fencedMode, s.fencedState)
              : null,

            fencedEndRE: s.fencedEndRE,

            inTable: s.inTable,
            rowIndex: s.rowIndex
          }
        },
        token: function(stream, state) {
          const initialPos = stream.pos

          if (state.fencedEndRE && stream.match(state.fencedEndRE)) {
            state.fencedEndRE = null
            state.fencedMode = null
            state.fencedState = null

            stream.pos = initialPos
          } else {
            if (state.fencedMode) {
              return state.fencedMode.token(stream, state.fencedState)
            }

            const match = stream.match(fencedCodeRE, true)
            if (match) {
              state.fencedEndRE = new RegExp(match[1] + '+ *$')

              state.fencedMode = getMode(
                match[2],
                match[3],
                config,
                stream.lineOracle.doc.cm
              )
              if (state.fencedMode) {
                state.fencedState = CodeMirror.startState(state.fencedMode)
              }

              stream.pos = initialPos
            }
          }

          if (
            stream != state.streamSeen ||
            Math.min(state.basePos, state.overlayPos) < stream.start
          ) {
            state.streamSeen = stream
            state.basePos = state.overlayPos = stream.start
          }

          if (stream.start == state.basePos) {
            state.baseCur = baseMode.token(stream, state.baseState)
            state.basePos = stream.pos
          }
          if (stream.start == state.overlayPos) {
            stream.pos = stream.start
            state.overlayCur = this.overlayToken(stream, state)
            state.overlayPos = stream.pos
          }
          stream.pos = Math.min(state.basePos, state.overlayPos)

          if (state.overlayCur == null) {
            return state.baseCur
          } else if (state.baseCur != null && state.combineTokens) {
            return state.baseCur + ' ' + state.overlayCur
          } else {
            return state.overlayCur
          }
        },
        overlayToken: function(stream, state) {
          state.combineTokens = false

          if (state.fencedEndRE && stream.match(state.fencedEndRE)) {
            state.fencedEndRE = null
            state.localMode = null
            state.localState = null

            return null
          }

          if (state.localMode) {
            return state.localMode.token(stream, state.localState) || ''
          }

          const match = stream.match(fencedCodeRE, true)
          if (match) {
            state.fencedEndRE = new RegExp(match[1] + '+ *$')

            state.localMode = getMode(
              match[2],
              match[3],
              config,
              stream.lineOracle.doc.cm
            )
            if (state.localMode) {
              state.localState = CodeMirror.startState(state.localMode)
            }

            return null
          }

          state.combineTokens = true

          if (state.inTable) {
            if (stream.match(/^\|/)) {
              ++state.rowIndex

              stream.skipToEnd()

              if (state.rowIndex === 1) {
                return 'table table-separator'
              } else if (state.rowIndex % 2 === 0) {
                return 'table table-row table-row-even'
              } else {
                return 'table table-row table-row-odd'
              }
            } else {
              state.inTable = false

              stream.skipToEnd()
              return null
            }
          } else if (stream.match(/^\|/)) {
            state.inTable = true
            state.rowIndex = 0

            stream.skipToEnd()
            return 'table table-header'
          }

          stream.skipToEnd()
          return null
        },
        electricChars: baseMode.electricChars,
        innerMode: function(state) {
          if (state.fencedMode) {
            return {
              mode: state.fencedMode,
              state: state.fencedState
            }
          } else {
            return {
              mode: baseMode,
              state: state.baseState
            }
          }
        },
        blankLine: function(state) {
          state.inTable = false

          if (state.fencedMode) {
            return (
              state.fencedMode.blankLine &&
              state.fencedMode.blankLine(state.fencedState)
            )
          } else {
            return baseMode.blankLine(state.baseState)
          }
        }
      }
    },
    'yaml-frontmatter'
  )

  CodeMirror.defineMIME('text/x-bfm', 'bfm')

  CodeMirror.modeInfo.push({
    name: 'Boost Flavored Markdown',
    mime: 'text/x-bfm',
    mode: 'bfm'
  })
})
