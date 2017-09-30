/**
 * General utility functions when deal with Notes.
 */

const NoteUtils = {
  /**
   * Parses the storage and note key from a string representing both.
   * @param {string} key - A string of the form 'hex-hex'
   */
  parseKey: key => {
    const splitKey = key.split('-');
    return {
      storageKey: splitKey[0],
      noteKey: splitKey[1],
    };
  },
};

module.exports = NoteUtils;
