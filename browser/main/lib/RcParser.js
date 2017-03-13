import _ from 'lodash'

const path = require('path')
const sander = require('sander')

function parse (boostnotercPath) {
  if (!sander.existsSync(boostnotercPath)) return
  let config = JSON.parse(sander.readFileSync(boostnotercPath).toString())
  return config
}

function exec (boostnotercPath) {
  const config = this.parse(boostnotercPath)
  if (config.execs === undefined) return
  _.forEach(config.execs, (exec) => {
    eval(exec)
  })
}

export default {
  parse,
  exec
}
