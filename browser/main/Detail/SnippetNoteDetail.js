import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './SnippetNoteDetail.styl'
import CodeEditor from 'browser/components/CodeEditor'
import MarkdownEditor from 'browser/components/MarkdownEditor'
import StarButton from './StarButton'
import TagSelect from './TagSelect'
import FolderSelect from './FolderSelect'
import dataApi from 'browser/main/lib/dataApi'
import { hashHistory } from 'react-router'
import ee from 'browser/main/lib/eventEmitter'
import CodeMirror from 'codemirror'
import SnippetTab from 'browser/components/SnippetTab'
import StatusBar from '../StatusBar'
import context from 'browser/lib/context'
import ConfigManager from 'browser/main/lib/ConfigManager'
import _ from 'lodash'
import { findNoteTitle } from 'browser/lib/findNoteTitle'
import AwsMobileAnalyticsConfig from 'browser/main/lib/AwsMobileAnalyticsConfig'
import TrashButton from './TrashButton'
import InfoButton from './InfoButton'
import InfoPanel from './InfoPanel'
import InfoPanelTrashed from './InfoPanelTrashed'
import { formatDate } from 'browser/lib/date-formatter'

function pass (name) {
  switch (name) {
    case 'ejs':
      return 'Embedded Javascript'
    case 'html_ruby':
      return 'Embedded Ruby'
    case 'objectivec':
      return 'Objective C'
    case 'text':
      return 'Plain Text'
    default:
      return name
  }
}

const electron = require('electron')
const { remote } = electron
const { Menu, MenuItem, dialog } = remote

class SnippetNoteDetail extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      isMovingNote: false,
      snippetIndex: 0,
      note: Object.assign({
        description: ''
      }, props.note, {
        snippets: props.note.snippets.map((snippet) => Object.assign({}, snippet))
      })
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.note.key !== this.props.note.key && !this.isMovingNote) {
      if (this.saveQueue != null) this.saveNow()
      let nextNote = Object.assign({
        description: ''
      }, nextProps.note, {
        snippets: nextProps.note.snippets.map((snippet) => Object.assign({}, snippet))
      })
      this.setState({
        snippetIndex: 0,
        note: nextNote
      }, () => {
        let { snippets } = this.state.note
        snippets.forEach((snippet, index) => {
          this.refs['code-' + index].reload()
        })
        if (this.refs.tags) this.refs.tags.reset()
      })
    }
  }

  componentWillUnmount () {
    if (this.saveQueue != null) this.saveNow()
  }

  handleChange (e) {
    let { note } = this.state

    if (this.refs.tags) note.tags = this.refs.tags.value
    note.description = this.refs.description.value
    note.updatedAt = new Date()
    note.title = findNoteTitle(note.description)

    this.setState({
      note
    }, () => {
      this.save()
    })
  }

  save () {
    clearTimeout(this.saveQueue)
    this.saveQueue = setTimeout(() => {
      this.saveNow()
    }, 1000)
  }

  saveNow () {
    let { note, dispatch } = this.props
    clearTimeout(this.saveQueue)
    this.saveQueue = null

    dataApi
      .updateNote(note.storage, note.key, this.state.note)
      .then((note) => {
        dispatch({
          type: 'UPDATE_NOTE',
          note: note
        })
        AwsMobileAnalyticsConfig.recordDynamicCustomEvent('EDIT_NOTE')
      })
  }

  handleFolderChange (e) {
    let { note } = this.state
    let value = this.refs.folder.value
    let splitted = value.split('-')
    let newStorageKey = splitted.shift()
    let newFolderKey = splitted.shift()

    dataApi
      .moveNote(note.storage, note.key, newStorageKey, newFolderKey)
      .then((newNote) => {
        this.setState({
          isMovingNote: true,
          note: Object.assign({}, newNote)
        }, () => {
          let { dispatch, location } = this.props
          dispatch({
            type: 'MOVE_NOTE',
            originNote: note,
            note: newNote
          })
          hashHistory.replace({
            pathname: location.pathname,
            query: {
              key: newNote.storage + '-' + newNote.key
            }
          })
          this.setState({
            isMovingNote: false
          })
        })
      })
  }

  handleStarButtonClick (e) {
    let { note } = this.state
    if (!note.isStarred) AwsMobileAnalyticsConfig.recordDynamicCustomEvent('ADD_STAR')

    note.isStarred = !note.isStarred

    this.setState({
      note
    }, () => {
      this.save()
    })
  }

  exportAsFile () {

  }

  handleTrashButtonClick (e) {
    let { note } = this.state
    const { isTrashed } = note

    if (isTrashed) {
      let dialogueButtonIndex = dialog.showMessageBox(remote.getCurrentWindow(), {
        type: 'warning',
        message: 'Confirm note deletion',
        detail: 'This will permanently remove this note.',
        buttons: ['Confirm', 'Cancel']
      })
      if (dialogueButtonIndex === 1) return
      let { note, dispatch } = this.props
      dataApi
        .deleteNote(note.storage, note.key)
        .then((data) => {
          let dispatchHandler = () => {
            dispatch({
              type: 'DELETE_NOTE',
              storageKey: data.storageKey,
              noteKey: data.noteKey
            })
          }
          ee.once('list:moved', dispatchHandler)
        })
    } else {
      note.isTrashed = true

      this.setState({
        note
      }, () => {
        this.save()
      })
    }
    ee.emit('list:next')
  }

  handleUndoButtonClick (e) {
    let { note } = this.state

    note.isTrashed = false

    this.setState({
      note
    }, () => {
      this.save()
      ee.emit('list:next')
    })
  }

  handleFullScreenButton (e) {
    ee.emit('editor:fullscreen')
  }

  handleTabPlusButtonClick (e) {
    this.addSnippet()
  }

  handleTabButtonClick (e, index) {
    this.setState({
      snippetIndex: index
    })
  }

  handleTabDeleteButtonClick (e, index) {
    if (this.state.note.snippets.length > 1) {
      if (this.state.note.snippets[index].content.trim().length > 0) {
        let dialogIndex = dialog.showMessageBox(remote.getCurrentWindow(), {
          type: 'warning',
          message: 'Delete a snippet',
          detail: 'This work cannot be undone.',
          buttons: ['Confirm', 'Cancel']
        })
        if (dialogIndex === 0) {
          this.deleteSnippetByIndex(index)
        }
      } else {
        this.deleteSnippetByIndex(index)
      }
    }
  }

  deleteSnippetByIndex (index) {
    const snippets = this.state.note.snippets.slice()
    snippets.splice(index, 1)
    const note = Object.assign({}, this.state.note, {snippets})
    const snippetIndex = this.state.snippetIndex >= snippets.length
      ? snippets.length - 1
      : this.state.snippetIndex
    this.setState({ note, snippetIndex }, () => {
      this.save()
      this.refs['code-' + this.state.snippetIndex].reload()
    })
  }

  renameSnippetByIndex (index, name) {
    let snippets = this.state.note.snippets.slice()
    snippets[index].name = name
    let syntax = CodeMirror.findModeByFileName(name.trim())
    let mode = syntax != null ? syntax.name : null
    if (mode != null) snippets[index].mode = mode
    this.setState({note: Object.assign(this.state.note, {snippets: snippets})})

    this.setState({
      note: this.state.note
    }, () => {
      this.save()
    })
  }

  handleModeOptionClick (index, name) {
    return (e) => {
      let snippets = this.state.note.snippets.slice()
      snippets[index].mode = name
      this.setState({note: Object.assign(this.state.note, {snippets: snippets})})

      this.setState({
        note: this.state.note
      }, () => {
        this.save()
      })
    }
  }

  handleCodeChange (index) {
    return (e) => {
      let snippets = this.state.note.snippets.slice()
      snippets[index].content = this.refs['code-' + index].value
      this.setState({note: Object.assign(this.state.note, {snippets: snippets})})
      this.setState({
        note: this.state.note
      }, () => {
        this.save()
      })
    }
  }

  handleKeyDown (e) {
    switch (e.keyCode) {
      case 9:
        if (e.ctrlKey && !e.shiftKey) {
          e.preventDefault()
          this.jumpNextTab()
        } else if (e.ctrlKey && e.shiftKey) {
          e.preventDefault()
          this.jumpPrevTab()
        } else if (!e.ctrlKey && !e.shiftKey && e.target === this.refs.description) {
          e.preventDefault()
          this.focusEditor()
        }
        break
      case 76:
        {
          let isSuper = global.process.platform === 'darwin'
            ? e.metaKey
            : e.ctrlKey
          if (isSuper) {
            e.preventDefault()
            this.focus()
          }
        }
        break
      case 84:
        {
          let isSuper = global.process.platform === 'darwin'
            ? e.metaKey
            : e.ctrlKey
          if (isSuper) {
            e.preventDefault()
            this.addSnippet()
          }
        }
        break
    }
  }

  handleModeButtonClick (e, index) {
    let menu = new Menu()
    CodeMirror.modeInfo.forEach((mode) => {
      menu.append(new MenuItem({
        label: mode.name,
        click: (e) => this.handleModeOptionClick(index, mode.name)(e)
      }))
    })
    menu.popup(remote.getCurrentWindow())
  }

  handleIndentTypeButtonClick (e) {
    context.popup([
      {
        label: 'tab',
        click: (e) => this.handleIndentTypeItemClick(e, 'tab')
      },
      {
        label: 'space',
        click: (e) => this.handleIndentTypeItemClick(e, 'space')
      }
    ])
  }

  handleIndentSizeButtonClick (e) {
    context.popup([
      {
        label: '2',
        click: (e) => this.handleIndentSizeItemClick(e, 2)
      },
      {
        label: '4',
        click: (e) => this.handleIndentSizeItemClick(e, 4)
      },
      {
        label: '8',
        click: (e) => this.handleIndentSizeItemClick(e, 8)
      }
    ])
  }

  handleIndentSizeItemClick (e, indentSize) {
    let { config, dispatch } = this.props
    let editor = Object.assign({}, config.editor, {
      indentSize
    })
    ConfigManager.set({
      editor
    })
    dispatch({
      type: 'SET_CONFIG',
      config: {
        editor
      }
    })
  }

  handleIndentTypeItemClick (e, indentType) {
    let { config, dispatch } = this.props
    let editor = Object.assign({}, config.editor, {
      indentType
    })
    ConfigManager.set({
      editor
    })
    dispatch({
      type: 'SET_CONFIG',
      config: {
        editor
      }
    })
  }

  focus () {
    this.refs.description.focus()
  }

  addSnippet () {
    let { note } = this.state

    note.snippets = note.snippets.concat([{
      name: '',
      mode: 'Plain Text',
      content: ''
    }])
    let snippetIndex = note.snippets.length - 1

    this.setState({
      note,
      snippetIndex
    }, () => {
      this.refs['tab-' + snippetIndex].startRenaming()
    })
  }

  jumpNextTab () {
    this.setState({
      snippetIndex: (this.state.snippetIndex + 1) % this.state.note.snippets.length
    }, () => {
      this.focusEditor()
    })
  }

  jumpPrevTab () {
    this.setState({
      snippetIndex: (this.state.snippetIndex - 1 + this.state.note.snippets.length) % this.state.note.snippets.length
    }, () => {
      this.focusEditor()
    })
  }

  focusEditor () {
    console.log('code-' + this.state.snippetIndex)
    this.refs['code-' + this.state.snippetIndex].focus()
  }

  handleInfoButtonClick (e) {
    const infoPanel = document.querySelector('.infoPanel')
    if (infoPanel.style) infoPanel.style.display = infoPanel.style.display === 'none' ? 'inline' : 'none'
  }

  showWarning () {
    dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'warning',
      message: 'Sorry!',
      detail: 'md/text import is available only a markdown note.',
      buttons: ['OK']
    })
  }

  render () {
    let { data, config, location } = this.props
    let { note } = this.state

    let storageKey = note.storage
    let folderKey = note.folder

    let editorFontSize = parseInt(config.editor.fontSize, 10)
    if (!(editorFontSize > 0 && editorFontSize < 101)) editorFontSize = 14
    let editorIndentSize = parseInt(config.editor.indentSize, 10)
    if (!(editorFontSize > 0 && editorFontSize < 132)) editorIndentSize = 4

    let tabList = note.snippets.map((snippet, index) => {
      let isActive = this.state.snippetIndex === index

      return <SnippetTab
        key={index}
        ref={'tab-' + index}
        snippet={snippet}
        isActive={isActive}
        onClick={(e) => this.handleTabButtonClick(e, index)}
        onDelete={(e) => this.handleTabDeleteButtonClick(e, index)}
        onRename={(name) => this.renameSnippetByIndex(index, name)}
        isDeletable={note.snippets.length > 1}
      />
    })

    let viewList = note.snippets.map((snippet, index) => {
      let isActive = this.state.snippetIndex === index

      let syntax = CodeMirror.findModeByName(pass(snippet.mode))
      if (syntax == null) syntax = CodeMirror.findModeByName('Plain Text')

      return <div styleName='tabView'
        key={index}
        style={{zIndex: isActive ? 5 : 4}}
      >
        {snippet.mode === 'Markdown' || snippet.mode === 'GitHub Flavored Markdown'
          ? <MarkdownEditor styleName='tabView-content'
            value={snippet.content}
            config={config}
            onChange={(e) => this.handleCodeChange(index)(e)}
            ref={'code-' + index}
            ignorePreviewPointerEvents={this.props.ignorePreviewPointerEvents}
            storageKey={storageKey}
          />
          : <CodeEditor styleName='tabView-content'
            mode={snippet.mode}
            value={snippet.content}
            theme={config.editor.theme}
            fontFamily={config.editor.fontFamily}
            fontSize={editorFontSize}
            indentType={config.editor.indentType}
            indentSize={editorIndentSize}
            keyMap={config.editor.keyMap}
            onChange={(e) => this.handleCodeChange(index)(e)}
            ref={'code-' + index}
          />
        }
      </div>
    })

    let options = []
    data.storageMap.forEach((storage, index) => {
      storage.folders.forEach((folder) => {
        options.push({
          storage: storage,
          folder: folder
        })
      })
    })
    let currentOption = options.filter((option) => option.storage.key === storageKey && option.folder.key === folderKey)[0]

    const trashTopBar = <div styleName='info'>
      <div styleName='info-left'>
        <i styleName='undo-button'
          className='fa fa-undo fa-fw'
          onClick={(e) => this.handleUndoButtonClick(e)}
        />
      </div>
      <div styleName='info-right'>
        <TrashButton onClick={(e) => this.handleTrashButtonClick(e)} />
        <InfoButton
          onClick={(e) => this.handleInfoButtonClick(e)}
        />
        <InfoPanelTrashed
          storageName={currentOption.storage.name}
          folderName={currentOption.folder.name}
          updatedAt={formatDate(note.updatedAt)}
          createdAt={formatDate(note.createdAt)}
          exportAsMd={this.showWarning}
          exportAsTxt={this.showWarning}
        />
      </div>
    </div>

    const detailTopBar = <div styleName='info'>
      <div styleName='info-left'>
        <StarButton styleName='info-left-button'
          onClick={(e) => this.handleStarButtonClick(e)}
          isActive={note.isStarred}
        />
        <div styleName='info-left-top'>
          <FolderSelect styleName='info-left-top-folderSelect'
            value={this.state.note.storage + '-' + this.state.note.folder}
            ref='folder'
            data={data}
            onChange={(e) => this.handleFolderChange(e)}
          />
        </div>

        <TagSelect
          ref='tags'
          value={this.state.note.tags}
          onChange={(e) => this.handleChange(e)}
        />
      </div>
      <div styleName='info-right'>
        <TrashButton onClick={(e) => this.handleTrashButtonClick(e)} />
        <button styleName='control-fullScreenButton'
          onMouseDown={(e) => this.handleFullScreenButton(e)}
        >
          <i className='fa fa-window-maximize' styleName='fullScreen-button' />
        </button>
        <InfoButton
          onClick={(e) => this.handleInfoButtonClick(e)}
        />
        <InfoPanel
          storageName={currentOption.storage.name}
          folderName={currentOption.folder.name}
          noteLink={`[${note.title}](${location.query.key})`}
          updatedAt={formatDate(note.updatedAt)}
          createdAt={formatDate(note.createdAt)}
          exportAsMd={this.showWarning}
          exportAsTxt={this.showWarning}
          type={note.type}
        />
      </div>
    </div>

    return (
      <div className='NoteDetail'
        style={this.props.style}
        styleName='root'
        onKeyDown={(e) => this.handleKeyDown(e)}
      >
        {location.pathname === '/trashed' ? trashTopBar : detailTopBar}

        <div styleName='body'>
          <div styleName='description'>
            <textarea
              style={{
                fontFamily: config.preview.fontFamily,
                fontSize: parseInt(config.preview.fontSize, 10)
              }}
              ref='description'
              placeholder='Description...'
              value={this.state.note.description}
              onChange={(e) => this.handleChange(e)}
            />
          </div>
          <div styleName='tabList'>
            <div styleName='list'>
              {tabList}
            </div>
            <button styleName='plusButton'
              onClick={(e) => this.handleTabPlusButtonClick(e)}
            >
              <i className='fa fa-plus' />
            </button>
          </div>
          {viewList}
        </div>

        <div styleName='override'>
          <button
            onClick={(e) => this.handleModeButtonClick(e, this.state.snippetIndex)}
          >
            {this.state.note.snippets[this.state.snippetIndex].mode == null
              ? 'Select Syntax...'
              : this.state.note.snippets[this.state.snippetIndex].mode
            }&nbsp;
            <i className='fa fa-caret-down' />
          </button>
          <button
            onClick={(e) => this.handleIndentTypeButtonClick(e)}
          >
            Indent: {config.editor.indentType}&nbsp;
            <i className='fa fa-caret-down' />
          </button>
          <button
            onClick={(e) => this.handleIndentSizeButtonClick(e)}
          >
            size: {config.editor.indentSize}&nbsp;
            <i className='fa fa-caret-down' />
          </button>
        </div>

        <StatusBar
          {..._.pick(this.props, ['config', 'location', 'dispatch'])}
          date={note.updatedAt}
        />
      </div>
    )
  }
}

SnippetNoteDetail.propTypes = {
  dispatch: PropTypes.func,
  repositories: PropTypes.array,
  note: PropTypes.shape({

  }),
  style: PropTypes.shape({
    left: PropTypes.number
  }),
  ignorePreviewPointerEvents: PropTypes.bool
}

export default CSSModules(SnippetNoteDetail, styles)
