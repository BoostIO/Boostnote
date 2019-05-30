const test = require('ava')
const copyFile = require('browser/main/lib/dataApi/copyFile')

const path = require('path')
const fs = require('fs')
const os = require('os')
const execSync = require('child_process').execSync
const removeDirCommand = os.platform() === 'win32' ? 'rmdir /s /q ' : 'rm -rf '

const testFile = 'test.txt'
const srcFolder = path.join(__dirname, '🤔')
const srcPath = path.join(srcFolder, testFile)
const dstFolder = path.join(__dirname, '😇')
const dstPath = path.join(dstFolder, testFile)

test.before((t) => {
  if (!fs.existsSync(srcFolder)) fs.mkdirSync(srcFolder)

  fs.writeFileSync(srcPath, 'test')
})

test('`copyFile` should handle encoded URI on src path', (t) => {
  return copyFile(encodeURI(srcPath), dstPath)
    .then(() => {
      t.true(true)
    })
    .catch(() => {
      t.true(false)
    })
})

test.after((t) => {
  fs.unlinkSync(srcPath)
  fs.unlinkSync(dstPath)
  execSync(removeDirCommand + '"' + srcFolder + '"')
  execSync(removeDirCommand + '"' + dstFolder + '"')
})

