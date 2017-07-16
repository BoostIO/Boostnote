import electron from 'electron'

/**
 * Convenience to avoid remembering how to access main process arguments.
 * This can be used to detect if process is running in development mode.
 * Using `process.env.ENV_VAR` proves unreliable when used in e.g.
 * Boostnote/browser/main/store.js
 *
 * @example
 * mainProcessArgs.includes('--hot')
 *
 * @type {Array<String>}
 */
const mainProcessArgs = electron.remote.process.argv

export default mainProcessArgs
