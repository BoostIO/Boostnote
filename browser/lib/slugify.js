import diacritics from 'diacritics-map'

function replaceDiacritics (str) {
  return str.replace(/[À-ž]/g, function (ch) {
    return diacritics[ch] || ch
  })
}

module.exports = function slugify (title) {
  let slug = title.trim()

  slug = replaceDiacritics(slug)

  slug = slug.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')

  return encodeURI(slug).replace(/\-+$/, '')
}
