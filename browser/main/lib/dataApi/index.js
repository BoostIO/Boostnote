const dataApi = {
  init: require('./init'),
  addStorage: require('./addStorage'),
  renameStorage: require('./renameStorage'),
  removeStorage: require('./removeStorage'),
  createFolder: require('./createFolder'),
  updateFolder: require('./updateFolder'),
  deleteFolder: require('./deleteFolder'),
  createNote: require('./createNote'),
  updateNote: require('./updateNote'),
  deleteNote: require('./deleteNote'),
  moveNote: require('./moveNote'),
  migrateFromV5Storage: require('./migrateFromV5Storage'),
  moveFolder: require('./moveFolder'),

  _migrateFromV6Storage: require('./migrateFromV6Storage'),
  _resolveStorageData: require('./resolveStorageData'),
  _resolveStorageNotes: require('./resolveStorageNotes')
}

module.exports = dataApi
