// Actions

export const FOCUS_SIDE_NAV = 'boostnote/focus/FOCUS_SIDE_NAV'
export const UNFOCUS_SIDE_NAV = 'boostnote/focus/UNFOCUS_SIDE_NAV'
export const FOCUS_NOTE_LIST = 'boostnote/focus/FOCUS_NOTE_LIST'
export const UNFOCUS_NOTE_LIST = 'boostnote/focus/UNFOCUS_NOTE_LIST'

// Action Creators

export function focusSideNav () {
  return { type: FOCUS_SIDE_NAV }
}
export function unfocusSideNav () {
  return { type: UNFOCUS_SIDE_NAV }
}

export function focusNoteList () {
  return { type: FOCUS_NOTE_LIST }
}
export function unfocusNoteList () {
  return { type: UNFOCUS_NOTE_LIST }
}

// Reducer

const initState = {
  sideNav: false
}

export default function reducer (state = initState, action) {
  switch (action.type) {
    case FOCUS_SIDE_NAV:
      return Object.assign({}, state, { sideNav: true })
    case UNFOCUS_SIDE_NAV:
      return Object.assign({}, state, { sideNav: false })
    case FOCUS_NOTE_LIST:
      return Object.assign({}, state, { noteList: true })
    case UNFOCUS_NOTE_LIST:
      return Object.assign({}, state, { noteList: false })
  }
  return state
}
