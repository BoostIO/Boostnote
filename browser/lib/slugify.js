module.exports = function slugify(title) {
  const slug = encodeURI(
    title
      .trim()
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')
      .replace(/\s+/g, '-')
      .replace(
        /[\]\[\!\'\#\$\%\&\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\{\|\}\~\`]/g,
        ''
      )
  )

  return slug
}
