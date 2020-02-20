import path from 'path'
import sander from 'sander'

const BOOSTNOTERC = '.boostnoterc'
const homePath = global.process.env.HOME || global.process.env.USERPROFILE
const _boostnotercPath = path.join(homePath, BOOSTNOTERC)

export function parse(boostnotercPath = _boostnotercPath) {
  if (!sander.existsSync(boostnotercPath)) return {}
  try {
    return JSON.parse(sander.readFileSync(boostnotercPath).toString())
  } catch (e) {
    console.warn(e)
    console.warn("Your .boostnoterc is broken so it's not used.")
    return {}
  }
}

export default {
  parse
}
