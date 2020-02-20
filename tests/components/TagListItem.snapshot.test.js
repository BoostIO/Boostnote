import React from 'react'
import renderer from 'react-test-renderer'
import TagListItem from 'browser/components/TagListItem'

it('TagListItem renders correctly', () => {
  const tagListItem = renderer.create(
    <TagListItem name='Test' handleClickTagListItem={jest.fn()} color='#000' />
  )

  expect(tagListItem.toJSON()).toMatchSnapshot()
})
