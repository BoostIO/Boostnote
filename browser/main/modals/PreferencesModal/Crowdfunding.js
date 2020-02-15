import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './Crowdfunding.styl'
import i18n from 'browser/lib/i18n'

const electron = require('electron')
const { shell } = electron

class Crowdfunding extends React.Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  handleLinkClick(e) {
    shell.openExternal(e.currentTarget.href)
    e.preventDefault()
  }

  render() {
    return (
      <div styleName='root'>
        <div styleName='group-header'>{i18n.__('Crowdfunding')}</div>
        <p>{i18n.__('Thank you for using Boostnote!')}</p>
        <br />
        <p>
          {i18n.__(
            'We launched IssueHunt which is an issue-based crowdfunding / sourcing platform for open source projects.'
          )}
        </p>
        <p>
          {i18n.__(
            'Anyone can put a bounty on not only a bug but also on OSS feature requests listed on IssueHunt. Collected funds will be distributed to project owners and contributors.'
          )}
        </p>
        <div styleName='group-header2--sub'>
          {i18n.__('Sustainable Open Source Ecosystem')}
        </div>
        <p>
          {i18n.__(
            'We discussed about open-source ecosystem and IssueHunt concept with the Boostnote team repeatedly. We actually also discussed with Matz who father of Ruby.'
          )}
        </p>
        <p>
          {i18n.__(
            'The original reason why we made IssueHunt was to reward our contributors of Boostnote project. We’ve got tons of Github stars and hundred of contributors in two years.'
          )}
        </p>
        <p>
          {i18n.__(
            'We thought that it will be nice if we can pay reward for our contributors.'
          )}
        </p>
        <div styleName='group-header2--sub'>
          {i18n.__('We believe Meritocracy')}
        </div>
        <p>
          {i18n.__(
            'We think developers who have skills and do great things must be rewarded properly.'
          )}
        </p>
        <p>
          {i18n.__(
            'OSS projects are used in everywhere on the internet, but no matter how they great, most of owners of those projects need to have another job to sustain their living.'
          )}
        </p>
        <p>{i18n.__('It sometimes looks like exploitation.')}</p>
        <p>
          {i18n.__(
            'We’ve realized IssueHunt could enhance sustainability of open-source ecosystem.'
          )}
        </p>
        <br />
        <p>
          {i18n.__(
            'As same as issues of Boostnote are already funded on IssueHunt, your open-source projects can be also started funding from now.'
          )}
        </p>
        <br />
        <p>{i18n.__('Thank you,')}</p>
        <p>{i18n.__('The Boostnote Team')}</p>
        <br />
        <button styleName='cf-link'>
          <a
            href='http://bit.ly/issuehunt-from-boostnote-app'
            onClick={e => this.handleLinkClick(e)}
          >
            {i18n.__('See IssueHunt')}
          </a>
        </button>
      </div>
    )
  }
}

Crowdfunding.propTypes = {}

export default CSSModules(Crowdfunding, styles)
