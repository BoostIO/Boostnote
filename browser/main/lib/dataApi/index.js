const dataApi = {
  init: require('./init'),
  addStorage: require('./addStorage'),
  renameStorage: require('./renameStorage'),
  removeStorage: require('./removeStorage'),
  changeStorageColor: require('./changeStorageColor'),
  createFolder: require('./createFolder'),
  updateFolder: require('./updateFolder'),
  deleteFolder: require('./deleteFolder'),
  reorderFolder: require('./reorderFolder'),
  exportFolder: require('./exportFolder'),
  createNote: require('./createNote'),
  updateNote: require('./updateNote'),
  deleteNote: require('./deleteNote'),
  moveNote: require('./moveNote'),
  migrateFromV5Storage: require('./migrateFromV5Storage'),

  _migrateFromV6Storage: require('./migrateFromV6Storage'),
  _resolveStorageData: require('./resolveStorageData'),
  _resolveStorageNotes: require('./resolveStorageNotes')
}

module.exports = dataApi
