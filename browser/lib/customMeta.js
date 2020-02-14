import CodeMirror from 'codemirror'
import 'codemirror-mode-elixir'

const stylusCodeInfo = CodeMirror.modeInfo.find(info => info.name === 'Stylus')
if (stylusCodeInfo == null) {
  CodeMirror.modeInfo.push({
    name: 'Stylus',
    mime: 'text/x-styl',
    mode: 'stylus',
    ext: ['styl'],
    alias: ['styl']
  })
} else {
  stylusCodeInfo.alias = ['styl']
}
CodeMirror.modeInfo.push({
  name: 'Elixir',
  mime: 'text/x-elixir',
  mode: 'elixir',
  ext: ['ex']
})
