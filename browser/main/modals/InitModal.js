import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './InitModal.styl'
import dataApi from 'browser/main/lib/dataApi'
import store from 'browser/main/store'
import { hashHistory } from 'react-router'
import _ from 'lodash'
import ModalEscButton from 'browser/components/ModalEscButton'

const CSON = require('@rokt33r/season')
const path = require('path')
const electron = require('electron')
const { remote } = electron

function browseFolder () {
  let dialog = remote.dialog

  let defaultPath = remote.app.getPath('home')
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog({
      title: 'Select Directory',
      defaultPath,
      properties: ['openDirectory', 'createDirectory']
    }, function (targetPaths) {
      if (targetPaths == null) return resolve('')
      resolve(targetPaths[0])
    })
  })
}

class InitModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      path: path.join(remote.app.getPath('home'), 'Boostnote'),
      migrationRequested: true,
      isLoading: true,
      data: null,
      legacyStorageExists: false,
      isSending: false
    }
  }

  handlePathChange (e) {
    this.setState({
      path: e.target.value
    })
  }

  componentDidMount () {
    let data = null
    try {
      data = CSON.readFileSync(path.join(remote.app.getPath('userData'), 'local.json'))
    } catch (err) {
      console.error(err)
    }
    let newState = {
      isLoading: false
    }
    if (data != null) {
      newState.legacyStorageExists = true
      newState.data = data
    }
    this.setState(newState, () => {
      this.refs.createButton.focus()
    })
  }

  handlePathBrowseButtonClick (e) {
    browseFolder()
      .then((targetPath) => {
        if (targetPath.length > 0) {
          this.setState({
            path: targetPath
          })
        }
      })
      .catch((err) => {
        console.error('BrowseFAILED')
        console.error(err)
      })
  }

  handleSubmitButtonClick (e) {
    this.setState({
      isSending: true
    }, () => {
      dataApi
        .addStorage({
          name: 'My Storage',
          path: this.state.path
        })
        .then((data) => {
          if (this.state.migrationRequested && _.isObject(this.state.data) && _.isArray(this.state.data.folders) && _.isArray(this.state.data.articles)) {
            return dataApi.migrateFromV5Storage(data.storage.key, this.state.data)
          }
          return data
        })
        .then((data) => {
          if (data.storage.folders[0] != null) {
            return data
          } else {
            return dataApi
              .createFolder(data.storage.key, {
                color: '#1278BD',
                name: 'Default'
              })
              .then((_data) => {
                return {
                  storage: _data.storage,
                  notes: data.notes
                }
              })
          }
        })
        .then((data) => {
          console.log(data)
          store.dispatch({
            type: 'ADD_STORAGE',
            storage: data.storage,
            notes: data.notes
          })

          let defaultSnippetNote = dataApi
            .createNote(data.storage.key, {
              type: 'SNIPPET_NOTE',
              folder: data.storage.folders[0].key,
              title: 'Snippet note example',
              description: 'Snippet note example\nYou can store a series of snippets as a single note, like Gist.',
              snippets: [
                {
                  name: 'example.html',
                  mode: 'html',
                  content: '<html>\n<body>\n<h1 id=\'hello\'>Enjoy Boostnote!</h1>\n</body>\n</html>'
                },
                {
                  name: 'example.js',
                  mode: 'javascript',
                  content: 'var boostnote = document.getElementById(\'enjoy\').innerHTML\n\nconsole.log(boostnote)'
                }
              ]
            })
            .then((note) => {
              store.dispatch({
                type: 'UPDATE_NOTE',
                note: note
              })
            })
          let defaultMarkdownNote = dataApi
            .createNote(data.storage.key, {
              type: 'MARKDOWN_NOTE',
              folder: data.storage.folders[0].key,
              title: 'Welcome to Boostnote!',
              content: '# Welcome to Boostnote! \n### _Click to edit this note._\n\n---\n\nBoostnote is an *open source* note-taking app. \nRepository is published on [GitHub](https://github.com/BoostIO/Boostnote), and tweeting everyday on [@Boostnoteapp](https://twitter.com/boostnoteapp)!\n\n## Features \n- [x] No internet or registration required. \n- [ ] Quick search and copy the content of note. macOS: <kbd>Cmd</kbd> + <kbd>Alt</kbd> + <kbd>S</kbd> / windows: <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>S</kbd> \n- [ ] Markdown & Snippet note. \n- [ ] Available for `vim` and `emacs` mode. \n- [ ] Choose your favorite theme on UI, Editor and Code Block! \n--- \n\n- Copy Codeblock on Markdown Preview.\n```javascript\nvar boostnote = document.getElementById(\'enjoy\').innerHTML\n\nconsole.log(boostnote)\n```'
            })
            .then((note) => {
              store.dispatch({
                type: 'UPDATE_NOTE',
                note: note
              })
            })

          return Promise.resolve(defaultSnippetNote)
            .then(defaultMarkdownNote)
            .then(() => data.storage)
        })
        .then((storage) => {
          hashHistory.push('/storages/' + storage.key)
          this.props.close()
        })
        .catch((err) => {
          this.setState({
            isSending: false
          })
          throw err
        })
    })
  }

  handleMigrationRequestedChange (e) {
    this.setState({
      migrationRequested: e.target.checked
    })
  }

  render () {
    if (this.state.isLoading) {
      return <div styleName='root--loading'>
        <i styleName='spinner' className='fa fa-spin fa-spinner' />
        <div styleName='loadingMessage'>Preparing initialization...</div>
      </div>
    }
    return (
      <div styleName='root'
        tabIndex='-1'
        onKeyDown={this.props.close}
      >

        <div styleName='header'>
          <div styleName='header-title'>Initialize Storage</div>
        </div>
        <ModalEscButton handleEscButtonClick={this.props.close} />
        <div styleName='body'>
          <div styleName='body-welcome'>
            Welcome!
          </div>
          <div styleName='body-description'>
           Please select a directory for Boostnote storage.
          </div>
          <div styleName='body-path'>
            <input styleName='body-path-input'
              placeholder='Select Folder'
              value={this.state.path}
              onChange={(e) => this.handlePathChange(e)}
            />
            <button styleName='body-path-button'
              onClick={(e) => this.handlePathBrowseButtonClick(e)}
            >
              ...
            </button>
          </div>

          {this.state.legacyStorageExists &&
            <div styleName='body-migration'>
              <label><input type='checkbox' checked={this.state.migrationRequested} onChange={(e) => this.handleMigrationRequestedChange(e)} /> Migrate old data from the legacy app v0.5</label>
            </div>
          }

          <div styleName='body-control'>
            <button styleName='body-control-createButton'
              ref='createButton'
              onClick={(e) => this.handleSubmitButtonClick(e)}
              disabled={this.state.isSending}
            >
              {this.state.isSending
                ? <span>
                  <i className='fa fa-spin fa-spinner' /> Loading...
                </span>
                : 'Let\'s Go!'
              }
            </button>
          </div>
        </div>

      </div>
    )
  }
}

InitModal.propTypes = {
}

export default CSSModules(InitModal, styles)
