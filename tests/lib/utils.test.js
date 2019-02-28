import test from 'ava'
import { isMarkdownTitleURL } from '../../browser/lib/utils'

test('isMarkdownTitleURL returns true for valid Markdown title with url', (t) => {
  t.true(isMarkdownTitleURL('# https://validurl.com'))
  t.true(isMarkdownTitleURL('## https://validurl.com'))
  t.true(isMarkdownTitleURL('###### https://validurl.com'))
})

test('isMarkdownTitleURL returns true for invalid Markdown title with url', (t) => {
  t.false(isMarkdownTitleURL('1 https://validurl.com'))
  t.false(isMarkdownTitleURL('24 https://validurl.com'))
  t.false(isMarkdownTitleURL('####### https://validurl.com'))
})
