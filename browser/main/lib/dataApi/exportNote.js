import copyFile from 'browser/main/lib/dataApi/copyFile'
import { findStorage } from 'browser/lib/findStorage'

const fs = require('fs')
const path = require('path')

/**
 * Export note together with images
 *
 * If images is stored in the storage, creates 'images' subfolder in target directory
 * and copies images to it. Changes links to images in the content of the note
 *
 * @param {String} storageKey or storage path
 * @param {String} noteContent Content to export
 * @param {String} targetPath Path to exported file
 * @param {function} outputFormatter
 * @return {Promise.<*[]>}
 */
function exportNote (storageKey, noteContent, targetPath, outputFormatter) {
  const storagePath = path.isAbsolute(storageKey) ? storageKey : findStorage(storageKey).path
  const exportTasks = []

  if (!storagePath) {
    throw new Error('Storage path is not found')
  }

  let exportedData = noteContent

  if (outputFormatter) {
    exportedData = outputFormatter(exportedData, exportTasks)
  }

  const tasks = prepareTasks(exportTasks, storagePath, path.dirname(targetPath))

  return Promise.all(tasks.map((task) => copyFile(task.src, task.dst)))
  .then(() => {
    return saveToFile(exportedData, targetPath)
  }).catch((err) => {
    rollbackExport(tasks)
    throw err
  })
}

function prepareTasks (tasks, storagePath, targetPath) {
  return tasks.map((task) => {
    if (!path.isAbsolute(task.src)) {
      task.src = path.join(storagePath, task.src)
    }

    if (!path.isAbsolute(task.dst)) {
      task.dst = path.join(targetPath, task.dst)
    }

    return task
  })
}

function saveToFile (data, filename) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err) => {
      if (err) return reject(err)

      resolve(filename)
    })
  })
}

/**
 * Remove exported files
 * @param tasks Array of copy task objects. Object consists of two mandatory fields – `src` and `dst`
 */
function rollbackExport (tasks) {
  const folders = new Set()
  tasks.forEach((task) => {
    let fullpath = task.dst

    if (!path.extname(task.dst)) {
      fullpath = path.join(task.dst, path.basename(task.src))
    }

    if (fs.existsSync(fullpath)) {
      fs.unlink(fullpath)
      folders.add(path.dirname(fullpath))
    }
  })

  folders.forEach((folder) => {
    if (fs.readdirSync(folder).length === 0) {
      fs.rmdir(folder)
    }
  })
}

export default exportNote
