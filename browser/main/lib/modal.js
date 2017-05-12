import React from 'react'
import { Provider } from 'react-redux'
import ReactDOM from 'react-dom'
import store from '../store'

class ModalBase extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      component: null,
      componentProps: {},
      isHidden: true
    }
  }

  close () {
    if (modalBase != null) modalBase.setState({component: null, componentProps: null, isHidden: true})

    // Toggle display for scrollbars
    let list = document.querySelectorAll('.NoteList__list___browser-main-NoteList-, .SnippetNoteDetail__description___browser-main-Detail- > textarea')
    list.forEach((each) => { each.style.overflow = 'auto' })

    let notesScrollbar = document.querySelector('.CodeMirror-vscrollbar')
    notesScrollbar.style.display = 'block'
  }

  render () {
    return (
      <div className={'ModalBase' + (this.state.isHidden ? ' hide' : '')}>
        <div onClick={(e) => this.close(e)} className='modalBack' />
        {this.state.component == null ? null : (
          <Provider store={store}>
            <this.state.component {...this.state.componentProps} close={this.close} />
          </Provider>
        )}
      </div>
    )
  }
}

let el = document.createElement('div')
document.body.appendChild(el)
let modalBase = ReactDOM.render(<ModalBase />, el)

function hideScrollBars () {
  let list = document.querySelectorAll('.NoteList__list___browser-main-NoteList-, .SnippetNoteDetail__description___browser-main-Detail- > textarea')
  list.forEach((each) => { each.style.overflow = 'hidden' })

  let notesScrollbar = document.querySelector('.CodeMirror-vscrollbar')
  notesScrollbar.style.display = 'none'
}

export function openModal (component, props) {
  if (modalBase == null) { return }
  // Hide scrollbar by removing overflow when modal opens
  hideScrollBars()

  document.body.setAttribute('data-modal', 'open')
  modalBase.setState({component: component, componentProps: props, isHidden: false})
}

export function closeModal () {
  if (modalBase == null) { return }
  modalBase.close()
}

export function isModalOpen () {
  return !modalBase.state.isHidden
}

export default {
  open: openModal,
  close: closeModal,
  isOpen: isModalOpen
}
