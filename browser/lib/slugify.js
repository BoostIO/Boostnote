import diacritics from 'diacritics-map'

function replaceDiacritics (str) {
  return str.replace(/[À-ž]/g, function (ch) {
    return diacritics[ch] || ch
  })
}

module.exports = function slugify (title) {
  const slug = encodeURI(
    title.trim()
      .toLowerCase()
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')
      .replace(/\s+/g, '-')
      .replace(/[\]\[\!\'\#\$\%\&\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~\`]/g, '')
  )

  return slug
}
