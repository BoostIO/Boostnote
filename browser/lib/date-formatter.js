/**
 * @fileoverview Formatting date string.
 */
import moment from 'moment'

/**
 * @description Return date string. For example, 'Sep.9, 2016 12:00'.
 * @param {mixed}
 * @return {string}
 */
export function formatDate(date) {
  const m = moment(date)
  if (!m.isValid()) {
    throw Error('Invalid argument.')
  }

  return m.format('MMM D, gggg H:mm')
}
