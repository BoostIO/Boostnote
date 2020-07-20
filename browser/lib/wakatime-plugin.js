import config from 'browser/main/lib/ConfigManager'
const exec = require('child_process').exec
const path = require('path')
let lastHeartbeat = 0

function sendWakatimeHeartBeat(
  storagePath,
  noteKey,
  storageName,
  { isWrite, hasFileChanges, isFileChange }
) {
  if (
    config.get().wakatime.isActive &&
    !!config.get().wakatime.key &&
    (new Date().getTime() - lastHeartbeat > 120000 || isFileChange)
  ) {
    const notePath = path.join(storagePath, 'notes', noteKey + '.cson')

    if (!isWrite && !hasFileChanges && !isFileChange) {
      return
    }

    lastHeartbeat = new Date()
    const wakatimeKey = config.get().wakatime.key
    if (wakatimeKey) {
      exec(
        `wakatime --file ${notePath} --project '${storageName}' --key ${wakatimeKey}  --plugin Boostnote-wakatime`,
        (error, stdOut, stdErr) => {
          if (error) {
            console.log(error)
            lastHeartbeat = 0
          } else {
            console.log(
              'wakatime',
              'isWrite',
              isWrite,
              'hasChanges',
              hasFileChanges,
              'isFileChange',
              isFileChange
            )
          }
        }
      )
    }
  }
}

export { sendWakatimeHeartBeat }
