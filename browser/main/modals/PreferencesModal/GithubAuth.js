import React from 'react'

/**
* @fileoverview Component for signing into github
*/

class GithubAuth extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      config: props.config
    }
  }

  renderControlSection () {}

  render (h) {
    return (
      <div className='login-modal'>
        Login Modal
      </div>
    )
  }
}

export default GithubAuth
