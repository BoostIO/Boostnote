import test from 'ava'
import Markdown from 'browser/lib/markdown'
import markdownFixtures from '../fixtures/markdowns'

// basic markdown instance which meant to be used in every test cases.
// To test markdown options, initialize a new instance in your test case
const md = new Markdown()

test('Markdown.render() should renders markdown correctly', t => {
  const rendered = md.render(markdownFixtures.basic)
  t.snapshot(rendered)
})

test('Markdown.render() should renders codeblock correctly', t => {
  const rendered = md.render(markdownFixtures.codeblock)
  t.snapshot(rendered)
})

test('Markdown.render() should renders KaTeX correctly', t => {
  const rendered = md.render(markdownFixtures.katex)
  t.snapshot(rendered)
})

test('Markdown.render() should renders checkboxes', t => {
  const rendered = md.render(markdownFixtures.checkboxes)
  t.snapshot(rendered)
})

test('Markdown.render() should text with quotes correctly', t => {
  const renderedSmartQuotes = md.render(markdownFixtures.smartQuotes)
  t.snapshot(renderedSmartQuotes)

  const newmd = new Markdown({ typographer: false })
  const renderedNonSmartQuotes = newmd.render(markdownFixtures.smartQuotes)
  t.snapshot(renderedNonSmartQuotes)
})

test('Markdown.render() should render line breaks correctly', t => {
  const renderedBreaks = md.render(markdownFixtures.breaks)
  t.snapshot(renderedBreaks)

  const newmd = new Markdown({ breaks: false })
  const renderedNonBreaks = newmd.render(markdownFixtures.breaks)
  t.snapshot(renderedNonBreaks)
})

test('Markdown.render() should renders abbrevations correctly', t => {
  const rendered = md.render(markdownFixtures.abbrevations)
  t.snapshot(rendered)
})

test('Markdown.render() should renders sub correctly', t => {
  const rendered = md.render(markdownFixtures.subTexts)
  t.snapshot(rendered)
})

test('Markdown.render() should renders sup correctly', t => {
  const rendered = md.render(markdownFixtures.supTexts)
  t.snapshot(rendered)
})

test('Markdown.render() should renders definition lists correctly', t => {
  const rendered = md.render(markdownFixtures.deflists)
  t.snapshot(rendered)
})

test('Markdown.render() should render shortcuts correctly', t => {
  const rendered = md.render(markdownFixtures.shortcuts)
  t.snapshot(rendered)
})

test('Markdown.render() should render footnote correctly', t => {
  const rendered = md.render(markdownFixtures.footnote)
  t.snapshot(rendered)
})

test('Markdown.render() should render PlantUML MindMaps correctly', t => {
  const rendered = md.render(markdownFixtures.plantUmlMindMap)
  t.snapshot(rendered)
})

test('Markdown.render() should render PlantUML Gantt correctly', t => {
  const rendered = md.render(markdownFixtures.plantUmlGantt)
  t.snapshot(rendered)
})

test('Markdown.render() should render PlantUML WBS correctly', t => {
  const rendered = md.render(markdownFixtures.plantUmlWbs)
  t.snapshot(rendered)
})

test('Markdown.render() should render PlantUML Umls correctly', t => {
  const rendered = md.render(markdownFixtures.plantUmlUml)
  t.snapshot(rendered)
})
