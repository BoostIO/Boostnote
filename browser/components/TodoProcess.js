/**
 * @fileoverview Percentage of todo achievement.
 */

import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './TodoProcess.styl'

const TodoProcess = ({
  todoStatus: { total: totalTodo, completed: completedTodo }
}) => (
  <div
    styleName='todo-process'
    style={{ display: totalTodo > 0 ? '' : 'none' }}
  >
    <div styleName='todo-process-text'>
      <i className='fa fa-fw fa-check-square-o' />
      {completedTodo} of {totalTodo}
    </div>
    <div styleName='todo-process-bar'>
      <div
        styleName='todo-process-bar--inner'
        style={{ width: parseInt((completedTodo / totalTodo) * 100) + '%' }}
      />
    </div>
  </div>
)

TodoProcess.propTypes = {
  todoStatus: PropTypes.exact({
    total: PropTypes.number.isRequired,
    completed: PropTypes.number.isRequired
  })
}

export default CSSModules(TodoProcess, styles)
