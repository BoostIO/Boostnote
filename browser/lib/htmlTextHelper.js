/**
 * @fileoverview Text trimmer for html.
 */

/**
 * @param {string} text
 * @return {string}
 */

export function decodeEntities(text) {
  var entities = [
    ['apos', "'"],
    ['amp', '&'],
    ['lt', '<'],
    ['gt', '>'],
    ['#63', '\\?'],
    ['#36', '\\$']
  ]

  for (var i = 0, max = entities.length; i < max; ++i) {
    text = text.replace(new RegExp(`&${entities[i][0]};`, 'g'), entities[i][1])
  }

  return text
}

export function encodeEntities(text) {
  const entities = [
    ["'", 'apos'],
    ['<', 'lt'],
    ['>', 'gt'],
    ['\\?', '#63'],
    ['\\$', '#36']
  ]

  entities.forEach(entity => {
    text = text.replace(new RegExp(entity[0], 'g'), `&${entity[1]};`)
  })
  return text
}

export default {
  decodeEntities,
  encodeEntities
}
