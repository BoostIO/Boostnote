import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import PropTypes from 'prop-types'
import moment from 'moment'
import styles from './DayPicker.styl'

class DayPicker extends React.Component {
  constructor (props) {
    super(props)
    const date = moment()
    this.state = {
      active: date,
      keyPrefix: date.format('YYYY.MM')
    }
    this.renderDay = this.renderDay.bind(this)
  }

  getDays (month) {
    const days = []
    const daysInMonth = month.daysInMonth()
    const offset = month.date(0).day() + 1
    if (offset < 7) {
      for (let i = 0; i < offset; i++) {
        days.push(null)
      }
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    const padding = 7 - (days.length % 7)
    for (let i = 0; i <= padding; i++) {
      days.push(null)
    }
    return days
  }

  getWeeks (days) {
    const weeks = []
    const weekCount = Math.ceil(days.length / 7)
    for (let i = 0; i < weekCount; i++) {
      weeks.push(days.slice(i * 7, (i + 1) * 7))
    }
    return weeks
  }

  getMonth () {
    return this.state.active.clone()
  }

  handlePreviousMonth () {
    const active = this.state.active.subtract(1, 'month')
    this.setState({
      active,
      keyPrefix: active.format('YYYY.MM')
    })
  }
  handleNextMonth () {
    const active = this.state.active.add(1, 'month')
    this.setState({
      active,
      keyPrefix: active.format('YYYY.MM')
    })
  }

  handleDayClick (event) {
    const dayOfMonth = event.nativeEvent.target.innerText
    const active = this.state.active.date(dayOfMonth)

    this.setState({ active })
    this.props.onDayClick(active)
  }

  renderDay (day, index, isToday, isActive) {
    const { keyPrefix } = this.state
    const mystyle = 'calendar-day' + (day
    ? (isToday
        ? '--today'
        : (isActive ? '--active' : ''))
    : '--empty')
    return (
      <div styleName={mystyle}
        key={`${keyPrefix}.day.${index}`}
        onClick={(e) => { this.handleDayClick(e) }}
      >{day || ''}</div>
    )
  }

  renderBody (days) {
    const { active } = this.state
    const today = moment()

    const isActive = days.map((d) => { return d && active.date() === d })
    const isToday = days.map((d) => {
      const day = moment(active)
      day.date(d)
      return day && today.year() === day.year() && today.month() === day.month() && today.date() === day.date()
    })
    const dayElements = days.map((d, i) => {
      return (this.renderDay(d, i, isToday[i], isActive[i]))
    })
    return (
      <div styleName='calendar-body'>
        {dayElements}
      </div>
    )
  }

  renderControl () {
    return (
      <div styleName='calendar-control'>
        <div styleName='previous-month' onClick={() => { this.handlePreviousMonth() }}>◀</div>
        <div styleName='month-year'>{this.state.active.format('MMMM YYYY')}</div>
        <div styleName='next-month' onClick={() => { this.handleNextMonth() }}>▶</div>
      </div>
    )
  }
  renderHeader () {
    const titles = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const children = labels.map((l, i) => {
      return (<div key={i} title={titles[i]} styleName='calendar-header-weekday'>{l}</div>)
    })
    return (
      <div styleName='calendar-header'>
        {children}
      </div>
    )
  }
  render () {
    const month = this.getMonth()
    const days = this.getDays(month)
    const body = this.renderBody(days)
    return (
      <div className='DayPicker' styleName='root'>
        {this.renderControl()}
        {this.renderHeader()}
        {body}
      </div>
    )
  }
}

DayPicker.propTypes = {
  onDayClick: PropTypes.func.isRequired
}
export default CSSModules(DayPicker, styles)
