import copyFile from 'browser/main/lib/dataApi/copyFile'
import { findStorage } from 'browser/lib/findStorage'

const fs = require('fs')
const path = require('path')

const attachmentManagement = require('./attachmentManagement')

/**
 * Export note together with attachments
 *
 * If attachments are stored in the storage, creates 'attachments' subfolder in target directory
 * and copies attachments to it. Changes links to images in the content of the note
 *
 * @param {String} nodeKey key of the node that should be exported
 * @param {String} storageKey or storage path
 * @param {String} noteContent Content to export
 * @param {String} targetPath Path to exported file
 * @param {function} outputFormatter
 * @return {Promise.<*[]>}
 */
function exportNote(
  nodeKey,
  storageKey,
  noteContent,
  targetPath,
  outputFormatter
) {
  const storagePath = path.isAbsolute(storageKey)
    ? storageKey
    : findStorage(storageKey).path
  const exportTasks = []

  if (!storagePath) {
    throw new Error('Storage path is not found')
  }
  const attachmentsAbsolutePaths = attachmentManagement.getAbsolutePathsOfAttachmentsInContent(
    noteContent,
    storagePath
  )
  attachmentsAbsolutePaths.forEach(attachment => {
    exportTasks.push({
      src: attachment,
      dst: attachmentManagement.DESTINATION_FOLDER
    })
  })

  let exportedData = attachmentManagement.removeStorageAndNoteReferences(
    noteContent,
    nodeKey
  )

  if (outputFormatter) {
    exportedData = outputFormatter(exportedData, exportTasks, targetPath)
  } else {
    exportedData = Promise.resolve(exportedData)
  }

  const tasks = prepareTasks(exportTasks, storagePath, path.dirname(targetPath))

  return Promise.all(tasks.map(task => copyFile(task.src, task.dst)))
    .then(() => exportedData)
    .then(data => {
      return saveToFile(data, targetPath)
    })
    .catch(err => {
      rollbackExport(tasks)
      throw err
    })
}

function prepareTasks(tasks, storagePath, targetPath) {
  return tasks.map(task => {
    if (!path.isAbsolute(task.src)) {
      task.src = path.join(storagePath, task.src)
    }

    if (!path.isAbsolute(task.dst)) {
      task.dst = path.join(targetPath, task.dst)
    }

    return task
  })
}

function saveToFile(data, filename) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, err => {
      if (err) return reject(err)

      resolve(filename)
    })
  })
}

/**
 * Remove exported files
 * @param tasks Array of copy task objects. Object consists of two mandatory fields – `src` and `dst`
 */
function rollbackExport(tasks) {
  const folders = new Set()
  tasks.forEach(task => {
    let fullpath = task.dst

    if (!path.extname(task.dst)) {
      fullpath = path.join(task.dst, path.basename(task.src))
    }

    if (fs.existsSync(fullpath)) {
      fs.unlink(fullpath)
      folders.add(path.dirname(fullpath))
    }
  })

  folders.forEach(folder => {
    if (fs.readdirSync(folder).length === 0) {
      fs.rmdir(folder)
    }
  })
}

export default exportNote
