import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './InitModal.styl'
import dataApi from 'browser/main/lib/dataApi'
import store from 'browser/main/store'
import { hashHistory } from 'react-router'
import _ from 'lodash'

const CSON = require('@rokt33r/season')
const path = require('path')
const electron = require('electron')
const fs = require('fs')
const { remote } = electron

function browseFolder () {
  const dialog = remote.dialog

  const defaultPath = remote.app.getPath('home')
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

    const initPath = path.join(remote.app.getPath('home'), 'Boostnote')
    this.state = {
      path: initPath,
      pathAlreadyExists: pathExists(initPath),
      migrationRequested: true,
      isLoading: true,
      data: null,
      legacyStorageExists: false,
      isSending: false
    }
  }

  handlePathChange (e) {
    this.updatePath(e.target.value)
  }

  updatePath(path) {
    const pathAlreadyExists = pathExists(path)
    this.setState({ path, pathAlreadyExists })
  }

  componentDidMount () {
    let data = null
    try {
      data = CSON.readFileSync(path.join(remote.app.getPath('userData'), 'local.json'))
    } catch (err) {
      console.error(err)
    }
    const newState = {
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
          this.updatePath(targetPath)
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

          const defaultSnippetNote = dataApi
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
          const defaultMarkdownNote = dataApi
            .createNote(data.storage.key, {
              type: 'MARKDOWN_NOTE',
              folder: data.storage.folders[0].key,
              title: 'Welcome to Boostnote!',
              content: '# Welcome to Boostnote!\n## Click here to edit markdown :wave:\n\n<iframe width="560" height="315" src="https://www.youtube.com/embed/L0qNPLsvmyM" frameborder="0" allowfullscreen></iframe>\n\n## Docs :memo:\n- [Boostnote | Boost your happiness, productivity and creativity.](https://hackernoon.com/boostnote-boost-your-happiness-productivity-and-creativity-315034efeebe)\n- [Cloud Syncing & Backups](https://github.com/BoostIO/Boostnote/wiki/Cloud-Syncing-and-Backup)\n- [How to sync your data across Desktop and Mobile apps](https://github.com/BoostIO/Boostnote/wiki/Sync-Data-Across-Desktop-and-Mobile-apps)\n- [Convert data from **Evernote** to Boostnote.](https://github.com/BoostIO/Boostnote/wiki/Evernote)\n- [Keyboard Shortcuts](https://github.com/BoostIO/Boostnote/wiki/Keyboard-Shortcuts)\n- [Keymaps in Editor mode](https://github.com/BoostIO/Boostnote/wiki/Keymaps-in-Editor-mode)\n- [How to set syntax highlight in Snippet note](https://github.com/BoostIO/Boostnote/wiki/Syntax-Highlighting)\n\n---\n\n## Article Archive :books:\n- [Reddit English](http://bit.ly/2mOJPu7)\n- [Reddit Spanish](https://www.reddit.com/r/boostnote_es/)\n- [Reddit Chinese](https://www.reddit.com/r/boostnote_cn/)\n- [Reddit Japanese](https://www.reddit.com/r/boostnote_jp/)\n\n---\n\n## Community :beers:\n- [GitHub](http://bit.ly/2AWWzkD)\n- [Twitter](http://bit.ly/2z8BUJZ)\n- [Facebook Group](http://bit.ly/2jcca8t)'
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

  handleKeyDown (e) {
    if (e.keyCode === 27) {
      this.props.close()
    }
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
        onKeyDown={(e) => this.handleKeyDown(e)}
      >
        <div styleName='body'>
          <div styleName='body-welcome'>
            Welcome to Boostnote!
          </div>
          <div styleName='body-description'>
           Please select a directory for data storage.
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
                : (this.state.pathAlreadyExists ? 'USE' : 'CREATE')
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


function pathExists(path) {
  try {
    fs.statSync(path)
    return true
  } catch(e) {
    if (e.errno === -2) {
      // no such file or dir
      return false
    } else {
      throw e
    }
  }
}