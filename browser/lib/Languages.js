const languages = [
  {
    name: 'Albanian',
    locale: 'sq'
  },
  {
    name: 'Chinese (zh-CN)',
    locale: 'zh-CN'
  },
  {
    name: 'Chinese (zh-TW)',
    locale: 'zh-TW'
  },
  {
    name: 'Czech',
    locale: 'cs'
  },
  {
    name: 'Danish',
    locale: 'da'
  },
  {
    name: 'English',
    locale: 'en'
  },
  {
    name: 'French',
    locale: 'fr'
  },
  {
    name: 'German',
    locale: 'de'
  },
  {
    name: 'Hungarian',
    locale: 'hu'
  },
  {
    name: 'Japanese',
    locale: 'ja'
  },
  {
    name: 'Korean',
    locale: 'ko'
  },
  {
    name: 'Norwegian',
    locale: 'no'
  },
  {
    name: 'Polish',
    locale: 'pl'
  },
  {
    name: 'Portuguese (PT-BR)',
    locale: 'pt-BR'
  },
  {
    name: 'Portuguese (PT-PT)',
    locale: 'pt-PT'
  },
  {
    name: 'Russian',
    locale: 'ru'
  },
  {
    name: 'Spanish',
    locale: 'es-ES'
  },
  {
    name: 'Turkish',
    locale: 'tr'
  },
  {
    name: 'Thai',
    locale: 'th'
  }
]

module.exports = {
  getLocales() {
    return languages.reduce(function(localeList, locale) {
      localeList.push(locale.locale)
      return localeList
    }, [])
  },
  getLanguages() {
    return languages
  }
}
