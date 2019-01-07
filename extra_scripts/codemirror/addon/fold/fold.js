(function (mod) {
  if (typeof exports === 'object' && typeof module === 'object') { // Common JS
    mod(require('../codemirror/lib/codemirror'))
  } else if (typeof define === 'function' && define.amd) { // AMD
    define(['../codemirror/lib/codemirror'], mod)
  } else { // Plain browser env
    mod(CodeMirror)
  }
})(function (CodeMirror) {
  CodeMirror.commands.foldLevel1 = function(cm) {
    cm.operation(function() {
      foldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 1)
    })
  }

  CodeMirror.commands.foldLevel2 = function(cm) {
    cm.operation(function() {
      foldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 2)
    })
  }

  CodeMirror.commands.foldLevel3 = function(cm) {
    cm.operation(function() {
      foldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 3)
    })
  }

  CodeMirror.commands.foldLevel4 = function(cm) {
    cm.operation(function() {
      foldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 4)
    })
  }

  CodeMirror.commands.foldLevel5 = function(cm) {
    cm.operation(function() {
      foldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 5)
    })
  }

  CodeMirror.commands.foldLevel6 = function(cm) {
    cm.operation(function() {
      foldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 6)
    })
  }

  CodeMirror.commands.foldLevel7 = function(cm) {
    cm.operation(function() {
      foldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 7)
    })
  }

  CodeMirror.commands.foldLevel8 = function(cm) {
    cm.operation(function() {
      foldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 8)
    })
  }

  CodeMirror.commands.foldLevel9 = function(cm) {
    cm.operation(function() {
      foldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 9)
    })
  }

  CodeMirror.commands.unfoldLevel1 = function(cm) {
    cm.operation(function() {
      unfoldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 1)
    })
  }

  CodeMirror.commands.unfoldLevel2 = function(cm) {
    cm.operation(function() {
      unfoldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 2)
    })
  }

  CodeMirror.commands.unfoldLevel3 = function(cm) {
    cm.operation(function() {
      unfoldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 3)
    })
  }

  CodeMirror.commands.unfoldLevel4 = function(cm) {
    cm.operation(function() {
      unfoldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 4)
    })
  }

  CodeMirror.commands.unfoldLevel5 = function(cm) {
    cm.operation(function() {
      unfoldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 5)
    })
  }

  CodeMirror.commands.unfoldLevel6 = function(cm) {
    cm.operation(function() {
      unfoldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 6)
    })
  }

  CodeMirror.commands.unfoldLevel7 = function(cm) {
    cm.operation(function() {
      unfoldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 7)
    })
  }

  CodeMirror.commands.unfoldLevel8 = function(cm) {
    cm.operation(function() {
      unfoldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 8)
    })
  }

  CodeMirror.commands.unfoldLevel9 = function(cm) {
    cm.operation(function() {
      unfoldLevel(cm, cm.firstLine(), cm.lastLine(), 0, 9)
    })
  }

  function foldLevel(cm, firstLine, lastLine, current, target) {
    let line = firstLine
    while (line <= lastLine) {
      const pos = CodeMirror.Pos(line, 0)
      const fold = CodeMirror.fold.auto(cm, pos)
      if (fold) {
        if (current + 1 === target) {
          cm.foldCode(pos, null, 'fold')
        } else {
          foldLevel(cm, fold.from.line + 1, fold.to.line - 1, current + 1, target)
        }

        line = fold.to.line
      } else {
        ++line
      }
    }
  }

  function unfoldLevel(cm, firstLine, lastLine, current, target) {
    let line = firstLine
    while (line <= lastLine) {
      const pos = CodeMirror.Pos(line, 0)
      const fold = CodeMirror.fold.auto(cm, pos)
      if (fold) {
        if (current + 1 === target) {
          cm.foldCode(pos, null, 'unfold')
        } else {
          unfoldLevel(cm, fold.from.line + 1, fold.to.line - 1, current + 1, target)
        }

        line = fold.to.line
      } else {
        ++line
      }
    }
  }
})