const crypto = require('crypto')
const uuidv4 = require('uuid/v4')

module.exports = function(uuid) {
  if (typeof uuid === typeof true && uuid) {
    return uuidv4()
  }
  const length = 10
  return crypto.randomBytes(length).toString('hex')
}
