const uniqueSlug = require('unique-slug')
const fs = require('fs')
const path = require('path')
const findStorage = require('browser/lib/findStorage')
const mdurl = require('mdurl')
const fse = require('fs-extra')
const escapeStringRegexp = require('escape-string-regexp')
const sander = require('sander')
const url = require('url')
import i18n from 'browser/lib/i18n'
import { isString } from 'lodash'

const STORAGE_FOLDER_PLACEHOLDER = ':storage'
const DESTINATION_FOLDER = 'attachments'
const PATH_SEPARATORS =
  escapeStringRegexp(path.posix.sep) + escapeStringRegexp(path.win32.sep)
/**
 * @description
 * Create a Image element to get the real size of image.
 * @param {File} file the File object dropped.
 * @returns {Promise<Image>} Image element created
 */
function getImage(file) {
  if (isString(file)) {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.src = file
    })
  } else {
    return new Promise(resolve => {
      const reader = new FileReader()
      const img = new Image()
      img.onload = () => resolve(img)
      reader.onload = e => {
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }
}

/**
 * @description
 * Get the orientation info from iamges's EXIF data.
 * case 1: The 0th row is at the visual top of the image, and the 0th column is the visual left-hand side.
 * case 2: The 0th row is at the visual top of the image, and the 0th column is the visual right-hand side.
 * case 3: The 0th row is at the visual bottom of the image, and the 0th column is the visual right-hand side.
 * case 4: The 0th row is at the visual bottom of the image, and the 0th column is the visual left-hand side.
 * case 5: The 0th row is the visual left-hand side of the image, and the 0th column is the visual top.
 * case 6: The 0th row is the visual right-hand side of the image, and the 0th column is the visual top.
 * case 7: The 0th row is the visual right-hand side of the image, and the 0th column is the visual bottom.
 * case 8: The 0th row is the visual left-hand side of the image, and the 0th column is the visual bottom.
 * Other: reserved
 * ref: http://sylvana.net/jpegcrop/exif_orientation.html
 * @param {File} file the File object dropped.
 * @returns {Promise<Number>} Orientation info
 */
function getOrientation(file) {
  const getData = arrayBuffer => {
    const view = new DataView(arrayBuffer)

    // Not start with SOI(Start of image) Marker return fail value
    if (view.getUint16(0, false) !== 0xffd8) return -2
    const length = view.byteLength
    let offset = 2
    while (offset < length) {
      const marker = view.getUint16(offset, false)
      offset += 2
      // Loop and seed for APP1 Marker
      if (marker === 0xffe1) {
        // return fail value if it isn't EXIF data
        if (view.getUint32((offset += 2), false) !== 0x45786966) {
          return -1
        }
        // Read TIFF header,
        // First 2bytes defines byte align of TIFF data.
        // If it is 0x4949="II", it means "Intel" type byte align.
        // If it is 0x4d4d="MM", it means "Motorola" type byte align
        const little = view.getUint16((offset += 6), false) === 0x4949
        offset += view.getUint32(offset + 4, little)
        const tags = view.getUint16(offset, little) // Get TAG number
        offset += 2
        for (let i = 0; i < tags; i++) {
          // Loop to find Orientation TAG and return the value
          if (view.getUint16(offset + i * 12, little) === 0x0112) {
            return view.getUint16(offset + i * 12 + 8, little)
          }
        }
      } else if ((marker & 0xff00) !== 0xff00) {
        // If not start with 0xFF, not a Marker.
        break
      } else {
        offset += view.getUint16(offset, false)
      }
    }
    return -1
  }
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = event => resolve(getData(event.target.result))
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024))
  })
}
/**
 * @description
 * Rotate image file to correct direction.
 * Create a canvas and draw the image with correct direction, then export to base64 format.
 * @param {*} file the File object dropped.
 * @return {String} Base64 encoded image.
 */
function fixRotate(file) {
  return Promise.all([getImage(file), getOrientation(file)]).then(
    ([img, orientation]) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (orientation > 4 && orientation < 9) {
        canvas.width = img.height
        canvas.height = img.width
      } else {
        canvas.width = img.width
        canvas.height = img.height
      }
      switch (orientation) {
        case 2:
          ctx.transform(-1, 0, 0, 1, img.width, 0)
          break
        case 3:
          ctx.transform(-1, 0, 0, -1, img.width, img.height)
          break
        case 4:
          ctx.transform(1, 0, 0, -1, 0, img.height)
          break
        case 5:
          ctx.transform(0, 1, 1, 0, 0, 0)
          break
        case 6:
          ctx.transform(0, 1, -1, 0, img.height, 0)
          break
        case 7:
          ctx.transform(0, -1, -1, 0, img.height, img.width)
          break
        case 8:
          ctx.transform(0, -1, 1, 0, 0, img.width)
          break
        default:
          break
      }
      ctx.drawImage(img, 0, 0)
      return canvas.toDataURL()
    }
  )
}

/**
 * @description
 * Copies a copy of an attachment to the storage folder specified by the given key and return the generated attachment name.
 * Renames the file to match a unique file name.
 *
 * @param {String} sourceFilePath The source path of the attachment to be copied
 * @param {String} storageKey Storage key of the destination storage
 * @param {String} noteKey Key of the current note. Will be used as subfolder in :storage
 * @param {boolean} useRandomName determines whether a random filename for the new file is used. If false the source file name is used
 * @return {Promise<String>} name (inclusive extension) of the generated file
 */
function copyAttachment(
  sourceFilePath,
  storageKey,
  noteKey,
  useRandomName = true
) {
  return new Promise((resolve, reject) => {
    if (!sourceFilePath) {
      reject('sourceFilePath has to be given')
    }

    if (!storageKey) {
      reject('storageKey has to be given')
    }

    if (!noteKey) {
      reject('noteKey has to be given')
    }

    try {
      const isBase64 =
        typeof sourceFilePath === 'object' && sourceFilePath.type === 'base64'
      if (!isBase64 && !fs.existsSync(sourceFilePath)) {
        return reject('source file does not exist')
      }

      const sourcePath = sourceFilePath.sourceFilePath || sourceFilePath
      const sourceURL = url.parse(
        /^\w+:\/\//.test(sourcePath) ? sourcePath : 'file:///' + sourcePath
      )

      let destinationName
      if (useRandomName) {
        destinationName = `${uniqueSlug()}${path.extname(sourceURL.pathname) ||
          '.png'}`
      } else {
        destinationName = path.basename(sourceURL.pathname)
      }

      const targetStorage = findStorage.findStorage(storageKey)
      const destinationDir = path.join(
        targetStorage.path,
        DESTINATION_FOLDER,
        noteKey
      )
      createAttachmentDestinationFolder(targetStorage.path, noteKey)
      const outputFile = fs.createWriteStream(
        path.join(destinationDir, destinationName)
      )

      if (isBase64) {
        const base64Data = sourceFilePath.data.replace(
          /^data:image\/\w+;base64,/,
          ''
        )
        const dataBuffer = Buffer.from(base64Data, 'base64')
        outputFile.write(dataBuffer, () => {
          resolve(destinationName)
        })
      } else {
        const inputFileStream = fs.createReadStream(sourceFilePath)
        inputFileStream.pipe(outputFile)
        inputFileStream.on('end', () => {
          resolve(destinationName)
        })
      }
    } catch (e) {
      return reject(e)
    }
  })
}

function createAttachmentDestinationFolder(destinationStoragePath, noteKey) {
  let destinationDir = path.join(destinationStoragePath, DESTINATION_FOLDER)
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir)
  }
  destinationDir = path.join(
    destinationStoragePath,
    DESTINATION_FOLDER,
    noteKey
  )
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir)
  }
}

/**
 * @description Moves attachments from the old location ('/images') to the new one ('/attachments/noteKey)
 * @param markdownContent of the current note
 * @param storagePath Storage path of the current note
 * @param noteKey Key of the current note
 */
function migrateAttachments(markdownContent, storagePath, noteKey) {
  if (
    noteKey !== undefined &&
    sander.existsSync(path.join(storagePath, 'images'))
  ) {
    const attachments = getAttachmentsInMarkdownContent(markdownContent) || []
    if (attachments.length) {
      createAttachmentDestinationFolder(storagePath, noteKey)
    }
    for (const attachment of attachments) {
      const attachmentBaseName = path.basename(attachment)
      const possibleLegacyPath = path.join(
        storagePath,
        'images',
        attachmentBaseName
      )
      if (sander.existsSync(possibleLegacyPath)) {
        const destinationPath = path.join(
          storagePath,
          DESTINATION_FOLDER,
          attachmentBaseName
        )
        if (!sander.existsSync(destinationPath)) {
          sander.copyFileSync(possibleLegacyPath).to(destinationPath)
        }
      }
    }
  }
}

/**
 * @description Fixes the URLs embedded in the generated HTML so that they again refer actual local files.
 * @param {String} renderedHTML HTML in that the links should be fixed
 * @param {String} storagePath Path of the current storage
 * @returns {String} postprocessed HTML in which all :storage references are mapped to the actual paths.
 */
function fixLocalURLS(renderedHTML, storagePath) {
  const encodedWin32SeparatorRegex = /%5C/g
  const storageRegex = new RegExp('/?' + STORAGE_FOLDER_PLACEHOLDER, 'g')
  const storageUrl =
    'file:///' + path.join(storagePath, DESTINATION_FOLDER).replace(/\\/g, '/')

  /*
    A :storage reference is like `:storage/3b6f8bd6-4edd-4b15-96e0-eadc4475b564/f939b2c3.jpg`.

    - `STORAGE_FOLDER_PLACEHOLDER` will match `:storage`
    - `(?:(?:\\\/|%5C)[-.\\w]+)+` will match `/3b6f8bd6-4edd-4b15-96e0-eadc4475b564/f939b2c3.jpg`
    - `(?:\\\/|%5C)[-.\\w]+` will either match `/3b6f8bd6-4edd-4b15-96e0-eadc4475b564` or `/f939b2c3.jpg`
    - `(?:\\\/|%5C)` match the path seperator. `\\\/` for posix systems and `%5C` for windows.
  */
  return renderedHTML.replace(
    new RegExp(
      '/?' + STORAGE_FOLDER_PLACEHOLDER + '(?:(?:\\/|%5C)[-.\\w]+)+',
      'g'
    ),
    function(match) {
      return match
        .replace(encodedWin32SeparatorRegex, '/')
        .replace(storageRegex, storageUrl)
    }
  )
}

/**
 * @description Generates the markdown code for a given attachment
 * @param {String} fileName Name of the attachment
 * @param {String} path Path of the attachment
 * @param {Boolean} showPreview Indicator whether the generated markdown should show a preview of the image. Note that at the moment only previews for images are supported
 * @returns {String} Generated markdown code
 */
function generateAttachmentMarkdown(fileName, path, showPreview) {
  return `${showPreview ? '!' : ''}[${fileName}](${path})`
}

/**
 * @description Handles the drop-event of a file. Includes the necessary markdown code and copies the file to the corresponding storage folder.
 * The method calls {CodeEditor#insertAttachmentMd()} to include the generated markdown at the needed place!
 * @param {CodeEditor} codeEditor Markdown editor. Its insertAttachmentMd() method will be called to include the markdown code
 * @param {String} storageKey Key of the current storage
 * @param {String} noteKey Key of the current note
 * @param {Event} dropEvent DropEvent
 */
function handleAttachmentDrop(codeEditor, storageKey, noteKey, dropEvent) {
  let promise
  if (dropEvent.dataTransfer.files.length > 0) {
    promise = Promise.all(
      Array.from(dropEvent.dataTransfer.files).map(file => {
        const filePath = file.path
        const fileType = file.type // EX) 'image/gif' or 'text/html'
        if (fileType.startsWith('image')) {
          if (fileType === 'image/gif' || fileType === 'image/svg+xml') {
            return copyAttachment(filePath, storageKey, noteKey).then(
              fileName => ({
                fileName,
                title: path.basename(filePath),
                isImage: true
              })
            )
          } else {
            return getOrientation(file)
              .then(orientation => {
                if (orientation === -1) {
                  // The image rotation is correct and does not need adjustment
                  return copyAttachment(filePath, storageKey, noteKey)
                } else {
                  return fixRotate(file).then(data =>
                    copyAttachment(
                      {
                        type: 'base64',
                        data: data,
                        sourceFilePath: filePath
                      },
                      storageKey,
                      noteKey
                    )
                  )
                }
              })
              .then(fileName => ({
                fileName,
                title: path.basename(filePath),
                isImage: true
              }))
          }
        } else {
          return copyAttachment(filePath, storageKey, noteKey).then(
            fileName => ({
              fileName,
              title: path.basename(filePath),
              isImage: false
            })
          )
        }
      })
    )
  } else {
    let imageURL = dropEvent.dataTransfer.getData('text/plain')

    if (!imageURL) {
      const match = /<img[^>]*[\s"']src="([^"]+)"/.exec(
        dropEvent.dataTransfer.getData('text/html')
      )
      if (match) {
        imageURL = match[1]
      }
    }

    if (!imageURL) {
      return
    }

    promise = Promise.all([
      getImage(imageURL)
        .then(image => {
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.width = image.width
          canvas.height = image.height
          context.drawImage(image, 0, 0)

          return copyAttachment(
            {
              type: 'base64',
              data: canvas.toDataURL(),
              sourceFilePath: imageURL
            },
            storageKey,
            noteKey
          )
        })
        .then(fileName => ({
          fileName,
          title: imageURL,
          isImage: true
        }))
    ])
  }

  promise.then(files => {
    const attachments = files
      .filter(file => !!file)
      .map(file =>
        generateAttachmentMarkdown(
          file.title,
          path.join(STORAGE_FOLDER_PLACEHOLDER, noteKey, file.fileName),
          file.isImage
        )
      )

    codeEditor.insertAttachmentMd(attachments.join('\n'))
  })
}

/**
 * @description Creates a new file in the storage folder belonging to the current note and inserts the correct markdown code
 * @param {CodeEditor} codeEditor Markdown editor. Its insertAttachmentMd() method will be called to include the markdown code
 * @param {String} storageKey Key of the current storage
 * @param {String} noteKey Key of the current note
 * @param {DataTransferItem} dataTransferItem Part of the past-event
 */
function handlePasteImageEvent(
  codeEditor,
  storageKey,
  noteKey,
  dataTransferItem
) {
  if (!codeEditor) {
    throw new Error('codeEditor has to be given')
  }
  if (!storageKey) {
    throw new Error('storageKey has to be given')
  }

  if (!noteKey) {
    throw new Error('noteKey has to be given')
  }
  if (!dataTransferItem) {
    throw new Error('dataTransferItem has to be given')
  }

  const blob = dataTransferItem.getAsFile()
  const reader = new FileReader()
  let base64data
  const targetStorage = findStorage.findStorage(storageKey)
  const destinationDir = path.join(
    targetStorage.path,
    DESTINATION_FOLDER,
    noteKey
  )
  createAttachmentDestinationFolder(targetStorage.path, noteKey)

  const imageName = `${uniqueSlug()}.png`
  const imagePath = path.join(destinationDir, imageName)

  reader.onloadend = function() {
    base64data = reader.result.replace(/^data:image\/png;base64,/, '')
    base64data += base64data.replace('+', ' ')
    const binaryData = new Buffer(base64data, 'base64').toString('binary')
    fs.writeFileSync(imagePath, binaryData, 'binary')
    const imageReferencePath = path.join(
      STORAGE_FOLDER_PLACEHOLDER,
      noteKey,
      imageName
    )
    const imageMd = generateAttachmentMarkdown(
      imageName,
      imageReferencePath,
      true
    )
    codeEditor.insertAttachmentMd(imageMd)
  }
  reader.readAsDataURL(blob)
}

/**
 * @description Creates a new file in the storage folder belonging to the current note and inserts the correct markdown code
 * @param {CodeEditor} codeEditor Markdown editor. Its insertAttachmentMd() method will be called to include the markdown code
 * @param {String} storageKey Key of the current storage
 * @param {String} noteKey Key of the current note
 * @param {NativeImage} image The native image
 */
function handlePasteNativeImage(codeEditor, storageKey, noteKey, image) {
  if (!codeEditor) {
    throw new Error('codeEditor has to be given')
  }
  if (!storageKey) {
    throw new Error('storageKey has to be given')
  }

  if (!noteKey) {
    throw new Error('noteKey has to be given')
  }
  if (!image) {
    throw new Error('image has to be given')
  }

  const targetStorage = findStorage.findStorage(storageKey)
  const destinationDir = path.join(
    targetStorage.path,
    DESTINATION_FOLDER,
    noteKey
  )

  createAttachmentDestinationFolder(targetStorage.path, noteKey)

  const imageName = `${uniqueSlug()}.png`
  const imagePath = path.join(destinationDir, imageName)

  const binaryData = image.toPNG()
  fs.writeFileSync(imagePath, binaryData, 'binary')

  const imageReferencePath = path.join(
    STORAGE_FOLDER_PLACEHOLDER,
    noteKey,
    imageName
  )
  const imageMd = generateAttachmentMarkdown(
    imageName,
    imageReferencePath,
    true
  )
  codeEditor.insertAttachmentMd(imageMd)
}

/**
 * @description Returns all attachment paths of the given markdown
 * @param {String} markdownContent content in which the attachment paths should be found
 * @returns {String[]} Array of the relative paths (starting with :storage) of the attachments of the given markdown
 */
function getAttachmentsInMarkdownContent(markdownContent) {
  const preparedInput = markdownContent.replace(
    new RegExp('[' + PATH_SEPARATORS + ']', 'g'),
    path.sep
  )
  const regexp = new RegExp(
    '/?' +
      STORAGE_FOLDER_PLACEHOLDER +
      '(' +
      escapeStringRegexp(path.sep) +
      ')' +
      '?([a-zA-Z0-9]|-)*' +
      '(' +
      escapeStringRegexp(path.sep) +
      ')' +
      '([a-zA-Z0-9]|\\.)+(\\.[a-zA-Z0-9]+)?',
    'g'
  )
  return preparedInput.match(regexp)
}

/**
 * @description Returns an array of the absolute paths of the attachments referenced in the given markdown code
 * @param {String} markdownContent content in which the attachment paths should be found
 * @param {String} storagePath path of the current storage
 * @returns {String[]} Absolute paths of the referenced attachments
 */
function getAbsolutePathsOfAttachmentsInContent(markdownContent, storagePath) {
  const temp = getAttachmentsInMarkdownContent(markdownContent) || []
  const result = []
  for (const relativePath of temp) {
    result.push(
      relativePath.replace(
        new RegExp(STORAGE_FOLDER_PLACEHOLDER, 'g'),
        path.join(storagePath, DESTINATION_FOLDER)
      )
    )
  }
  return result
}

/**
 * @description Copies the attachments to the storage folder and returns the mardown content it should be replaced with
 * @param {String} markDownContent content in which the attachment paths should be found
 * @param {String} filepath The path of the file with attachments to import
 * @param {String} storageKey Storage key of the destination storage
 * @param {String} noteKey Key of the current note. Will be used as subfolder in :storage
 */
function importAttachments(markDownContent, filepath, storageKey, noteKey) {
  return new Promise((resolve, reject) => {
    const nameRegex = /(!\[.*?]\()(.+?\..+?)(\))/g
    let attachPath = nameRegex.exec(markDownContent)
    const promiseArray = []
    const attachmentPaths = []
    const groupIndex = 2

    while (attachPath) {
      let attachmentPath = attachPath[groupIndex]
      attachmentPaths.push(attachmentPath)
      attachmentPath = path.isAbsolute(attachmentPath)
        ? attachmentPath
        : path.join(path.dirname(filepath), attachmentPath)
      promiseArray.push(
        this.copyAttachment(attachmentPath, storageKey, noteKey)
      )
      attachPath = nameRegex.exec(markDownContent)
    }

    let numResolvedPromises = 0

    if (promiseArray.length === 0) {
      resolve(markDownContent)
    }

    for (let j = 0; j < promiseArray.length; j++) {
      promiseArray[j]
        .then(fileName => {
          const newPath = path.join(
            STORAGE_FOLDER_PLACEHOLDER,
            noteKey,
            fileName
          )
          markDownContent = markDownContent.replace(attachmentPaths[j], newPath)
        })
        .catch(e => {
          console.error('File does not exist in path: ' + attachmentPaths[j])
        })
        .finally(() => {
          numResolvedPromises++
          if (numResolvedPromises === promiseArray.length) {
            resolve(markDownContent)
          }
        })
    }
  })
}

/**
 * @description Moves the attachments of the current note to the new location.
 * Returns a modified version of the given content so that the links to the attachments point to the new note key.
 * @param {String} oldPath Source of the note to be moved
 * @param {String} newPath Destination of the note to be moved
 * @param {String} noteKey Old note key
 * @param {String} newNoteKey New note key
 * @param {String} noteContent Content of the note to be moved
 * @returns {String} Modified version of noteContent in which the paths of the attachments are fixed
 */
function moveAttachments(oldPath, newPath, noteKey, newNoteKey, noteContent) {
  const src = path.join(oldPath, DESTINATION_FOLDER, noteKey)
  const dest = path.join(newPath, DESTINATION_FOLDER, newNoteKey)
  if (fse.existsSync(src)) {
    fse.moveSync(src, dest)
  }
  return replaceNoteKeyWithNewNoteKey(noteContent, noteKey, newNoteKey)
}

/**
 * Modifies the given content so that in all attachment references the oldNoteKey is replaced by the new one
 * @param noteContent content that should be modified
 * @param oldNoteKey note key to be replaced
 * @param newNoteKey note key serving as a replacement
 * @returns {String} modified note content
 */
function replaceNoteKeyWithNewNoteKey(noteContent, oldNoteKey, newNoteKey) {
  if (noteContent) {
    const preparedInput = noteContent.replace(
      new RegExp('[' + PATH_SEPARATORS + ']', 'g'),
      path.sep
    )
    return preparedInput.replace(
      new RegExp(
        STORAGE_FOLDER_PLACEHOLDER + escapeStringRegexp(path.sep) + oldNoteKey,
        'g'
      ),
      path.join(STORAGE_FOLDER_PLACEHOLDER, newNoteKey)
    )
  }
  return noteContent
}

/**
 * @description Deletes all :storage and noteKey references from the given input.
 * @param input Input in which the references should be deleted
 * @param noteKey Key of the current note
 * @returns {String} Input without the references
 */
function removeStorageAndNoteReferences(input, noteKey) {
  return input.replace(
    new RegExp('/?' + STORAGE_FOLDER_PLACEHOLDER + '.*?("|\\))', 'g'),
    function(match) {
      return match
        .replace(new RegExp(mdurl.encode(path.win32.sep), 'g'), path.posix.sep)
        .replace(new RegExp(mdurl.encode(path.posix.sep), 'g'), path.posix.sep)
        .replace(
          new RegExp(escapeStringRegexp(path.win32.sep), 'g'),
          path.posix.sep
        )
        .replace(
          new RegExp(escapeStringRegexp(path.posix.sep), 'g'),
          path.posix.sep
        )
        .replace(
          new RegExp(
            STORAGE_FOLDER_PLACEHOLDER +
              '(' +
              escapeStringRegexp(path.sep) +
              noteKey +
              ')?',
            'g'
          ),
          DESTINATION_FOLDER
        )
    }
  )
}

/**
 * @description Deletes the attachment folder specified by the given storageKey and noteKey
 * @param storageKey Key of the storage of the note to be deleted
 * @param noteKey Key of the note to be deleted
 */
function deleteAttachmentFolder(storageKey, noteKey) {
  const storagePath = findStorage.findStorage(storageKey)
  const noteAttachmentPath = path.join(
    storagePath.path,
    DESTINATION_FOLDER,
    noteKey
  )
  sander.rimrafSync(noteAttachmentPath)
}

/**
 * @description Deletes all attachments stored in the attachment folder of the give not that are not referenced in the markdownContent
 * @param markdownContent Content of the note. All unreferenced notes will be deleted
 * @param storageKey StorageKey of the current note. Is used to determine the belonging attachment folder.
 * @param noteKey NoteKey of the current note. Is used to determine the belonging attachment folder.
 */
function deleteAttachmentsNotPresentInNote(
  markdownContent,
  storageKey,
  noteKey
) {
  if (storageKey == null || noteKey == null || markdownContent == null) {
    return
  }
  const targetStorage = findStorage.findStorage(storageKey)
  const attachmentFolder = path.join(
    targetStorage.path,
    DESTINATION_FOLDER,
    noteKey
  )
  const attachmentsInNote = getAttachmentsInMarkdownContent(markdownContent)
  const attachmentsInNoteOnlyFileNames = []
  if (attachmentsInNote) {
    for (let i = 0; i < attachmentsInNote.length; i++) {
      attachmentsInNoteOnlyFileNames.push(
        attachmentsInNote[i].replace(
          new RegExp(
            STORAGE_FOLDER_PLACEHOLDER +
              escapeStringRegexp(path.sep) +
              noteKey +
              escapeStringRegexp(path.sep),
            'g'
          ),
          ''
        )
      )
    }
  }
  if (fs.existsSync(attachmentFolder)) {
    fs.readdir(attachmentFolder, (err, files) => {
      if (err) {
        console.error(
          'Error reading directory "' + attachmentFolder + '". Error:'
        )
        console.error(err)
        return
      }
      files.forEach(file => {
        if (!attachmentsInNoteOnlyFileNames.includes(file)) {
          const absolutePathOfFile = path.join(
            targetStorage.path,
            DESTINATION_FOLDER,
            noteKey,
            file
          )
          fs.unlink(absolutePathOfFile, err => {
            if (err) {
              console.error('Could not delete "%s"', absolutePathOfFile)
              console.error(err)
              return
            }
            console.info(
              'File "' +
                absolutePathOfFile +
                '" deleted because it was not included in the content of the note'
            )
          })
        }
      })
    })
  }
}

/**
 * @description Get all existing attachments related to a specific note
 including their status (in use or not) and their path. Return null if there're no attachment related to note or specified parametters are invalid
 * @param markdownContent markdownContent of the current note
 * @param storageKey StorageKey of the current note
 * @param noteKey NoteKey of the currentNote
 * @return {Promise<Array<{path: String, isInUse: bool}>>} Promise returning the
 list of attachments with their properties */
function getAttachmentsPathAndStatus(markdownContent, storageKey, noteKey) {
  if (storageKey == null || noteKey == null || markdownContent == null) {
    return null
  }
  let targetStorage = null
  try {
    targetStorage = findStorage.findStorage(storageKey)
  } catch (error) {
    console.warn(`No stroage found for: ${storageKey}`)
  }
  if (!targetStorage) {
    return null
  }
  const attachmentFolder = path.join(
    targetStorage.path,
    DESTINATION_FOLDER,
    noteKey
  )
  const attachmentsInNote = getAttachmentsInMarkdownContent(markdownContent)
  const attachmentsInNoteOnlyFileNames = []
  if (attachmentsInNote) {
    for (let i = 0; i < attachmentsInNote.length; i++) {
      attachmentsInNoteOnlyFileNames.push(
        attachmentsInNote[i].replace(
          new RegExp(
            STORAGE_FOLDER_PLACEHOLDER +
              escapeStringRegexp(path.sep) +
              noteKey +
              escapeStringRegexp(path.sep),
            'g'
          ),
          ''
        )
      )
    }
  }
  if (fs.existsSync(attachmentFolder)) {
    return new Promise((resolve, reject) => {
      fs.readdir(attachmentFolder, (err, files) => {
        if (err) {
          console.error(
            'Error reading directory "' + attachmentFolder + '". Error:'
          )
          console.error(err)
          reject(err)
          return
        }
        const attachments = []
        for (const file of files) {
          const absolutePathOfFile = path.join(
            targetStorage.path,
            DESTINATION_FOLDER,
            noteKey,
            file
          )
          if (!attachmentsInNoteOnlyFileNames.includes(file)) {
            attachments.push({ path: absolutePathOfFile, isInUse: false })
          } else {
            attachments.push({ path: absolutePathOfFile, isInUse: true })
          }
        }
        resolve(attachments)
      })
    })
  } else {
    return null
  }
}

/**
 * @description Remove all specified attachment paths
 * @param attachments attachment paths
 * @return {Promise} Promise after all attachments are removed */
function removeAttachmentsByPaths(attachments) {
  const promises = []
  for (const attachment of attachments) {
    const promise = new Promise((resolve, reject) => {
      fs.unlink(attachment, err => {
        if (err) {
          console.error('Could not delete "%s"', attachment)
          console.error(err)
          reject(err)
          return
        }
        resolve()
      })
    })
    promises.push(promise)
  }
  return Promise.all(promises)
}

/**
 * Clones the attachments of a given note.
 * Copies the attachments to their new destination and updates the content of the new note so that the attachment-links again point to the correct destination.
 * @param oldNote Note that is being cloned
 * @param newNote Clone of the note
 */
function cloneAttachments(oldNote, newNote) {
  if (newNote.type === 'MARKDOWN_NOTE') {
    const oldStorage = findStorage.findStorage(oldNote.storage)
    const newStorage = findStorage.findStorage(newNote.storage)
    const attachmentsPaths =
      getAbsolutePathsOfAttachmentsInContent(
        oldNote.content,
        oldStorage.path
      ) || []

    const destinationFolder = path.join(
      newStorage.path,
      DESTINATION_FOLDER,
      newNote.key
    )
    if (!sander.existsSync(destinationFolder)) {
      sander.mkdirSync(destinationFolder)
    }

    for (const attachment of attachmentsPaths) {
      const destination = path.join(
        newStorage.path,
        DESTINATION_FOLDER,
        newNote.key,
        path.basename(attachment)
      )
      sander.copyFileSync(attachment).to(destination)
    }
    newNote.content = replaceNoteKeyWithNewNoteKey(
      newNote.content,
      oldNote.key,
      newNote.key
    )
  } else {
    console.debug(
      'Cloning of the attachment was skipped since it only works for MARKDOWN_NOTEs'
    )
  }
}

function generateFileNotFoundMarkdown() {
  return (
    '**' +
    i18n.__(
      '⚠ You have pasted a link referring an attachment that could not be found in the storage location of this note. Pasting links referring attachments is only supported if the source and destination location is the same storage. Please Drag&Drop the attachment instead! ⚠'
    ) +
    '**'
  )
}

/**
 * Determines whether a given text is a link to an boostnote attachment
 * @param text Text that might contain a attachment link
 * @return {Boolean} Result of the test
 */
function isAttachmentLink(text) {
  if (text) {
    return (
      text.match(
        new RegExp(
          '.*\\[.*\\]\\( *' +
            escapeStringRegexp(STORAGE_FOLDER_PLACEHOLDER) +
            '[' +
            PATH_SEPARATORS +
            ']' +
            '.*\\).*',
          'gi'
        )
      ) != null
    )
  }
  return false
}

/**
 * @description Handles the paste of an attachment link. Copies the referenced attachment to the location belonging to the new note.
 *  Returns a modified version of the pasted text so that it matches the copied attachment (resp. the new location)
 * @param storageKey StorageKey of the current note
 * @param noteKey NoteKey of the currentNote
 * @param linkText Text that was pasted
 * @return {Promise<String>} Promise returning the modified text
 */
function handleAttachmentLinkPaste(storageKey, noteKey, linkText) {
  if (storageKey != null && noteKey != null && linkText != null) {
    const storagePath = findStorage.findStorage(storageKey).path
    const attachments = getAttachmentsInMarkdownContent(linkText) || []
    const replaceInstructions = []
    const copies = []
    for (const attachment of attachments) {
      const absPathOfAttachment = attachment.replace(
        new RegExp(STORAGE_FOLDER_PLACEHOLDER, 'g'),
        path.join(storagePath, DESTINATION_FOLDER)
      )
      copies.push(
        sander.exists(absPathOfAttachment).then(fileExists => {
          if (!fileExists) {
            const fileNotFoundRegexp = new RegExp(
              '!?' +
                escapeStringRegexp('[') +
                '[\\w|\\d|\\s|\\.]*\\]\\(\\s*' +
                STORAGE_FOLDER_PLACEHOLDER +
                '[\\w|\\d|\\-|' +
                PATH_SEPARATORS +
                ']*' +
                escapeStringRegexp(path.basename(absPathOfAttachment)) +
                escapeStringRegexp(')')
            )
            replaceInstructions.push({
              regexp: fileNotFoundRegexp,
              replacement: this.generateFileNotFoundMarkdown()
            })
            return Promise.resolve()
          }
          return this.copyAttachment(
            absPathOfAttachment,
            storageKey,
            noteKey
          ).then(fileName => {
            const replaceLinkRegExp = new RegExp(
              escapeStringRegexp('(') +
                ' *' +
                STORAGE_FOLDER_PLACEHOLDER +
                '[\\w|\\d|\\-|' +
                PATH_SEPARATORS +
                ']*' +
                escapeStringRegexp(path.basename(absPathOfAttachment)) +
                ' *' +
                escapeStringRegexp(')')
            )
            replaceInstructions.push({
              regexp: replaceLinkRegExp,
              replacement:
                '(' +
                path.join(STORAGE_FOLDER_PLACEHOLDER, noteKey, fileName) +
                ')'
            })
            return Promise.resolve()
          })
        })
      )
    }
    return Promise.all(copies).then(() => {
      let modifiedLinkText = linkText
      for (const replaceInstruction of replaceInstructions) {
        modifiedLinkText = modifiedLinkText.replace(
          replaceInstruction.regexp,
          replaceInstruction.replacement
        )
      }
      return modifiedLinkText
    })
  } else {
    return Promise.resolve(linkText)
  }
}

module.exports = {
  copyAttachment,
  fixLocalURLS,
  generateAttachmentMarkdown,
  handleAttachmentDrop,
  handlePasteImageEvent,
  handlePasteNativeImage,
  getAttachmentsInMarkdownContent,
  getAbsolutePathsOfAttachmentsInContent,
  importAttachments,
  removeStorageAndNoteReferences,
  removeAttachmentsByPaths,
  deleteAttachmentFolder,
  deleteAttachmentsNotPresentInNote,
  getAttachmentsPathAndStatus,
  moveAttachments,
  cloneAttachments,
  isAttachmentLink,
  handleAttachmentLinkPaste,
  generateFileNotFoundMarkdown,
  migrateAttachments,
  STORAGE_FOLDER_PLACEHOLDER,
  DESTINATION_FOLDER
}
