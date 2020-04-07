import browserEnv from 'browser-env'
browserEnv(['window', 'document', 'navigator'])

// for CodeMirror mockup
document.body.createTextRange = function() {
  return {
    setEnd: function() {},
    setStart: function() {},
    getBoundingClientRect: function() {
      return { right: 0 }
    },
    getClientRects: function() {
      return {
        length: 0,
        left: 0,
        right: 0
      }
    }
  }
}

window.localStorage = {
  // polyfill
  getItem() {
    return '{}'
  }
}
