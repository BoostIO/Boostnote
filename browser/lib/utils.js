export function lastFindInArray(array, callback) {
  for (let i = array.length - 1; i >= 0; --i) {
    if (callback(array[i], i, array)) {
      return array[i]
    }
  }
}

export function escapeHtmlCharacters(
  html,
  opt = { detectCodeBlock: false, skipSingleQuote: false }
) {
  const matchHtmlRegExp = /["'&<>]/g
  const matchCodeBlockRegExp = /```/g
  const escapes = ['&quot;', '&amp;', '&#39;', '&lt;', '&gt;']
  let match = null
  const replaceAt = (str, index, replace) =>
    str.substr(0, index) +
    replace +
    str.substr(index + replace.length - (replace.length - 1))

  while ((match = matchHtmlRegExp.exec(html)) !== null) {
    const current = { char: match[0], index: match.index }
    const codeBlockIndexs = []
    let openCodeBlock = null
    // if the detectCodeBlock option is activated then this function should skip
    // characters that needed to be escape but located in code block
    if (opt.detectCodeBlock) {
      // The first type of code block is lines that start with 4 spaces
      // Here we check for the \n character located before the character that
      // needed to be escape. It means we check for the begining of the line that
      // contain that character, then we check if there are 4 spaces next to the
      // \n character (the line start with 4 spaces)
      let previousLineEnd = current.index - 1
      while (html[previousLineEnd] !== '\n' && previousLineEnd !== -1) {
        previousLineEnd--
      }
      // 4 spaces means this character is in a code block
      if (
        html[previousLineEnd + 1] === ' ' &&
        html[previousLineEnd + 2] === ' ' &&
        html[previousLineEnd + 3] === ' ' &&
        html[previousLineEnd + 4] === ' '
      ) {
        // skip the current character
        continue
      }
      // The second type of code block is lines that wrapped in ```
      // We will get the position of each ```
      // then push it into an array
      // then the array returned will be like this:
      // [startCodeblock, endCodeBlock, startCodeBlock, endCodeBlock]
      while ((openCodeBlock = matchCodeBlockRegExp.exec(html)) !== null) {
        codeBlockIndexs.push(openCodeBlock.index)
      }
      let shouldSkipChar = false
      // we loop through the array of positions
      // we skip 2 element as the i index position is the position of ``` that
      // open the codeblock and the i + 1 is the position of the ``` that close
      // the code block
      for (let i = 0; i < codeBlockIndexs.length; i += 2) {
        // the i index position is the position of the ``` that open code block
        // so we have to + 2 as that position is the position of the first ` in the ````
        // but we need to make sure that the position current character is larger
        // that the last ` in the ``` that open the code block so we have to take
        // the position of the first ` and + 2
        // the i + 1 index position is the closing ``` so the char must less than it
        if (
          current.index > codeBlockIndexs[i] + 2 &&
          current.index < codeBlockIndexs[i + 1]
        ) {
          // skip it
          shouldSkipChar = true
          break
        }
      }
      if (shouldSkipChar) {
        // skip the current character
        continue
      }
    }
    // otherwise, escape it !!!
    if (current.char === '&') {
      // when escaping character & we have to be becareful as the & could be a part
      // of an escaped character like &quot; will be came &amp;quot;
      let nextStr = ''
      let nextIndex = current.index
      let escapedStr = false
      // maximum length of an escaped string is 5. For example ('&quot;')
      // we take the next 5 character of the next string if it is one of the string:
      // ['&quot;', '&amp;', '&#39;', '&lt;', '&gt;'] then we will not escape the & character
      // as it is a part of the escaped string and should not be escaped
      while (nextStr.length <= 5) {
        nextStr += html[nextIndex]
        nextIndex++
        if (escapes.indexOf(nextStr) !== -1) {
          escapedStr = true
          break
        }
      }
      if (!escapedStr) {
        // this & char is not a part of an escaped string
        html = replaceAt(html, current.index, '&amp;')
      }
    } else if (current.char === '"') {
      html = replaceAt(html, current.index, '&quot;')
    } else if (current.char === "'" && !opt.skipSingleQuote) {
      html = replaceAt(html, current.index, '&#39;')
    } else if (current.char === '<') {
      html = replaceAt(html, current.index, '&lt;')
    } else if (current.char === '>') {
      html = replaceAt(html, current.index, '&gt;')
    }
  }
  return html
}

export function isObjectEqual(a, b) {
  const aProps = Object.getOwnPropertyNames(a)
  const bProps = Object.getOwnPropertyNames(b)

  if (aProps.length !== bProps.length) {
    return false
  }

  for (var i = 0; i < aProps.length; i++) {
    const propName = aProps[i]
    if (a[propName] !== b[propName]) {
      return false
    }
  }
  return true
}

export function isMarkdownTitleURL(str) {
  return /(^#{1,6}\s)(?:\w+:|^)\/\/(?:[^\s\.]+\.\S{2}|localhost[\:?\d]*)/.test(
    str
  )
}

export function humanFileSize(bytes) {
  const threshold = 1000
  if (Math.abs(bytes) < threshold) {
    return bytes + ' B'
  }
  var units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  var u = -1
  do {
    bytes /= threshold
    ++u
  } while (Math.abs(bytes) >= threshold && u < units.length - 1)
  return bytes.toFixed(1) + ' ' + units[u]
}

export default {
  lastFindInArray,
  escapeHtmlCharacters,
  isObjectEqual,
  isMarkdownTitleURL,
  humanFileSize
}
