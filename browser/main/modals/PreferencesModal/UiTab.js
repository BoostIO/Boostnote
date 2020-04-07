import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ConfigTab.styl'
import ConfigManager from 'browser/main/lib/ConfigManager'
import { store } from 'browser/main/store'
import consts from 'browser/lib/consts'
import ReactCodeMirror from 'react-codemirror'
import CodeMirror from 'codemirror'
import 'codemirror-mode-elixir'
import _ from 'lodash'
import i18n from 'browser/lib/i18n'
import { getLanguages } from 'browser/lib/Languages'
import normalizeEditorFontFamily from 'browser/lib/normalizeEditorFontFamily'
import uiThemes from 'browser/lib/ui-themes'
import { chooseTheme, applyTheme } from 'browser/main/lib/ThemeManager'

const OSX = global.process.platform === 'darwin'

const electron = require('electron')
const ipc = electron.ipcRenderer

class UiTab extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      config: props.config,
      codemirrorTheme: props.config.editor.theme
    }
  }

  componentDidMount() {
    CodeMirror.autoLoadMode(
      this.codeMirrorInstance.getCodeMirror(),
      'javascript'
    )
    CodeMirror.autoLoadMode(this.customCSSCM.getCodeMirror(), 'css')
    CodeMirror.autoLoadMode(
      this.customMarkdownLintConfigCM.getCodeMirror(),
      'javascript'
    )
    CodeMirror.autoLoadMode(this.prettierConfigCM.getCodeMirror(), 'javascript')
    // Set CM editor Sizes
    this.customCSSCM.getCodeMirror().setSize('400px', '400px')
    this.prettierConfigCM.getCodeMirror().setSize('400px', '400px')
    this.customMarkdownLintConfigCM.getCodeMirror().setSize('400px', '200px')

    this.handleSettingDone = () => {
      this.setState({
        UiAlert: {
          type: 'success',
          message: i18n.__('Successfully applied!')
        }
      })
    }
    this.handleSettingError = err => {
      this.setState({
        UiAlert: {
          type: 'error',
          message:
            err.message != null ? err.message : i18n.__('An error occurred!')
        }
      })
    }
    ipc.addListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.addListener('APP_SETTING_ERROR', this.handleSettingError)
  }

  componentWillUnmount() {
    ipc.removeListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.removeListener('APP_SETTING_ERROR', this.handleSettingError)
  }

  handleUIChange(e) {
    const { codemirrorTheme } = this.state
    let checkHighLight = document.getElementById('checkHighLight')

    if (checkHighLight === null) {
      checkHighLight = document.createElement('link')
      checkHighLight.setAttribute('id', 'checkHighLight')
      checkHighLight.setAttribute('rel', 'stylesheet')
      document.head.appendChild(checkHighLight)
    }

    const newConfig = {
      ui: {
        theme: this.refs.uiTheme.value,
        defaultTheme: this.refs.uiTheme.value,
        enableScheduleTheme: this.refs.enableScheduleTheme.checked,
        scheduledTheme: this.refs.uiScheduledTheme.value,
        scheduleStart: this.refs.scheduleStart.value,
        scheduleEnd: this.refs.scheduleEnd.value,
        language: this.refs.uiLanguage.value,
        defaultNote: this.refs.defaultNote.value,
        tagNewNoteWithFilteringTags: this.refs.tagNewNoteWithFilteringTags
          .checked,
        showCopyNotification: this.refs.showCopyNotification.checked,
        confirmDeletion: this.refs.confirmDeletion.checked,
        showOnlyRelatedTags: this.refs.showOnlyRelatedTags.checked,
        showTagsAlphabetically: this.refs.showTagsAlphabetically.checked,
        saveTagsAlphabetically: this.refs.saveTagsAlphabetically.checked,
        enableLiveNoteCounts: this.refs.enableLiveNoteCounts.checked,
        showScrollBar: this.refs.showScrollBar.checked,
        showMenuBar: this.refs.showMenuBar.checked,
        disableDirectWrite:
          this.refs.uiD2w != null ? this.refs.uiD2w.checked : false
      },
      editor: {
        theme: this.refs.editorTheme.value,
        fontSize: this.refs.editorFontSize.value,
        fontFamily: this.refs.editorFontFamily.value,
        indentType: this.refs.editorIndentType.value,
        indentSize: this.refs.editorIndentSize.value,
        enableRulers: this.refs.enableEditorRulers.value === 'true',
        rulers: this.refs.editorRulers.value.replace(/[^0-9,]/g, '').split(','),
        displayLineNumbers: this.refs.editorDisplayLineNumbers.checked,
        lineWrapping: this.refs.editorLineWrapping.checked,
        switchPreview: this.refs.editorSwitchPreview.value,
        keyMap: this.refs.editorKeyMap.value,
        snippetDefaultLanguage: this.refs.editorSnippetDefaultLanguage.value,
        scrollPastEnd: this.refs.scrollPastEnd.checked,
        fetchUrlTitle: this.refs.editorFetchUrlTitle.checked,
        enableTableEditor: this.refs.enableTableEditor.checked,
        enableFrontMatterTitle: this.refs.enableFrontMatterTitle.checked,
        frontMatterTitleField: this.refs.frontMatterTitleField.value,
        matchingPairs: this.refs.matchingPairs.value,
        matchingTriples: this.refs.matchingTriples.value,
        explodingPairs: this.refs.explodingPairs.value,
        spellcheck: this.refs.spellcheck.checked,
        enableSmartPaste: this.refs.enableSmartPaste.checked,
        enableMarkdownLint: this.refs.enableMarkdownLint.checked,
        customMarkdownLintConfig: this.customMarkdownLintConfigCM
          .getCodeMirror()
          .getValue(),
        prettierConfig: this.prettierConfigCM.getCodeMirror().getValue(),
        deleteUnusedAttachments: this.refs.deleteUnusedAttachments.checked,
        rtlEnabled: this.refs.rtlEnabled.checked
      },
      preview: {
        fontSize: this.refs.previewFontSize.value,
        fontFamily: this.refs.previewFontFamily.value,
        codeBlockTheme: this.refs.previewCodeBlockTheme.value,
        lineNumber: this.refs.previewLineNumber.checked,
        latexInlineOpen: this.refs.previewLatexInlineOpen.value,
        latexInlineClose: this.refs.previewLatexInlineClose.value,
        latexBlockOpen: this.refs.previewLatexBlockOpen.value,
        latexBlockClose: this.refs.previewLatexBlockClose.value,
        plantUMLServerAddress: this.refs.previewPlantUMLServerAddress.value,
        scrollPastEnd: this.refs.previewScrollPastEnd.checked,
        scrollSync: this.refs.previewScrollSync.checked,
        smartQuotes: this.refs.previewSmartQuotes.checked,
        breaks: this.refs.previewBreaks.checked,
        smartArrows: this.refs.previewSmartArrows.checked,
        sanitize: this.refs.previewSanitize.value,
        mermaidHTMLLabel: this.refs.previewMermaidHTMLLabel.checked,
        allowCustomCSS: this.refs.previewAllowCustomCSS.checked,
        lineThroughCheckbox: this.refs.lineThroughCheckbox.checked,
        customCSS: this.customCSSCM.getCodeMirror().getValue()
      }
    }

    const newCodemirrorTheme = this.refs.editorTheme.value

    if (newCodemirrorTheme !== codemirrorTheme) {
      const theme = consts.THEMES.find(
        theme => theme.name === newCodemirrorTheme
      )

      if (theme) {
        checkHighLight.setAttribute('href', theme.path)
      }
    }

    this.setState(
      { config: newConfig, codemirrorTheme: newCodemirrorTheme },
      () => {
        const { ui, editor, preview } = this.props.config
        this.currentConfig = { ui, editor, preview }
        if (_.isEqual(this.currentConfig, this.state.config)) {
          this.props.haveToSave()
        } else {
          this.props.haveToSave({
            tab: 'UI',
            type: 'warning',
            message: i18n.__('Unsaved Changes!')
          })
        }
      }
    )
  }

  handleSaveUIClick(e) {
    const newConfig = {
      ui: this.state.config.ui,
      editor: this.state.config.editor,
      preview: this.state.config.preview
    }

    chooseTheme(newConfig)
    applyTheme(newConfig.ui.theme)

    ConfigManager.set(newConfig)

    store.dispatch({
      type: 'SET_UI',
      config: newConfig
    })
    this.clearMessage()
    this.props.haveToSave()
  }

  clearMessage() {
    _.debounce(() => {
      this.setState({
        UiAlert: null
      })
    }, 2000)()
  }

  formatTime(time) {
    let hour = Math.floor(time / 60)
    let minute = time % 60

    if (hour < 10) {
      hour = '0' + hour
    }

    if (minute < 10) {
      minute = '0' + minute
    }

    return `${hour}:${minute}`
  }

  render() {
    const UiAlert = this.state.UiAlert
    const UiAlertElement =
      UiAlert != null ? (
        <p className={`alert ${UiAlert.type}`}>{UiAlert.message}</p>
      ) : null

    const themes = consts.THEMES
    const { config, codemirrorTheme } = this.state
    const codemirrorSampleCode =
      'function iamHappy (happy) {\n\tif (happy) {\n\t  console.log("I am Happy!")\n\t} else {\n\t  console.log("I am not Happy!")\n\t}\n};'
    const enableEditRulersStyle = config.editor.enableRulers ? 'block' : 'none'
    const fontFamily = normalizeEditorFontFamily(config.editor.fontFamily)
    return (
      <div styleName='root'>
        <div styleName='group'>
          <div styleName='group-header'>{i18n.__('Interface')}</div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Interface Theme')}
            </div>
            <div styleName='group-section-control'>
              <select
                value={config.ui.defaultTheme}
                onChange={e => this.handleUIChange(e)}
                ref='uiTheme'
              >
                <optgroup label='Light Themes'>
                  {uiThemes
                    .filter(theme => !theme.isDark)
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map(theme => {
                      return (
                        <option value={theme.name} key={theme.name}>
                          {theme.label}
                        </option>
                      )
                    })}
                </optgroup>
                <optgroup label='Dark Themes'>
                  {uiThemes
                    .filter(theme => theme.isDark)
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map(theme => {
                      return (
                        <option value={theme.name} key={theme.name}>
                          {theme.label}
                        </option>
                      )
                    })}
                </optgroup>
              </select>
            </div>
          </div>
          <div styleName='group-header2'>{i18n.__('Theme Schedule')}</div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={config.ui.enableScheduleTheme}
                ref='enableScheduleTheme'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Enable Scheduled Themes')}
            </label>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Scheduled Theme')}
            </div>
            <div styleName='group-section-control'>
              <select
                disabled={!config.ui.enableScheduleTheme}
                value={config.ui.scheduledTheme}
                onChange={e => this.handleUIChange(e)}
                ref='uiScheduledTheme'
              >
                <optgroup label='Light Themes'>
                  {uiThemes
                    .filter(theme => !theme.isDark)
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map(theme => {
                      return (
                        <option value={theme.name} key={theme.name}>
                          {theme.label}
                        </option>
                      )
                    })}
                </optgroup>
                <optgroup label='Dark Themes'>
                  {uiThemes
                    .filter(theme => theme.isDark)
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map(theme => {
                      return (
                        <option value={theme.name} key={theme.name}>
                          {theme.label}
                        </option>
                      )
                    })}
                </optgroup>
              </select>
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='container'>
              <div id='firstRow'>
                <span
                  id='rs-bullet-1'
                  styleName='rs-label'
                >{`End: ${this.formatTime(config.ui.scheduleEnd)}`}</span>
                <input
                  disabled={!config.ui.enableScheduleTheme}
                  id='rs-range-line-1'
                  styleName='rs-range'
                  type='range'
                  value={config.ui.scheduleEnd}
                  min='0'
                  max='1440'
                  step='5'
                  ref='scheduleEnd'
                  onChange={e => this.handleUIChange(e)}
                />
              </div>
              <div id='secondRow'>
                <span
                  id='rs-bullet-2'
                  styleName='rs-label'
                >{`Start: ${this.formatTime(config.ui.scheduleStart)}`}</span>
                <input
                  disabled={!config.ui.enableScheduleTheme}
                  id='rs-range-line-2'
                  styleName='rs-range'
                  type='range'
                  value={config.ui.scheduleStart}
                  min='0'
                  max='1440'
                  step='5'
                  ref='scheduleStart'
                  onChange={e => this.handleUIChange(e)}
                />
              </div>
              <div styleName='box-minmax'>
                <span>00:00</span>
                <span>24:00</span>
              </div>
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>{i18n.__('Language')}</div>
            <div styleName='group-section-control'>
              <select
                value={config.ui.language}
                onChange={e => this.handleUIChange(e)}
                ref='uiLanguage'
              >
                {getLanguages().map(language => (
                  <option value={language.locale} key={language.locale}>
                    {i18n.__(language.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Default New Note')}
            </div>
            <div styleName='group-section-control'>
              <select
                value={config.ui.defaultNote}
                onChange={e => this.handleUIChange(e)}
                ref='defaultNote'
              >
                <option value='ALWAYS_ASK'>{i18n.__('Always Ask')}</option>
                <option value='MARKDOWN_NOTE'>
                  {i18n.__('Markdown Note')}
                </option>
                <option value='SNIPPET_NOTE'>{i18n.__('Snippet Note')}</option>
              </select>
            </div>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.ui.showMenuBar}
                ref='showMenuBar'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Show menu bar')}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.ui.showCopyNotification}
                ref='showCopyNotification'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Show "Saved to Clipboard" notification when copying')}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.ui.confirmDeletion}
                ref='confirmDeletion'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Show a confirmation dialog when deleting notes')}
            </label>
          </div>
          {global.process.platform === 'win32' ? (
            <div styleName='group-checkBoxSection'>
              <label>
                <input
                  onChange={e => this.handleUIChange(e)}
                  checked={this.state.config.ui.disableDirectWrite}
                  refs='uiD2w'
                  disabled={OSX}
                  type='checkbox'
                />
                &nbsp;
                {i18n.__(
                  'Disable Direct Write (It will be applied after restarting)'
                )}
              </label>
            </div>
          ) : null}
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.ui.showScrollBar}
                ref='showScrollBar'
                type='checkbox'
              />
              &nbsp;
              {i18n.__(
                'Show the scroll bars in the editor and in the markdown preview (It will be applied after restarting)'
              )}
            </label>
          </div>
          <div styleName='group-header2'>Tags</div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.ui.saveTagsAlphabetically}
                ref='saveTagsAlphabetically'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Save tags of a note in alphabetical order')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.ui.showTagsAlphabetically}
                ref='showTagsAlphabetically'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Show tags of a note in alphabetical order')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.ui.showOnlyRelatedTags}
                ref='showOnlyRelatedTags'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Show only related tags')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.ui.enableLiveNoteCounts}
                ref='enableLiveNoteCounts'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Enable live count of notes')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.ui.tagNewNoteWithFilteringTags}
                ref='tagNewNoteWithFilteringTags'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('New notes are tagged with the filtering tags')}
            </label>
          </div>

          <div styleName='group-header2'>Editor</div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>{i18n.__('Editor Theme')}</div>
            <div styleName='group-section-control'>
              <select
                value={config.editor.theme}
                ref='editorTheme'
                onChange={e => this.handleUIChange(e)}
              >
                {themes.map(theme => {
                  return (
                    <option value={theme.name} key={theme.name}>
                      {theme.name}
                    </option>
                  )
                })}
              </select>
              <div styleName='code-mirror' style={{ fontFamily }}>
                <ReactCodeMirror
                  ref={e => (this.codeMirrorInstance = e)}
                  value={codemirrorSampleCode}
                  options={{
                    lineNumbers: true,
                    readOnly: true,
                    mode: 'javascript',
                    theme: codemirrorTheme
                  }}
                />
              </div>
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Editor Font Size')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                ref='editorFontSize'
                value={config.editor.fontSize}
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Editor Font Family')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                ref='editorFontFamily'
                value={config.editor.fontFamily}
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Editor Indent Style')}
            </div>
            <div styleName='group-section-control'>
              <select
                value={config.editor.indentSize}
                ref='editorIndentSize'
                onChange={e => this.handleUIChange(e)}
              >
                <option value='1'>1</option>
                <option value='2'>2</option>
                <option value='4'>4</option>
                <option value='8'>8</option>
              </select>
              &nbsp;
              <select
                value={config.editor.indentType}
                ref='editorIndentType'
                onChange={e => this.handleUIChange(e)}
              >
                <option value='space'>{i18n.__('Spaces')}</option>
                <option value='tab'>{i18n.__('Tabs')}</option>
              </select>
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Editor Rulers')}
            </div>
            <div styleName='group-section-control'>
              <div>
                <select
                  value={config.editor.enableRulers}
                  ref='enableEditorRulers'
                  onChange={e => this.handleUIChange(e)}
                >
                  <option value='true'>{i18n.__('Enable')}</option>
                  <option value='false'>{i18n.__('Disable')}</option>
                </select>
              </div>
              <input
                styleName='group-section-control-input'
                style={{ display: enableEditRulersStyle }}
                ref='editorRulers'
                value={config.editor.rulers}
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Switch to Preview')}
            </div>
            <div styleName='group-section-control'>
              <select
                value={config.editor.switchPreview}
                ref='editorSwitchPreview'
                onChange={e => this.handleUIChange(e)}
              >
                <option value='BLUR'>{i18n.__('When Editor Blurred')}</option>
                <option value='DBL_CLICK'>
                  {i18n.__('When Editor Blurred, Edit On Double Click')}
                </option>
                <option value='RIGHTCLICK'>{i18n.__('On Right Click')}</option>
              </select>
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Editor Keymap')}
            </div>
            <div styleName='group-section-control'>
              <select
                value={config.editor.keyMap}
                ref='editorKeyMap'
                onChange={e => this.handleUIChange(e)}
              >
                <option value='sublime'>{i18n.__('default')}</option>
                <option value='vim'>{i18n.__('vim')}</option>
                <option value='emacs'>{i18n.__('emacs')}</option>
              </select>
              <p styleName='note-for-keymap'>
                {i18n.__(
                  '⚠️ Please restart boostnote after you change the keymap'
                )}
              </p>
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Snippet Default Language')}
            </div>
            <div styleName='group-section-control'>
              <select
                value={config.editor.snippetDefaultLanguage}
                ref='editorSnippetDefaultLanguage'
                onChange={e => this.handleUIChange(e)}
              >
                <option key='Auto Detect' value='Auto Detect'>
                  {i18n.__('Auto Detect')}
                </option>
                {_.sortBy(CodeMirror.modeInfo.map(mode => mode.name)).map(
                  name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Front matter title field')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                ref='frontMatterTitleField'
                value={config.editor.frontMatterTitleField}
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.editor.enableFrontMatterTitle}
                ref='enableFrontMatterTitle'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Extract title from front matter')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.editor.displayLineNumbers}
                ref='editorDisplayLineNumbers'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Show line numbers in the editor')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.editor.lineWrapping}
                ref='editorLineWrapping'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Wrap line in Snippet Note')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.editor.scrollPastEnd}
                ref='scrollPastEnd'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Allow editor to scroll past the last line')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.editor.fetchUrlTitle}
                ref='editorFetchUrlTitle'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Bring in web page title when pasting URL on editor')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.editor.enableTableEditor}
                ref='enableTableEditor'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Enable smart table editor')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.editor.enableSmartPaste}
                ref='enableSmartPaste'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Enable HTML paste')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.editor.spellcheck}
                ref='spellcheck'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Enable spellcheck - Experimental feature!! :)')}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.editor.deleteUnusedAttachments}
                ref='deleteUnusedAttachments'
                type='checkbox'
              />
              &nbsp;
              {i18n.__(
                'Delete attachments, that are not referenced in the text anymore'
              )}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.editor.rtlEnabled}
                ref='rtlEnabled'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Enable right to left direction(RTL)')}
            </label>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Matching character pairs')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                value={this.state.config.editor.matchingPairs}
                ref='matchingPairs'
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Matching character triples')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                value={this.state.config.editor.matchingTriples}
                ref='matchingTriples'
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Exploding character pairs')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                value={this.state.config.editor.explodingPairs}
                ref='explodingPairs'
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Custom MarkdownLint Rules')}
            </div>
            <div styleName='group-section-control'>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.editor.enableMarkdownLint}
                ref='enableMarkdownLint'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Enable MarkdownLint')}
              <div
                style={{
                  fontFamily,
                  display: this.state.config.editor.enableMarkdownLint
                    ? 'block'
                    : 'none'
                }}
              >
                <ReactCodeMirror
                  width='400px'
                  height='200px'
                  onChange={e => this.handleUIChange(e)}
                  ref={e => (this.customMarkdownLintConfigCM = e)}
                  value={config.editor.customMarkdownLintConfig}
                  options={{
                    lineNumbers: true,
                    mode: 'application/json',
                    theme: codemirrorTheme,
                    lint: true,
                    gutters: [
                      'CodeMirror-linenumbers',
                      'CodeMirror-foldgutter',
                      'CodeMirror-lint-markers'
                    ]
                  }}
                />
              </div>
            </div>
          </div>

          <div styleName='group-header2'>{i18n.__('Preview')}</div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Preview Font Size')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                value={config.preview.fontSize}
                ref='previewFontSize'
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Preview Font Family')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                ref='previewFontFamily'
                value={config.preview.fontFamily}
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Code Block Theme')}
            </div>
            <div styleName='group-section-control'>
              <select
                value={config.preview.codeBlockTheme}
                ref='previewCodeBlockTheme'
                onChange={e => this.handleUIChange(e)}
              >
                {themes.map(theme => {
                  return (
                    <option value={theme.name} key={theme.name}>
                      {theme.name}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.preview.lineThroughCheckbox}
                ref='lineThroughCheckbox'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Allow line through checkbox')}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.preview.scrollPastEnd}
                ref='previewScrollPastEnd'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Allow preview to scroll past the last line')}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.preview.scrollSync}
                ref='previewScrollSync'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('When scrolling, synchronize preview with editor')}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.preview.lineNumber}
                ref='previewLineNumber'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Show line numbers for preview code blocks')}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.preview.smartQuotes}
                ref='previewSmartQuotes'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Enable smart quotes')}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.preview.breaks}
                ref='previewBreaks'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Render newlines in Markdown paragraphs as <br>')}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.preview.smartArrows}
                ref='previewSmartArrows'
                type='checkbox'
              />
              &nbsp;
              {i18n.__(
                'Convert textual arrows to beautiful signs. ⚠ This will interfere with using HTML comments in your Markdown.'
              )}
            </label>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>{i18n.__('Sanitization')}</div>
            <div styleName='group-section-control'>
              <select
                value={config.preview.sanitize}
                ref='previewSanitize'
                onChange={e => this.handleUIChange(e)}
              >
                <option value='STRICT'>
                  ✅ {i18n.__('Only allow secure html tags (recommended)')}
                </option>
                <option value='ALLOW_STYLES'>
                  ⚠️ {i18n.__('Allow styles')}
                </option>
                <option value='NONE'>
                  ❌ {i18n.__('Allow dangerous html tags')}
                </option>
              </select>
            </div>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={this.state.config.preview.mermaidHTMLLabel}
                ref='previewMermaidHTMLLabel'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Enable HTML label in mermaid flowcharts')}
            </label>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('LaTeX Inline Open Delimiter')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                ref='previewLatexInlineOpen'
                value={config.preview.latexInlineOpen}
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('LaTeX Inline Close Delimiter')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                ref='previewLatexInlineClose'
                value={config.preview.latexInlineClose}
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('LaTeX Block Open Delimiter')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                ref='previewLatexBlockOpen'
                value={config.preview.latexBlockOpen}
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('LaTeX Block Close Delimiter')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                ref='previewLatexBlockClose'
                value={config.preview.latexBlockClose}
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('PlantUML Server')}
            </div>
            <div styleName='group-section-control'>
              <input
                styleName='group-section-control-input'
                ref='previewPlantUMLServerAddress'
                value={config.preview.plantUMLServerAddress}
                onChange={e => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>{i18n.__('Custom CSS')}</div>
            <div styleName='group-section-control'>
              <input
                onChange={e => this.handleUIChange(e)}
                checked={config.preview.allowCustomCSS}
                ref='previewAllowCustomCSS'
                type='checkbox'
              />
              &nbsp;
              {i18n.__('Allow custom CSS for preview')}
              <div style={{ fontFamily }}>
                <ReactCodeMirror
                  width='400px'
                  height='400px'
                  onChange={e => this.handleUIChange(e)}
                  ref={e => (this.customCSSCM = e)}
                  value={config.preview.customCSS}
                  options={{
                    lineNumbers: true,
                    mode: 'css',
                    theme: codemirrorTheme
                  }}
                />
              </div>
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Prettier Config')}
            </div>
            <div styleName='group-section-control'>
              <div style={{ fontFamily }}>
                <ReactCodeMirror
                  width='400px'
                  height='400px'
                  onChange={e => this.handleUIChange(e)}
                  ref={e => (this.prettierConfigCM = e)}
                  value={config.editor.prettierConfig}
                  options={{
                    lineNumbers: true,
                    mode: 'application/json',
                    lint: true,
                    theme: codemirrorTheme
                  }}
                />
              </div>
            </div>
          </div>
          <div styleName='group-control'>
            <button
              styleName='group-control-rightButton'
              onClick={e => this.handleSaveUIClick(e)}
            >
              {i18n.__('Save')}
            </button>
            {UiAlertElement}
          </div>
        </div>
      </div>
    )
  }
}

UiTab.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string
  }),
  dispatch: PropTypes.func,
  haveToSave: PropTypes.func
}

export default CSSModules(UiTab, styles)
