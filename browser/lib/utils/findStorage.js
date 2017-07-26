import Result from 'folktale/result'
import { get } from 'lodash'

/**
 * @typedef {Object} StorageInfo
 * @prop {number} index The index of the Storage in `data.storageMap`
 * @prop {boolean} isClosed Whether the Storage's folders are collapsed (in the SideNav)
 */

/**
* Given a component, storageKey and offset, returns a Tuple with a Storage
* Object and some info about it.
*
* A Storage Object is a value in the given component's `data.storageMap` Map.
*
* This Map is first turned into an Array. Then the index of the Storage Object
* with the given storageKey is found. Then, the given offset is applied to
* this index.
* The new index is used to locate the final Storage Object to extract from the
* Array.
*
* e.g. if offset is 0, the returned Storage will be for the one identified by the
* given storageKey.
*
* e.g. if offset is 1, the Storage of the StorageItem which is 1
* index higher than the index of the StorageItem with key storageKey is returned.
* Visually, this is the StorageItem which is exactly below the one
* identified by storageKey (in Boostnote's SideNav)
*
* Apart from the Storage, a StorageInfo Object is returned in the second position
* of the Tuple. See {@link StorageInfo}.
*
* The returned value is wrapped in a [Result](http://folktale.origamitower.com/api/v2.0.0/en/folktale.result.html).
* If there's anything wrong with the input (no StorageItem for the given
* storageKey or the offset is invalid), then the result will be a
* Result.Error() wrapping a JS Error with a description of what went wrong.
* Otherwise, you'll get back a Result.Ok() wrapping the Tuple.
*
* @param  {React.Component} component     SideNav/index.js
* @param {String} storageKey
* @param {Number} offset
* @return {Result<Tuple<Storage, StorageInfo>, Error>}
* @see Tuple
*/
function findStorage (component, storageKey, offset = 0) {
  const storageMapPath = 'props.data.storageMap'
  const closedStorageIndicesPath = 'state.closedStorageIndices'
  const storageMap = get(component, storageMapPath)
  const closedStorageIndices = get(component, closedStorageIndicesPath)
  if (!storageMap) {
    return Result.Error(new Error(`Could not find '${storageMapPath}' in given component`))
  }
  if (!closedStorageIndices) {
    return Result.Error(new Error(`Could not find '${closedStorageIndicesPath}' in given component`))
  }

  const keyStorageArray = Array.from(storageMap)
  const givenStorageKeyAsIndex = keyStorageArray.findIndex(
    ([key]) => key === storageKey
  )

  if (givenStorageKeyAsIndex === -1) {
    return Result.Error(new Error(
      `The given storageKey (${storageKey}) could not be found in the ` +
      `array form of the given storageMap`
    ))
  }

  const index = givenStorageKeyAsIndex + offset
  const keyStorage = keyStorageArray[index]
  return keyStorage
  ? Result.Ok([
    // access Storage from keyStorage
    keyStorage[1],
    {
      index,
      isClosed: closedStorageIndices.has(index)
    }
  ])
  : Result.Error(new Error(
    `At index ${index}, could not find an entry in the array form of ` +
    `the given storageMap which has a length of ${keyStorageArray.length}`
  ))
}

export default findStorage
