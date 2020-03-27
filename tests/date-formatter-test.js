/**
 * @fileoverview Unit test for browser/lib/date-formatter.js
 */
const test = require('ava')
const { formatDate } = require('browser/lib/date-formatter')

test(t => {
  t.throws(() => formatDate('invalid argument'), 'Invalid argument.')
})
