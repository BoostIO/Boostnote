import { isMarkdownTitleURL } from '../../browser/lib/utils'

describe('isMarkdownTitleURL', () => {
  it('returns true for valid Markdown title with url', () => {
    expect(isMarkdownTitleURL('# https://validurl.com')).toBe(true)
    expect(isMarkdownTitleURL('## https://validurl.com')).toBe(true)
    expect(isMarkdownTitleURL('###### https://validurl.com')).toBe(true)
  })

  it('returns true for invalid Markdown title with url', () => {
    expect(isMarkdownTitleURL('1 https://validurl.com')).toBe(false)
    expect(isMarkdownTitleURL('24 https://validurl.com')).toBe(false)
    expect(isMarkdownTitleURL('####### https://validurl.com')).toBe(false)
  })
})
