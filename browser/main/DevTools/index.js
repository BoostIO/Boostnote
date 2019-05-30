/* eslint-disable no-undef */
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line global-require
  module.exports = require('./index.dev').default
} else {
  // eslint-disable-next-line global-require
  module.exports = require('./index.prod').default
}
