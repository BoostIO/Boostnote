const TurndownService = require('turndown')
const { gfm } = require('turndown-plugin-gfm')

export const createTurndownService = function() {
  const turndown = new TurndownService()
  turndown.use(gfm)
  turndown.remove('script')
  return turndown
}
