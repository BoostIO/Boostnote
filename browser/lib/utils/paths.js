import Result from 'folktale/result'

/**
 * @typedef {Object} PathInfo
 * @prop {boolean} isStoragePathname
 * @prop {boolean} isFolderPathname
 * @prop {boolean} isHomePathname
 * @prop {boolean} isStarredPathname
 * @prop {String} storageKey
 * @prop {String} folderKey
 */

export const basePaths = {
  home: '/home',
  starred: '/starred',
  trashed: '/trashed',
  storages: '/storages/',
  folders: '/folders/'
}

/**
 * Overwrites a default PathInfo object (which matches no paths) with the given
 * obj.
 * @param  {Object} obj
 * @return {PathInfo}
 * @see PathInfo
 */
function pathInfo (obj) {
  return Object.assign({
    isStoragePathname: false,
    isFolderPathname: false,
    isHomePathname: false,
    isStarredPathname: false,
    isTrashedPathname: false,
    storageKey: '',
    folderKey: ''
  }, obj)
}

/**
 *
 * @param  {String} [pathname='']
 * @return {Result<PathInfo, Error>}
 */
export function parsePathname (pathname = '') {
  if (pathname.startsWith(basePaths.storages)) {
    // can be a storage or a folder pathname
    const parts = pathname.split('/').slice(1)
    if (parts.length === 2) {
      return Result.Ok(pathInfo({
        isStoragePathname: true,
        storageKey: parts[1]
      }))
    } else if (parts.length === 4) {
      return Result.Ok(pathInfo({
        isFolderPathname: true,
        storageKey: parts[1],
        folderKey: parts[3]
      }))
    } else {
      return Result.Error(new Error(`Cannot parse given pathname: ${pathname}`))
    }
  } else if (pathname.startsWith(basePaths.home)) {
    return Result.Ok(pathInfo({ isHomePathname: true }))
  } else if (pathname.startsWith(basePaths.starred)) {
    return Result.Ok(pathInfo({ isStarredPathname: true }))
  } else if (pathname.startsWith(basePaths.trashed)) {
    return Result.Ok(pathInfo({ isTrashedPathname: true }))
  } else {
    return Result.Error(new Error(`Cannot parse given pathname: ${pathname}`))
  }
}
