const path = require('path')
const sander = require('sander')

function parse (boostnotercPath) {
  if (!sander.existsSync(boostnotercPath)) return {}
  return JSON.parse(sander.readFileSync(boostnotercPath).toString())
}

export default {
  parse
}
