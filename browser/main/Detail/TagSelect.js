import React, { PropTypes } from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './TagSelect.styl'
import _ from 'lodash'
import AwsMobileAnalyticsConfig from 'browser/main/lib/AwsMobileAnalyticsConfig'

class TagSelect extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      newTag: ''
    }
  }

  componentDidMount () {
    this.value = this.props.value
  }

  componentDidUpdate () {
    this.value = this.props.value
  }

  handleNewTagInputKeyDown (e) {
    switch (e.keyCode) {
      case 9:
        e.preventDefault()
        this.submitTag()
        break
      case 13:
        this.submitTag()
        break
      case 8:
        if (this.refs.newTag.value.length === 0) {
          this.removeLastTag()
        }
    }
  }

  removeLastTag () {
    let { value } = this.props

    value = _.isArray(value)
      ? value.slice()
      : []
    value.pop()
    value = _.uniq(value)

    this.value = value
    this.props.onChange()
  }

  reset () {
    this.setState({
      newTag: ''
    })
  }

  submitTag () {
    AwsMobileAnalyticsConfig.recordDynamitCustomEvent('ADD_TAG')
    let { value } = this.props
    let newTag = this.refs.newTag.value.trim().replace(/ +/g, '_')

    if (newTag.length <= 0) {
      this.setState({
        newTag: ''
      })
      return
    }

    value = _.isArray(value)
      ? value.slice()
      : []
    value.push(newTag)
    value = _.uniq(value)

    this.setState({
      newTag: ''
    }, () => {
      this.value = value
      this.props.onChange()
    })
  }

  handleNewTagInputChange (e) {
    this.setState({
      newTag: this.refs.newTag.value
    })
  }

  handleTagRemoveButtonClick (tag) {
    return (e) => {
      let { value } = this.props

      value.splice(value.indexOf(tag), 1)
      value = _.uniq(value)

      this.value = value
      this.props.onChange()
    }
  }

  render () {
    let { value, className } = this.props

    let tagList = _.isArray(value)
      ? value.map((tag) => {
        return (
          <span styleName='tag'
            key={tag}
          >
            <span styleName='tag-label'>#{tag}</span>
            <button styleName='tag-removeButton'
              onClick={(e) => this.handleTagRemoveButtonClick(tag)(e)}
            >
              <i className='fa fa-times fa-fw tag-removeButton-icon' />
            </button>
          </span>
        )
      })
      : []

    return (
      <div className={_.isString(className)
          ? 'TagSelect ' + className
          : 'TagSelect'
        }
        styleName='root'
      >
        {tagList}
        <input styleName='newTag'
          ref='newTag'
          value={this.state.newTag}
          placeholder='Add tag...'
          onChange={(e) => this.handleNewTagInputChange(e)}
          onKeyDown={(e) => this.handleNewTagInputKeyDown(e)}
        />
      </div>
    )
  }
}

TagSelect.propTypes = {
  className: PropTypes.string,
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func

}

export default CSSModules(TagSelect, styles)
