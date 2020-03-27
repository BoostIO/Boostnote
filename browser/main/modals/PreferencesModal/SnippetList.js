import React from 'react'
import styles from './SnippetTab.styl'
import CSSModules from 'browser/lib/CSSModules'
import dataApi from 'browser/main/lib/dataApi'
import i18n from 'browser/lib/i18n'
import eventEmitter from 'browser/main/lib/eventEmitter'
import context from 'browser/lib/context'

class SnippetList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      snippets: []
    }
  }

  componentDidMount() {
    this.reloadSnippetList()
    eventEmitter.on('snippetList:reload', this.reloadSnippetList.bind(this))
  }

  reloadSnippetList() {
    dataApi.fetchSnippet().then(snippets => {
      this.setState({ snippets })
      this.props.onSnippetSelect(this.props.currentSnippet)
    })
  }

  handleSnippetContextMenu(snippet) {
    context.popup([
      {
        label: i18n.__('Delete snippet'),
        click: () => this.deleteSnippet(snippet)
      }
    ])
  }

  deleteSnippet(snippet) {
    dataApi
      .deleteSnippet(snippet)
      .then(() => {
        this.reloadSnippetList()
        this.props.onSnippetDeleted(snippet)
      })
      .catch(err => {
        throw err
      })
  }

  handleSnippetClick(snippet) {
    this.props.onSnippetSelect(snippet)
  }

  createSnippet() {
    dataApi
      .createSnippet()
      .then(() => {
        this.reloadSnippetList()
        // scroll to end of list when added new snippet
        const snippetList = document.getElementById('snippets')
        snippetList.scrollTop = snippetList.scrollHeight
      })
      .catch(err => {
        throw err
      })
  }

  defineSnippetStyleName(snippet) {
    const { currentSnippet } = this.props

    if (currentSnippet == null) {
      return 'snippet-item'
    }

    if (currentSnippet.id === snippet.id) {
      return 'snippet-item-selected'
    } else {
      return 'snippet-item'
    }
  }

  render() {
    const { snippets } = this.state
    return (
      <div styleName='snippet-list'>
        <div styleName='group-section'>
          <div styleName='group-section-control'>
            <button
              styleName='group-control-button'
              onClick={() => this.createSnippet()}
            >
              <i className='fa fa-plus' /> {i18n.__('New Snippet')}
            </button>
          </div>
        </div>
        <ul id='snippets' styleName='snippets'>
          {snippets.map(snippet => (
            <li
              styleName={this.defineSnippetStyleName(snippet)}
              key={snippet.id}
              onContextMenu={() => this.handleSnippetContextMenu(snippet)}
              onClick={() => this.handleSnippetClick(snippet)}
            >
              {snippet.name}
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

export default CSSModules(SnippetList, styles)
