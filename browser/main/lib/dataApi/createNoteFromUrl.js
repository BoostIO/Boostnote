const http = require('http')
const https = require('https')
const { createTurndownService } = require('../../../lib/turndown')
const createNote = require('./createNote')

import { push } from 'connected-react-router'
import ee from 'browser/main/lib/eventEmitter'

function validateUrl(str) {
  if (
    /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
      str
    )
  ) {
    return true
  } else {
    return false
  }
}

const ERROR_MESSAGES = {
  ENOTFOUND:
    'URL not found. Please check the URL, or your internet connection and try again.',
  VALIDATION_ERROR:
    'Please check if the URL follows this format: https://www.google.com',
  UNEXPECTED: 'Unexpected error! Please check console for details!'
}

function createNoteFromUrl(
  url,
  storage,
  folder,
  dispatch = null,
  location = null
) {
  return new Promise((resolve, reject) => {
    const td = createTurndownService()

    if (!validateUrl(url)) {
      reject({ result: false, error: ERROR_MESSAGES.VALIDATION_ERROR })
    }

    const request = url.startsWith('https') ? https : http

    const req = request.request(url, res => {
      let data = ''

      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        const markdownHTML = td.turndown(data)

        if (dispatch !== null) {
          createNote(storage, {
            type: 'MARKDOWN_NOTE',
            folder: folder,
            title: '',
            content: markdownHTML
          }).then(note => {
            const noteHash = note.key
            dispatch({
              type: 'UPDATE_NOTE',
              note: note
            })
            dispatch(
              push({
                pathname: location.pathname,
                query: { key: noteHash }
              })
            )
            ee.emit('list:jump', noteHash)
            ee.emit('detail:focus')
            resolve({ result: true, error: null })
          })
        } else {
          createNote(storage, {
            type: 'MARKDOWN_NOTE',
            folder: folder,
            title: '',
            content: markdownHTML
          }).then(note => {
            resolve({ result: true, note, error: null })
          })
        }
      })
    })

    req.on('error', e => {
      console.error('error in parsing URL', e)
      reject({
        result: false,
        error: ERROR_MESSAGES[e.code] || ERROR_MESSAGES.UNEXPECTED
      })
    })

    req.end()
  })
}

module.exports = createNoteFromUrl
