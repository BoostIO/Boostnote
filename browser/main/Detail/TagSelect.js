import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './TagSelect.styl'
import _ from 'lodash'
import AwsMobileAnalyticsConfig from 'browser/main/lib/AwsMobileAnalyticsConfig'
import i18n from 'browser/lib/i18n'
import ee from 'browser/main/lib/eventEmitter'

class TagSelect extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      newTag: ''
    }
    this.addtagHandler = this.handleAddTag.bind(this)
  }

  componentDidMount () {
    this.value = this.props.value
    ee.on('editor:add-tag', this.addtagHandler)
  }

  componentDidUpdate () {
    this.value = this.props.value
  }

  componentWillUnmount () {
    ee.off('editor:add-tag', this.addtagHandler)
  }

  handleAddTag () {
    this.refs.newTag.focus()
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

  handleNewTagBlur (e) {
    this.submitTag()
  }

  removeLastTag () {
    this.removeTagByCallback((value) => {
      value.pop()
    })
  }

  reset () {
    this.setState({
      newTag: ''
    })
  }

  submitTag () {
    AwsMobileAnalyticsConfig.recordDynamicCustomEvent('ADD_TAG')
    let { value } = this.props
    let newTag = this.refs.newTag.value.trim().replace(/ +/g, '_')
    newTag = newTag.charAt(0) === '#' ? newTag.substring(1) : newTag

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
    this.removeTagByCallback((value, tag) => {
      value.splice(value.indexOf(tag), 1)
    }, tag)
  }

  removeTagByCallback (callback, tag = null) {
    let { value } = this.props

    value = _.isArray(value)
      ? value.slice()
      : []
    callback(value, tag)
    value = _.uniq(value)

    this.value = value
    this.props.onChange()
  }

  render () {
    const { value, className } = this.props

    const tagList = _.isArray(value)
      ? value.map((tag) => {
        return (
          <span styleName='tag'
            key={tag}
          >
            <span styleName='tag-label'>#{tag}</span>
            <button styleName='tag-removeButton'
              onClick={(e) => this.handleTagRemoveButtonClick(tag)}
            >
              <img className='tag-removeButton-icon' src='../resources/icon/icon-x.svg' width='8px' />
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
          placeholder={i18n.__('Add tag...')}
          onChange={(e) => this.handleNewTagInputChange(e)}
          onKeyDown={(e) => this.handleNewTagInputKeyDown(e)}
          onBlur={(e) => this.handleNewTagBlur(e)}
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
