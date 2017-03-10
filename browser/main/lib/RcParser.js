const path = require('path')
const sander = require('sander')

function parse (boostnotercPath) {
  if (!sander.existsSync(boostnotercPath)) return
  let config = JSON.parse(sander.readFileSync(boostnotercPath).toString())
  return config
}

export default {
  parse
}
