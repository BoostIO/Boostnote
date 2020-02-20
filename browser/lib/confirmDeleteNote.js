import electron from 'electron'
import i18n from 'browser/lib/i18n'
const { remote } = electron
const { dialog } = remote

export function confirmDeleteNote(confirmDeletion, permanent) {
  if (confirmDeletion || permanent) {
    const alertConfig = {
      type: 'warning',
      message: i18n.__('Confirm note deletion'),
      detail: i18n.__('This will permanently remove this note.'),
      buttons: [i18n.__('Confirm'), i18n.__('Cancel')]
    }

    const dialogButtonIndex = dialog.showMessageBox(
      remote.getCurrentWindow(),
      alertConfig
    )

    return dialogButtonIndex === 0
  }

  return true
}
