import PropTypes from 'prop-types'
import React from 'react'
import invertColor from 'invert-color'
import CSSModules from 'browser/lib/CSSModules'
import styles from './TagSelect.styl'
import _ from 'lodash'
import AwsMobileAnalyticsConfig from 'browser/main/lib/AwsMobileAnalyticsConfig'
import i18n from 'browser/lib/i18n'
import ee from 'browser/main/lib/eventEmitter'
import Autosuggest from 'react-autosuggest'
import { push } from 'connected-react-router'

class TagSelect extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      newTag: '',
      suggestions: []
    }

    this.handleAddTag = this.handleAddTag.bind(this)
    this.handleRenameTag = this.handleRenameTag.bind(this)
    this.onInputBlur = this.onInputBlur.bind(this)
    this.onInputChange = this.onInputChange.bind(this)
    this.onInputKeyDown = this.onInputKeyDown.bind(this)
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(
      this
    )
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(
      this
    )
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this)
  }

  addNewTag(newTag) {
    AwsMobileAnalyticsConfig.recordDynamicCustomEvent('ADD_TAG')

    newTag = newTag.trim().replace(/ +/g, '_')
    if (newTag.charAt(0) === '#') {
      newTag.substring(1)
    }

    if (newTag.length <= 0) {
      this.setState({
        newTag: ''
      })
      return
    }

    let { value } = this.props
    value = _.isArray(value) ? value.slice() : []

    if (!_.includes(value, newTag)) {
      value.push(newTag)
    }

    if (this.props.saveTagsAlphabetically) {
      value = _.sortBy(value)
    }

    this.setState(
      {
        newTag: ''
      },
      () => {
        this.value = value
        this.props.onChange()
      }
    )
  }

  buildSuggestions() {
    this.suggestions = _.sortBy(
      this.props.data.tagNoteMap
        .map((tag, name) => ({
          name,
          nameLC: name.toLowerCase(),
          size: tag.size
        }))
        .filter(tag => tag.size > 0),
      ['name']
    )
  }

  componentDidMount() {
    this.value = this.props.value

    this.buildSuggestions()

    ee.on('editor:add-tag', this.handleAddTag)
    ee.on('sidebar:rename-tag', this.handleRenameTag)
  }

  componentDidUpdate() {
    this.value = this.props.value
  }

  componentWillUnmount() {
    ee.off('editor:add-tag', this.handleAddTag)
    ee.off('sidebar:rename-tag', this.handleRenameTag)
  }

  handleAddTag() {
    this.refs.newTag.input.focus()
  }

  handleRenameTag(event, tagChange) {
    const { value } = this.props
    const { tag, updatedTag } = tagChange
    const newTags = value.slice()

    newTags[value.indexOf(tag)] = updatedTag
    this.value = newTags
    this.props.onChange()
  }

  handleTagLabelClick(tag) {
    const { dispatch } = this.props

    // Note: `tag` requires encoding later.
    //       E.g. % in tag is a problem (see issue #3170) - encodeURIComponent(tag) is not working.
    dispatch(push(`/tags/${tag}`))
  }

  handleTagRemoveButtonClick(tag) {
    this.removeTagByCallback((value, tag) => {
      value.splice(value.indexOf(tag), 1)
    }, tag)
  }

  onInputBlur(e) {
    this.submitNewTag()
  }

  onInputChange(e, { newValue, method }) {
    this.setState({
      newTag: newValue
    })
  }

  onInputKeyDown(e) {
    switch (e.keyCode) {
      case 9:
        e.preventDefault()
        this.submitNewTag()
        break
      case 13:
        this.submitNewTag()
        break
      case 8:
        if (this.state.newTag.length === 0) {
          this.removeLastTag()
        }
    }
  }

  onSuggestionsClearRequested() {
    this.setState({
      suggestions: []
    })
  }

  onSuggestionsFetchRequested({ value }) {
    const valueLC = value.toLowerCase()
    const suggestions = _.filter(
      this.suggestions,
      tag =>
        !_.includes(this.value, tag.name) && tag.nameLC.indexOf(valueLC) !== -1
    )

    this.setState({
      suggestions
    })
  }

  onSuggestionSelected(event, { suggestion, suggestionValue }) {
    this.addNewTag(suggestionValue)
  }

  removeLastTag() {
    this.removeTagByCallback(value => {
      value.pop()
    })
  }

  removeTagByCallback(callback, tag = null) {
    let { value } = this.props

    value = _.isArray(value) ? value.slice() : []
    callback(value, tag)
    value = _.uniq(value)

    this.value = value
    this.props.onChange()
  }

  reset() {
    this.buildSuggestions()

    this.setState({
      newTag: ''
    })
  }

  submitNewTag() {
    this.addNewTag(this.refs.newTag.input.value)
  }

  render() {
    const { value, className, showTagsAlphabetically, coloredTags } = this.props

    const tagList = _.isArray(value)
      ? (showTagsAlphabetically ? _.sortBy(value) : value).map(tag => {
          const wrapperStyle = {}
          const textStyle = {}
          const BLACK = '#333333'
          const WHITE = '#f1f1f1'
          const color = coloredTags[tag]
          const invertedColor =
            color && invertColor(color, { black: BLACK, white: WHITE })
          let iconRemove = '../resources/icon/icon-x.svg'
          if (color) {
            wrapperStyle.backgroundColor = color
            textStyle.color = invertedColor
          }
          if (invertedColor === WHITE) {
            iconRemove = '../resources/icon/icon-x-light.svg'
          }
          return (
            <span styleName='tag' key={tag} style={wrapperStyle}>
              <span
                styleName='tag-label'
                style={textStyle}
                onClick={e => this.handleTagLabelClick(tag)}
              >
                #{tag}
              </span>
              <button
                styleName='tag-removeButton'
                onClick={e => this.handleTagRemoveButtonClick(tag)}
              >
                <img
                  className='tag-removeButton-icon'
                  src={iconRemove}
                  width='8px'
                />
              </button>
            </span>
          )
        })
      : []

    const { newTag, suggestions } = this.state

    return (
      <div
        className={
          _.isString(className) ? 'TagSelect ' + className : 'TagSelect'
        }
        styleName='root'
      >
        {tagList}
        <Autosuggest
          ref='newTag'
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          onSuggestionSelected={this.onSuggestionSelected}
          getSuggestionValue={suggestion => suggestion.name}
          renderSuggestion={suggestion => <div>{suggestion.name}</div>}
          inputProps={{
            placeholder: i18n.__('Add tag...'),
            value: newTag,
            onChange: this.onInputChange,
            onKeyDown: this.onInputKeyDown,
            onBlur: this.onInputBlur
          }}
        />
      </div>
    )
  }
}

TagSelect.propTypes = {
  dispatch: PropTypes.func,
  className: PropTypes.string,
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
  coloredTags: PropTypes.object
}

export default CSSModules(TagSelect, styles)
