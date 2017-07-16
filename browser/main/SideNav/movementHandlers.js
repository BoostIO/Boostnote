import Result from 'folktale/result'
import {
  basePaths,
  parsePathname
} from 'browser/lib/utils/paths'
import findStorage from 'browser/lib/utils/findStorage'

/**
 * A path which `hashHistory` can use to navigate to.
 * @typedef {String} HashHistoryURL
 */

// If SideNavFilter's items change, change this default (or pass in a different
// sideNavFilterPathnames to the function exported by this module).
const defaultSideNavFilterPathnames = [
  basePaths.home,
  basePaths.starred
]

function getPathnameFrom (arr, arrName = 'sideNavFilterPathnames') {
  return index => {
    const pathname = arr[index]
    return pathname
      ? Result.Ok(pathname)
      : Result.Error(new Error(`No pathname found at index ${index} in ${arrName}: ${arr}`))
  }
}

/**
 * This module returns a function which you're meant to call with configuration
 * options (or pass in nothing for the default config).
 * The result will be an Object whose properties are movementToPath functions.
 * @module movementHandlers
 * @see movementToPath
 */
export default ({
  sideNavFilterPathnames = defaultSideNavFilterPathnames
} = {}) => {
  const getSideNavFilterPathname = getPathnameFrom(sideNavFilterPathnames)

  /**
   * @param  {React.Component} component     SideNav/index
   * @param  {String} storageKey  A key of a Storage in `data.storageMap`.
   * @return {Result<HashHistoryURL, Error>}
   */
  function upFromStorage (component, storageKey) {
    return findStorage(component, storageKey).chain(
      ([storage, { index }]) => {
        if (index === 0) {
          // There is no sibling top storage, so go to last item of SideNavFilter.
          return getSideNavFilterPathname(sideNavFilterPathnames.length - 1)
        }
        // There is a sibling top storage.
        return findStorage(component, storageKey, -1).map(
          ([storage, { isClosed }]) => {
            if (storage.folders.length === 0) {
              // Sibling top storage has no folders, so whether it's closed or open, we still want to go to it.
              return basePaths.storages + storage.key
            }
            // Sibling top storage has at least one folder.
            if (isClosed) {
              // Go to sibling top storage as its folders are collapsed.
              return basePaths.storages + storage.key
            }
            // Go to sibling top storage's last folder as its folders are expanded.
            const storagePath = basePaths.storages + storage.key
            const folderPath = basePaths.folders + storage.folders[storage.folders.length - 1].key
            return storagePath + folderPath
          }
        )
      }
    )
  }

  /**
   * @param  {Storage} storage  A value in SideNav's `data.storageMap`.
   * @param  {String} folderKey A folder's key.
   * @return {Result<HashHistoryURL, Error>}
   */
  function upFromFolder (storage, folderKey) {
    const folderIndex = storage.folders.findIndex(folder => folder.key === folderKey)
    if (folderIndex === 0) {
      // There is no sibling top folder, so got to parent top storage.
      return Result.Ok(basePaths.storages + storage.key)
    } else if (folderIndex > 0) {
      // Go to sibling top folder.
      return Result.Ok(basePaths.storages + storage.key + basePaths.folders + storage.folders[folderIndex - 1].key)
    } else {
      return Result.Error(new Error(
        `Cannot go up from folder with key ${folderKey} in Storage with key ${storage.key}. ` +
        `The index of this folder in this Storage is ${folderIndex}.`
      ))
    }
  }

  /**
   * @param  {React.Component} component     SideNav/index
   * @param  {String} storageKey  A key of a Storage in `data.storageMap`.
   * @return {Result<HashHistoryURL, Error>}
   */
  function downFromStorageDisregardFolders (component, storageKey) {
    return findStorage(component, storageKey, 1).matchWith({
      Ok ({ value }) {
        // Next bottom storage exists, so go to it.
        const [storage] = value
        return Result.Ok(basePaths.storages + storage.key)
      },
      Error () {
        // Next bottom storage does not exist, so go to first item of SideNavFilter.
        return getSideNavFilterPathname(0)
      }
    })
  }

  /**
   * @param  {React.Component} component     SideNav/index
   * @param  {String} storageKey  A key of a Storage in `data.storageMap`.
   * @return {Result<HashHistoryURL, Error>}
   */
  function downFromStorage (component, storageKey) {
    return findStorage(component, storageKey).chain(
      ([storage, { isClosed }]) => {
        if (storage.folders.length === 0) {
          // Storage is empty, so whether it's closed or open, try to go to next bottom storage.
          return downFromStorageDisregardFolders(component, storageKey)
        }

        // Storage is not empty
        return isClosed
          // and it's closed, so try to go to next bottom storage.
          ? downFromStorageDisregardFolders(component, storageKey)
          // and it's open so go to first folder in storage.
          : Result.Ok(basePaths.storages + storage.key + basePaths.folders + storage.folders[0].key)
      }
    )
  }

  /**
   * @param  {React.Component} component     SideNav/index
   * @param  {Storage} storage  A value in SideNav's `data.storageMap`.
   * @param  {String} folderKey A folder's key.
   * @return {Result<HashHistoryURL, Error>}
   */
  function downFromFolder (component, storage, folderKey) {
    const folderIndex = storage.folders.findIndex(folder => folder.key === folderKey)

    if (folderIndex === (storage.folders.length - 1)) {
      // There is no sibling bottom folder, so try to find a parent bottom storage
      // to move to.
      return findStorage(component, storage.key, 1).matchWith({
        Ok ({ value }) {
          // There is a parent bottom storage so go to it
          const [storage] = value
          return Result.Ok(basePaths.storages + storage.key)
        },
        Error ({ value }) {
          // There is no parent bottom storage, so go to first item in SideNavFilter.
          return getSideNavFilterPathname(0)
        }
      })
    } else {
      // There is a sibling bottom folder, so go to it.
      return Result.Ok(basePaths.storages + storage.key + basePaths.folders + storage.folders[folderIndex + 1].key)
    }
  }

  function upFromFirstSideNavFilterItem (component) {
    const storageMap = component.props.data.storageMap
    if (storageMap.size === 0) {
      // There are no storage items, so go to last item in SideNavFilter
      return getSideNavFilterPathname(sideNavFilterPathnames.length - 1)
    }
    // At least one storage item exists
    const storageMapAsKeyStorageArray = Array.from(storageMap)
    const lastStorage = storageMapAsKeyStorageArray[storageMapAsKeyStorageArray.length - 1][1]
    return findStorage(component, lastStorage.key).map(
      ([, { isClosed }]) => {
        if (isClosed) {
          return basePaths.storages + lastStorage.key
        } else {
          if (lastStorage.folders.length === 0) {
            return basePaths.storages + lastStorage.key
          } else {
            // Last storage item is open and not empty, so go to its last folder.
            const storagePath = basePaths.storages + lastStorage.key
            const folderPath = basePaths.folders + lastStorage.folders[lastStorage.folders.length - 1].key
            return storagePath + folderPath
          }
        }
      }
    )
  }

  function downFromLastSideNavFilterItem (component) {
    const storageMap = component.props.data.storageMap
    if (storageMap.size === 0) {
      // There are no storage items, so go to first item in SideNavFilter
      return getSideNavFilterPathname(0)
    }
    // At least one storage item exists.
    const storageMapAsKeyStorageArray = Array.from(storageMap)
    const firstStorage = storageMapAsKeyStorageArray[0][1]
    // Whether firstStorage is closed or open, go to it.
    return Result.Ok(basePaths.storages + firstStorage.key)
  }

  function upFromSideNavFilterItem (component, pathname) {
    // Items in SideNavFilter may change (or change position).
    const index = sideNavFilterPathnames.indexOf(pathname) - 1
    if (index < 0) return upFromFirstSideNavFilterItem(component)
    return getSideNavFilterPathname(index)
  }

  function downFromSideNavFilterItem (component, pathname) {
    // Items in SideNavFilter may change (or change position).
    const index = sideNavFilterPathnames.indexOf(pathname) + 1
    if (index >= sideNavFilterPathnames.length) {
      return downFromLastSideNavFilterItem(component)
    }
    return getSideNavFilterPathname(index)
  }

   /**
   * Given a component (SideNav/index) gives back a path which `hashHistory`
   * can use to navigate to. This path is wrapped in an Result.
   * @callback movementToPath
   * @param {React.Component} component
   * @param {Result<HashHistoryURL, Error>} resultPath
   */

  /**
   * @type {Object}
   * @prop {movementToPath} up
   * @prop {movementToPath} down
   */
  const movementToPathFunctions = {
    up (component) {
      const pathname = component.props.location.pathname

      return parsePathname(pathname).chain(({
        isStoragePathname,
        isFolderPathname,
        isHomePathname,
        isStarredPathname,
        storageKey,
        folderKey
      }) => {
        if (isStoragePathname) {
          return upFromStorage(component, storageKey)
        } else if (isFolderPathname) {
          const storageMap = component.props.data.storageMap
          return upFromFolder(storageMap.get(storageKey), folderKey)
        } else if (isHomePathname) {
          return upFromSideNavFilterItem(component, basePaths.home)
        } else if (isStarredPathname) {
          return upFromSideNavFilterItem(component, basePaths.starred)
        } else {
          return Result.Error(new Error(`Don't know how to move up from pathname '${pathname}'`))
        }
      })
    },
    down (component) {
      const pathname = component.props.location.pathname

      return parsePathname(pathname).chain(({
        isStoragePathname,
        isFolderPathname,
        isHomePathname,
        isStarredPathname,
        storageKey,
        folderKey
      }) => {
        if (isStoragePathname) {
          return downFromStorage(component, storageKey)
        } else if (isFolderPathname) {
          const storageMap = component.props.data.storageMap
          const storage = storageMap.get(storageKey)
          return downFromFolder(component, storage, folderKey)
        } else if (isHomePathname) {
          return downFromSideNavFilterItem(component, basePaths.home)
        } else if (isStarredPathname) {
          return downFromSideNavFilterItem(component, basePaths.starred)
        } else {
          return Result.Error(new Error(`Don't know how to move down from pathname '${pathname}'`))
        }
      })
    },
    currentStorage (component) {
      const pathname = component.props.location.pathname
      return parsePathname(pathname).chain(({
        isStoragePathname,
        isFolderPathname,
        storageKey
      }) => {
        if (isStoragePathname || isFolderPathname) {
          return Result.Ok(basePaths.storages + storageKey)
        }
        return Result.Error(`Cannot go to current storage if the current ` +
          `pathname (${pathname}) is not for a storage or folder.`)
      })
    }
  }

  return movementToPathFunctions
}
