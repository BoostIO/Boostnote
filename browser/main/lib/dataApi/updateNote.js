const resolveStorageData = require('./resolveStorageData')
const _ = require('lodash')
const path = require('path')
const CSON = require('@rokt33r/season')
const { findStorage } = require('browser/lib/findStorage')

function validateInput(input) {
  const validatedInput = {}

  if (input.tags != null) {
    if (!_.isArray(input.tags)) validatedInput.tags = []
    validatedInput.tags = input.tags.filter(
      tag => _.isString(tag) && tag.trim().length > 0
    )
  }

  if (input.title != null) {
    if (!_.isString(input.title)) validatedInput.title = ''
    else validatedInput.title = input.title
  }

  if (input.isStarred != null) {
    validatedInput.isStarred = !!input.isStarred
  }

  if (input.isTrashed != null) {
    validatedInput.isTrashed = !!input.isTrashed
  }

  if (input.isPinned !== undefined) {
    validatedInput.isPinned = !!input.isPinned
  }

  if (!_.isNil(input.blog)) {
    validatedInput.blog = input.blog
  }
  validatedInput.type = input.type
  switch (input.type) {
    case 'MARKDOWN_NOTE':
      if (input.content != null) {
        if (!_.isString(input.content)) validatedInput.content = ''
        else validatedInput.content = input.content

        if (!_.isArray(input.linesHighlighted))
          validatedInput.linesHighlighted = []
        else validatedInput.linesHighlighted = input.linesHighlighted
      }
      return validatedInput
    case 'SNIPPET_NOTE':
      if (input.description != null) {
        if (!_.isString(input.description)) validatedInput.description = ''
        else validatedInput.description = input.description
      }
      if (input.snippets != null) {
        if (!_.isArray(input.snippets)) {
          validatedInput.snippets = [
            {
              name: '',
              mode: 'text',
              content: '',
              linesHighlighted: []
            }
          ]
        } else {
          validatedInput.snippets = input.snippets
        }
        validatedInput.snippets.filter(snippet => {
          if (!_.isString(snippet.name)) return false
          if (!_.isString(snippet.mode)) return false
          if (!_.isString(snippet.content)) return false
          return true
        })
      }
      return validatedInput
    default:
      throw new Error(
        'Invalid type: only MARKDOWN_NOTE and SNIPPET_NOTE are available.'
      )
  }
}

function updateNote(storageKey, noteKey, input) {
  let targetStorage
  try {
    if (input == null) throw new Error('No input found.')
    input = validateInput(input)

    targetStorage = findStorage(storageKey)
  } catch (e) {
    return Promise.reject(e)
  }

  return resolveStorageData(targetStorage).then(function saveNote(storage) {
    let noteData
    const notePath = path.join(storage.path, 'notes', noteKey + '.cson')
    try {
      noteData = CSON.readFileSync(notePath)
    } catch (err) {
      console.warn('Failed to find note cson', err)
      noteData =
        input.type === 'SNIPPET_NOTE'
          ? {
              type: 'SNIPPET_NOTE',
              description: [],
              snippets: [
                {
                  name: '',
                  mode: 'text',
                  content: '',
                  linesHighlighted: []
                }
              ]
            }
          : {
              type: 'MARKDOWN_NOTE',
              content: '',
              linesHighlighted: []
            }
      noteData.title = ''
      if (storage.folders.length === 0)
        throw new Error('Failed to restore note: No folder exists.')
      noteData.folder = storage.folders[0].key
      noteData.createdAt = new Date()
      noteData.updatedAt = new Date()
      noteData.isStarred = false
      noteData.isTrashed = false
      noteData.tags = []
      noteData.isPinned = false
    }

    if (noteData.type === 'SNIPPET_NOTE') {
      noteData.title
    }

    Object.assign(noteData, input, {
      key: noteKey,
      updatedAt: new Date(),
      storage: storageKey
    })

    CSON.writeFileSync(
      path.join(storage.path, 'notes', noteKey + '.cson'),
      _.omit(noteData, ['key', 'storage'])
    )

    return noteData
  })
}

module.exports = updateNote
