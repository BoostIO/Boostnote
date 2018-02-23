import { combineReducers, createStore } from 'redux'
import { routerReducer } from 'react-router-redux'
import ConfigManager from 'browser/main/lib/ConfigManager'
import { Map, Set } from 'browser/lib/Mutable'
import _ from 'lodash'

function defaultDataMap () {
  return {
    storageMap: new Map(),
    noteMap: new Map(),
    starredSet: new Set(),
    storageNoteMap: new Map(),
    folderNoteMap: new Map(),
    tagNoteMap: new Map(),
    trashedSet: new Set(),
    treeVisibilityMap: new Map()
  }
}

function closeAll(state,treeObj,parentPath) {
  state.set(parentPath, false)
  Object.keys(treeObj).map(k => {
    let pathToMe = parentPath + '/' + k
    state.set(pathToMe,false) 
    if (Array.isArray(treeObj[k])) {
      return state 
    } else {
      closeAll(state, treeObj[k], pathToMe)
    }
  }) 
}
function data (state = defaultDataMap(), action) {
  switch (action.type) {
    case 'INIT_ALL':
      state = defaultDataMap()

      action.storages.forEach((storage) => {
        state.storageMap.set(storage.key, storage)
      })

    
      action.notes.some((note) => {
        if (note === undefined) return true
        const uniqueKey = note.storage + '-' + note.key
        const folderKey = note.storage + '-' + note.folder
        state.noteMap.set(uniqueKey, note)

        if (note.isStarred) {
          state.starredSet.add(uniqueKey)
        }

        if (note.isTrashed) {
          state.trashedSet.add(uniqueKey)
        }

        let storageNoteList = state.storageNoteMap.get(note.storage)
        if (storageNoteList == null) {
          storageNoteList = new Set(storageNoteList)
          state.storageNoteMap.set(note.storage, storageNoteList)
        }
        storageNoteList.add(uniqueKey)

        let folderNoteSet = state.folderNoteMap.get(folderKey)
        if (folderNoteSet == null) {
          folderNoteSet = new Set(folderNoteSet)
          state.folderNoteMap.set(folderKey, folderNoteSet)
        }
        folderNoteSet.add(uniqueKey)

        note.tags.forEach((tag) => {
          let tagNoteList = state.tagNoteMap.get(tag)
          if (tagNoteList == null) {
            tagNoteList = new Set(tagNoteList)
            state.tagNoteMap.set(tag, tagNoteList)
          }
          tagNoteList.add(uniqueKey)
        })

        let noteTreeData = {};
        action.notes.forEach((note) => {
          const myDate = new Date(note.createdAt)
          // getMonth() is zero-based
          const [yyyy, mm, dd] = [myDate.getFullYear(), myDate.getMonth() + 1, myDate.getDate()]
          if (!noteTreeData[yyyy]) {
            noteTreeData[yyyy] = {}
            noteTreeData[yyyy][mm] = {}
            noteTreeData[yyyy][mm][dd] = []
          } else {
            if (!noteTreeData[yyyy][mm]) {
              noteTreeData[yyyy][mm] = {}
              noteTreeData[yyyy][mm][dd] = []
            } else {
              if (!noteTreeData[yyyy][mm][dd]) {
                noteTreeData[yyyy][mm][dd] = []
              }
            }
          }
          noteTreeData[yyyy][mm][dd].push(note);
      })
 
        const myDate = new Date(note.createdAt)
        const [yyyy, mm, dd] = [myDate.getFullYear(), myDate.getMonth() + 1, myDate.getDate()]
        state.treeVisibilityMap.set('/', true)
        // state.treeVisibilityMap.set('//' + yyyy + '/'+mm+'/'+dd, false)
      })
      return state
    case 'UPDATE_NOTE':
      {
        const note = action.note
        const uniqueKey = note.storage + '-' + note.key
        const folderKey = note.storage + '-' + note.folder
        const oldNote = state.noteMap.get(uniqueKey)

        state = Object.assign({}, state)
        state.noteMap = new Map(state.noteMap)
        state.noteMap.set(uniqueKey, note)

        if (oldNote == null || oldNote.isStarred !== note.isStarred) {
          state.starredSet = new Set(state.starredSet)
          if (note.isStarred) {
            state.starredSet.add(uniqueKey)
          } else {
            state.starredSet.delete(uniqueKey)
          }
        }

        if (oldNote == null || oldNote.isTrashed !== note.isTrashed) {
          state.trashedSet = new Set(state.trashedSet)
          if (note.isTrashed) {
            state.trashedSet.add(uniqueKey)
            state.starredSet.delete(uniqueKey)
          } else {
            state.trashedSet.delete(uniqueKey)

            if (note.isStarred) {
              state.starredSet.add(uniqueKey)
            }
          }
        }

        // Update storageNoteMap if oldNote doesn't exist
        if (oldNote == null) {
          state.storageNoteMap = new Map(state.storageNoteMap)
          let storageNoteSet = state.storageNoteMap.get(note.storage)
          storageNoteSet = new Set(storageNoteSet)
          storageNoteSet.add(uniqueKey)
          state.storageNoteMap.set(note.storage, storageNoteSet)
        }

        // Update foldermap if folder changed or post created
        if (oldNote == null || oldNote.folder !== note.folder) {
          state.folderNoteMap = new Map(state.folderNoteMap)
          let folderNoteSet = state.folderNoteMap.get(folderKey)
          folderNoteSet = new Set(folderNoteSet)
          folderNoteSet.add(uniqueKey)
          state.folderNoteMap.set(folderKey, folderNoteSet)

          if (oldNote != null) {
            const oldFolderKey = oldNote.storage + '-' + oldNote.folder
            let oldFolderNoteList = state.folderNoteMap.get(oldFolderKey)
            oldFolderNoteList = new Set(oldFolderNoteList)
            oldFolderNoteList.delete(uniqueKey)
            state.folderNoteMap.set(oldFolderKey, oldFolderNoteList)
          }
        }

        if (oldNote != null) {
          const discardedTags = _.difference(oldNote.tags, note.tags)
          const addedTags = _.difference(note.tags, oldNote.tags)
          if (discardedTags.length + addedTags.length > 0) {
            state.tagNoteMap = new Map(state.tagNoteMap)

            discardedTags.forEach((tag) => {
              let tagNoteList = state.tagNoteMap.get(tag)
              if (tagNoteList != null) {
                tagNoteList = new Set(tagNoteList)
                tagNoteList.delete(uniqueKey)
                state.tagNoteMap.set(tag, tagNoteList)
              }
            })
            addedTags.forEach((tag) => {
              let tagNoteList = state.tagNoteMap.get(tag)
              tagNoteList = new Set(tagNoteList)
              tagNoteList.add(uniqueKey)

              state.tagNoteMap.set(tag, tagNoteList)
            })
          }
        } else {
          state.tagNoteMap = new Map(state.tagNoteMap)
          note.tags.forEach((tag) => {
            let tagNoteList = state.tagNoteMap.get(tag)
            if (tagNoteList == null) {
              tagNoteList = new Set(tagNoteList)
              state.tagNoteMap.set(tag, tagNoteList)
            }
            tagNoteList.add(uniqueKey)
          })
        }

        return state
      }
    case 'MOVE_NOTE':
      {
        const originNote = action.originNote
        const originKey = originNote.storage + '-' + originNote.key
        const note = action.note
        const uniqueKey = note.storage + '-' + note.key
        const folderKey = note.storage + '-' + note.folder
        const oldNote = state.noteMap.get(uniqueKey)

        state = Object.assign({}, state)
        state.noteMap = new Map(state.noteMap)
        state.noteMap.delete(originKey)
        state.noteMap.set(uniqueKey, note)

        // If storage chanced, origin key must be discarded
        if (originKey !== uniqueKey) {
          console.log('diffrent storage')
          // From isStarred
          if (originNote.isStarred) {
            state.starredSet = new Set(state.starredSet)
            state.starredSet.delete(originKey)
          }

          if (originNote.isTrashed) {
            state.trashedSet = new Set(state.trashedSet)
            state.trashedSet.delete(originKey)
          }

          // From storageNoteMap
          state.storageNoteMap = new Map(state.storageNoteMap)
          let noteSet = state.storageNoteMap.get(originNote.storage)
          noteSet = new Set(noteSet)
          noteSet.delete(originKey)
          state.storageNoteMap.set(originNote.storage, noteSet)

          // From folderNoteMap
          state.folderNoteMap = new Map(state.folderNoteMap)
          const originFolderKey = originNote.storage + '-' + originNote.folder
          let originFolderList = state.folderNoteMap.get(originFolderKey)
          originFolderList = new Set(originFolderList)
          originFolderList.delete(originKey)
          state.folderNoteMap.set(originFolderKey, originFolderList)

          // From tagMap
          if (originNote.tags.length > 0) {
            state.tagNoteMap = new Map(state.tagNoteMap)
            originNote.tags.forEach((tag) => {
              let noteSet = state.tagNoteMap.get(tag)
              noteSet = new Set(noteSet)
              noteSet.delete(originKey)
              state.tagNoteMap.set(tag, noteSet)
            })
          }
        }

        if (oldNote == null || oldNote.isStarred !== note.isStarred) {
          state.starredSet = new Set(state.starredSet)
          if (note.isStarred) {
            state.starredSet.add(uniqueKey)
          } else {
            state.starredSet.delete(uniqueKey)
          }
        }

        if (oldNote == null || oldNote.isTrashed !== note.isTrashed) {
          state.trashedSet = new Set(state.trashedSet)
          if (note.isTrashed) {
            state.trashedSet.add(uniqueKey)
          } else {
            state.trashedSet.delete(uniqueKey)
          }
        }

        // Update storageNoteMap if oldNote doesn't exist
        if (oldNote == null) {
          state.storageNoteMap = new Map(state.storageNoteMap)
          let noteSet = state.storageNoteMap.get(note.storage)
          noteSet = new Set(noteSet)
          noteSet.add(uniqueKey)
          state.folderNoteMap.set(folderKey, noteSet)
        }

        // Update foldermap if folder changed or post created
        if (oldNote == null || oldNote.folder !== note.folder) {
          state.folderNoteMap = new Map(state.folderNoteMap)
          let folderNoteList = state.folderNoteMap.get(folderKey)
          folderNoteList = new Set(folderNoteList)
          folderNoteList.add(uniqueKey)
          state.folderNoteMap.set(folderKey, folderNoteList)

          if (oldNote != null) {
            const oldFolderKey = oldNote.storage + '-' + oldNote.folder
            let oldFolderNoteList = state.folderNoteMap.get(oldFolderKey)
            oldFolderNoteList = new Set(oldFolderNoteList)
            oldFolderNoteList.delete(uniqueKey)
            state.folderNoteMap.set(oldFolderKey, oldFolderNoteList)
          }
        }

        // Remove from old folder map
        if (oldNote != null) {
          const discardedTags = _.difference(oldNote.tags, note.tags)
          const addedTags = _.difference(note.tags, oldNote.tags)
          if (discardedTags.length + addedTags.length > 0) {
            state.tagNoteMap = new Map(state.tagNoteMap)

            discardedTags.forEach((tag) => {
              let tagNoteList = state.tagNoteMap.get(tag)
              if (tagNoteList != null) {
                tagNoteList = new Set(tagNoteList)
                tagNoteList.delete(uniqueKey)
                state.tagNoteMap.set(tag, tagNoteList)
              }
            })
            addedTags.forEach((tag) => {
              let tagNoteList = state.tagNoteMap.get(tag)
              tagNoteList = new Set(tagNoteList)
              tagNoteList.add(uniqueKey)

              state.tagNoteMap.set(tag, tagNoteList)
            })
          }
        } else {
          state.tagNoteMap = new Map(state.tagNoteMap)
          note.tags.forEach((tag) => {
            let tagNoteList = state.tagNoteMap.get(tag)
            if (tagNoteList == null) {
              tagNoteList = new Set(tagNoteList)
              state.tagNoteMap.set(tag, tagNoteList)
            }
            tagNoteList.add(uniqueKey)
          })
        }

        return state
      }
    case 'DELETE_NOTE':
      {
        const uniqueKey = action.storageKey + '-' + action.noteKey
        const targetNote = state.noteMap.get(uniqueKey)

        state = Object.assign({}, state)

        // From storageNoteMap
        state.storageNoteMap = new Map(state.storageNoteMap)
        let noteSet = state.storageNoteMap.get(targetNote.storage)
        noteSet = new Set(noteSet)
        noteSet.delete(uniqueKey)
        state.storageNoteMap.set(targetNote.storage, noteSet)

        if (targetNote != null) {
          // From isStarred
          if (targetNote.isStarred) {
            state.starredSet = new Set(state.starredSet)
            state.starredSet.delete(uniqueKey)
          }

          if (targetNote.isTrashed) {
            state.trashedSet = new Set(state.trashedSet)
            state.trashedSet.delete(uniqueKey)
          }

          // From folderNoteMap
          const folderKey = targetNote.storage + '-' + targetNote.folder
          state.folderNoteMap = new Map(state.folderNoteMap)
          let folderSet = state.folderNoteMap.get(folderKey)
          folderSet = new Set(folderSet)
          folderSet.delete(uniqueKey)
          state.folderNoteMap.set(folderKey, folderSet)

          // From tagMap
          if (targetNote.tags.length > 0) {
            state.tagNoteMap = new Map(state.tagNoteMap)
            targetNote.tags.forEach((tag) => {
              let noteSet = state.tagNoteMap.get(tag)
              noteSet = new Set(noteSet)
              noteSet.delete(uniqueKey)
              state.tagNoteMap.set(tag, noteSet)
            })
          }
        }
        state.noteMap = new Map(state.noteMap)
        state.noteMap.delete(uniqueKey)
        return state
      }
    case 'UPDATE_FOLDER':
      state = Object.assign({}, state)
      state.storageMap = new Map(state.storageMap)
      state.storageMap.set(action.storage.key, action.storage)
      return state
    case 'REORDER_FOLDER':
      state = Object.assign({}, state)
      state.storageMap = new Map(state.storageMap)
      state.storageMap.set(action.storage.key, action.storage)
      return state
    case 'EXPORT_FOLDER':
      state = Object.assign({}, state)
      state.storageMap = new Map(state.storageMap)
      state.storageMap.set(action.storage.key, action.storage)
      return state
    case 'DELETE_FOLDER':
      {
        state = Object.assign({}, state)
        state.storageMap = new Map(state.storageMap)
        state.storageMap.set(action.storage.key, action.storage)

        // Get note list from folder-note map
        // and delete note set from folder-note map
        const folderKey = action.storage.key + '-' + action.folderKey
        const noteSet = state.folderNoteMap.get(folderKey)
        state.folderNoteMap = new Map(state.folderNoteMap)
        state.folderNoteMap.delete(folderKey)

        state.noteMap = new Map(state.noteMap)
        state.storageNoteMap = new Map(state.storageNoteMap)
        let storageNoteSet = state.storageNoteMap.get(action.storage.key)
        storageNoteSet = new Set(storageNoteSet)
        state.storageNoteMap.set(action.storage.key, storageNoteSet)

        if (noteSet != null) {
          noteSet.forEach(function handleNoteKey (noteKey) {
            // Get note from noteMap
            const note = state.noteMap.get(noteKey)
            if (note != null) {
              state.noteMap.delete(noteKey)

              // From storageSet
              storageNoteSet.delete(noteKey)

              // From starredSet
              if (note.isStarred) {
                state.starredSet = new Set(state.starredSet)
                state.starredSet.delete(noteKey)
              }

              if (note.isTrashed) {
                state.trashedSet = new Set(state.trashedSet)
                state.trashedSet.delete(noteKey)
              }

              // Delete key from tag map
              state.tagNoteMap = new Map(state.tagNoteMap)
              note.tags.forEach((tag) => {
                let tagNoteSet = state.tagNoteMap.get(tag)
                tagNoteSet = new Set(tagNoteSet)
                state.tagNoteMap.set(tag, tagNoteSet)
                tagNoteSet.delete(noteKey)
              })
            }
          })
        }
      }
      return state
    case 'ADD_STORAGE':
      state = Object.assign({}, state)
      state.storageMap = new Map(state.storageMap)
      state.storageMap.set(action.storage.key, action.storage)

      state.noteMap = new Map(state.noteMap)
      state.storageNoteMap = new Map(state.storageNoteMap)
      state.storageNoteMap.set(action.storage.key, new Set())
      state.folderNoteMap = new Map(state.folderNoteMap)
      state.tagNoteMap = new Map(state.tagNoteMap)
      action.notes.forEach((note) => {
        const uniqueKey = note.storage + '-' + note.key
        const folderKey = note.storage + '-' + note.folder
        state.noteMap.set(uniqueKey, note)

        if (note.isStarred) {
          state.starredSet.add(uniqueKey)
        }

        let storageNoteList = state.storageNoteMap.get(note.storage)
        if (storageNoteList == null) {
          storageNoteList = new Set(storageNoteList)
          state.storageNoteMap.set(note.storage, storageNoteList)
        }
        storageNoteList.add(uniqueKey)

        let folderNoteSet = state.folderNoteMap.get(folderKey)
        if (folderNoteSet == null) {
          folderNoteSet = new Set(folderNoteSet)
          state.folderNoteMap.set(folderKey, folderNoteSet)
        }
        folderNoteSet.add(uniqueKey)

        note.tags.forEach((tag) => {
          let tagNoteSet = state.tagNoteMap.get(tag)
          if (tagNoteSet == null) {
            tagNoteSet = new Set(tagNoteSet)
            state.tagNoteMap.set(tag, tagNoteSet)
          }
          tagNoteSet.add(uniqueKey)
        })
      })
      return state
    case 'REMOVE_STORAGE':
      state = Object.assign({}, state)
      const storage = state.storageMap.get(action.storageKey)
      state.storageMap = new Map(state.storageMap)
      state.storageMap.delete(action.storageKey)

      // Remove folders from folderMap
      if (storage != null) {
        state.folderMap = new Map(state.folderMap)
        storage.folders.forEach((folder) => {
          const folderKey = storage.key + '-' + folder.key
          state.folderMap.delete(folderKey)
        })
      }

      // Remove notes from noteMap and tagNoteMap
      const storageNoteSet = state.storageNoteMap.get(action.storageKey)
      state.storageNoteMap = new Map(state.storageNoteMap)
      state.storageNoteMap.delete(action.storageKey)
      if (storageNoteSet != null) {
        const notes = storageNoteSet
          .map((noteKey) => state.noteMap.get(noteKey))
          .filter((note) => note != null)

        state.noteMap = new Map(state.noteMap)
        state.tagNoteMap = new Map(state.tagNoteMap)
        state.starredSet = new Set(state.starredSet)
        notes.forEach((note) => {
          const noteKey = storage.key + '-' + note.key
          state.noteMap.delete(noteKey)
          state.starredSet.delete(noteKey)
          note.tags.forEach((tag) => {
            let tagNoteSet = state.tagNoteMap.get(tag)
            tagNoteSet = new Set(tagNoteSet)
            tagNoteSet.delete(noteKey)
          })
        })
      }
      return state
    case 'RENAME_STORAGE':
      state = Object.assign({}, state)
      state.storageMap = new Map(state.storageMap)
      state.storageMap.set(action.storage.key, action.storage)
      return state
    case 'TOGGLE_TREE':
      state = Object.assign({}, state)
      state.treeVisibilityMap = new Map(state.treeVisibilityMap) 
      state.treeVisibilityMap.set(action.path, !state.treeVisibilityMap.get(action.path))
      return state
  }
  return state
}

const defaultConfig = ConfigManager.get()

function config (state = defaultConfig, action) {
  switch (action.type) {
    case 'SET_IS_SIDENAV_FOLDED':
      state.isSideNavFolded = action.isFolded
      return Object.assign({}, state)
    case 'SET_ZOOM':
      state.zoom = action.zoom
      return Object.assign({}, state)
    case 'SET_LIST_WIDTH':
      state.listWidth = action.listWidth
      return Object.assign({}, state)
    case 'SET_NAV_WIDTH':
      state.navWidth = action.navWidth
      return Object.assign({}, state)
    case 'SET_CONFIG':
      return Object.assign({}, state, action.config)
    case 'SET_UI':
      return Object.assign({}, state, action.config)
  }
  return state
}

const defaultStatus = {
  updateReady: false
}

function status (state = defaultStatus, action) {
  switch (action.type) {
    case 'UPDATE_AVAILABLE':
      return Object.assign({}, defaultStatus, {
        updateReady: true
      })
  }
  return state
}

const reducer = combineReducers({
  data,
  config,
  status,
  routing: routerReducer
})

const store = createStore(reducer)

export default store
