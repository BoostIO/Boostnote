import CodeMirror from 'codemirror'
import 'codemirror-mode-elixir'

CodeMirror.modeInfo.push({ name: 'Stylus', mime: 'text/x-styl', mode: 'stylus', ext: ['styl'], alias: ['styl'] })
CodeMirror.modeInfo.push({ name: 'Elixir', mime: 'text/x-elixir', mode: 'elixir', ext: ['ex'] })
