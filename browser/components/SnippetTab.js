import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './SnippetTab.styl'
import context from 'browser/lib/context'

class SnippetTab extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      isRenaming: false,
      name: props.snippet.name
    }
  }

  componentWillUpdate (nextProps) {
    if (nextProps.snippet.name !== this.props.snippet.name) {
      this.setState({
        name: nextProps.snippet.name
      })
    }
  }

  handleClick (e) {
    this.props.onClick(e)
  }

  handleContextMenu (e) {
    context.popup([
      {
        label: 'Rename',
        click: (e) => this.handleRenameClick(e)
      }
    ])
  }

  handleRenameClick (e) {
    this.startRenaming()
  }

  handleNameInputBlur (e) {
    this.handleRename()
  }

  handleNameInputChange (e) {
    this.setState({
      name: e.target.value
    })
  }

  handleNameInputKeyDown (e) {
    switch (e.keyCode) {
      case 13:
        this.handleRename()
        break
      case 27:
        this.setState({
          name: this.props.snippet.name,
          isRenaming: false
        })
        break
    }
  }

  handleRename () {
    this.setState({
      isRenaming: false
    }, () => {
      if (this.props.snippet.name !== this.state.name) {
        this.props.onRename(this.state.name)
      }
    })
  }

  handleDeleteButtonClick (e) {
    this.props.onDelete(e)
  }

  startRenaming () {
    this.setState({
      isRenaming: true
    }, () => {
      this.refs.name.focus()
      this.refs.name.select()
    })
  }

  render () {
    let { isActive, snippet, isDeletable } = this.props
    return (
      <div styleName={isActive
          ? 'root--active'
          : 'root'
        }
      >
        {!this.state.isRenaming
          ? <button styleName='button'
            onClick={(e) => this.handleClick(e)}
            onDoubleClick={(e) => this.handleRenameClick(e)}
            onContextMenu={(e) => this.handleContextMenu(e)}
          >
            {snippet.name.trim().length > 0
              ? snippet.name
              : <span styleName='button-unnamed'>
                Unnamed
              </span>
            }
          </button>
          : <input styleName='input'
            ref='name'
            value={this.state.name}
            onChange={(e) => this.handleNameInputChange(e)}
            onBlur={(e) => this.handleNameInputBlur(e)}
            onKeyDown={(e) => this.handleNameInputKeyDown(e)}
          />
        }
        {isDeletable &&
          <button styleName='deleteButton'
            onClick={(e) => this.handleDeleteButtonClick(e)}
          >
            <i className='fa fa-times' />
          </button>
        }
      </div>
    )
  }
}

SnippetTab.propTypes = {
}

export default CSSModules(SnippetTab, styles)
