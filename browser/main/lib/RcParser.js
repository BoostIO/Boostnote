import path from 'path'
import sander from 'sander'

function parse (boostnotercPath) {
  if (!sander.existsSync(boostnotercPath)) return {}
  return JSON.parse(sander.readFileSync(boostnotercPath).toString())
}

export default {
  parse
}
