const basic = `
# Welcome to Boostnote!
## Click here to edit markdown :wave:

<iframe width="560" height="315" src="https://www.youtube.com/embed/L0qNPLsvmyM" frameborder="0" allowfullscreen></iframe>

## Docs :memo:
- [Boostnote | Boost your happiness, productivity and creativity.](https://hackernoon.com/boostnote-boost-your-happiness-productivity-and-creativity-315034efeebe)
- [Cloud Syncing & Backups](https://github.com/BoostIO/Boostnote/wiki/Cloud-Syncing-and-Backup)
- [How to sync your data across Desktop and Mobile apps](https://github.com/BoostIO/Boostnote/wiki/Sync-Data-Across-Desktop-and-Mobile-apps)
- [Convert data from **Evernote** to Boostnote.](https://github.com/BoostIO/Boostnote/wiki/Evernote)
- [Keyboard Shortcuts](https://github.com/BoostIO/Boostnote/wiki/Keyboard-Shortcuts)
- [Keymaps in Editor mode](https://github.com/BoostIO/Boostnote/wiki/Keymaps-in-Editor-mode)
- [How to set syntax highlight in Snippet note](https://github.com/BoostIO/Boostnote/wiki/Syntax-Highlighting)

---

## Article Archive :books:
- [Reddit English](http://bit.ly/2mOJPu7)
- [Reddit Spanish](https://www.reddit.com/r/boostnote_es/)
- [Reddit Chinese](https://www.reddit.com/r/boostnote_cn/)
- [Reddit Japanese](https://www.reddit.com/r/boostnote_jp/)

---

## Community :beers:
- [GitHub](http://bit.ly/2AWWzkD)
- [Twitter](http://bit.ly/2z8BUJZ)
- [Facebook Group](http://bit.ly/2jcca8t)
`

const codeblock = `
\`\`\`js:filename.js:2
var project = 'boostnote';
\`\`\`
`

const katex = `
$$
c = \pm\sqrt{a^2 + b^2}
$$
`

const checkboxes = `
- [ ] Unchecked
- [x] Checked
`

const smartQuotes = 'This is a "QUOTE".'

const breaks = 'This is the first line.\nThis is the second line.'

const abbrevations = `
## abbr

The HTML specification
is maintained by the W3C.

*[HTML]: Hyper Text Markup Language
*[W3C]:  World Wide Web Consortium
`

const subTexts = `
## sub

H~2~0
`

const supTexts = `
## sup

29^th^
`

const deflists = `
## definition list

### list 1

Term 1
  ~ Definition 1

Term 2
  ~ Definition 2a
  ~ Definition 2b

Term 3
~


### list 2

Term 1

:   Definition 1

Term 2 with *inline markup*

:   Definition 2

        { some code, part of Definition 2 }

    Third paragraph of definition 2.
`
const shortcuts = '<kbd>Ctrl</kbd>\n\n[[Ctrl]]'

const footnote = `
^[hello-world]
hello-world: https://github.com/BoostIO/Boostnote/
`

const tocPlaceholder = `
[TOC]
# H1
## H2
### H3
###$ H4
`

const plantUmlMindMap = `
@startmindmap
* Debian
** Ubuntu
*** Linux Mint
*** Kubuntu
*** Lubuntu
*** KDE Neon
** LMDE
** SolydXK
** SteamOS
** Raspbian with a very long name
*** <s>Raspmbc</s> => OSMC
*** <s>Raspyfi</s> => Volumio
@endmindmap
`

const plantUmlGantt = `
@startgantt
[Prototype design] lasts 15 days
[Test prototype] lasts 10 days
[Test prototype] starts at [Prototype design]'s end
@endgantt
`

const plantUmlWbs = `
@startwbs
* Business Process Modelling WBS
** Launch the project
*** Complete Stakeholder Research
*** Initial Implementation Plan
** Design phase
*** Model of AsIs Processes Completed
**** Model of AsIs Processes Completed1
**** Model of AsIs Processes Completed2
*** Measure AsIs performance metrics
*** Identify Quick Wins
** Complete innovate phase
@endwbs
`

const plantUmlUml = `
@startuml
left to right direction
skinparam packageStyle rectangle
actor customer
actor clerk
rectangle checkout {
  customer -- (checkout)
  (checkout) .> (payment) : include
  (help) .> (checkout) : extends
  (checkout) -- clerk
}
@enduml
`

const plantUmlDitaa = `
@startditaa
+--------+   +-------+    +-------+
|        +---+ ditaa +--> |       |
|  Text  |   +-------+    |Diagram|
|Dokument|   |!Magie!|    |       |
|     {d}|   |       |    |       |
+---+----+   +-------+    +-------+
  :                         ^
  |    Ein Haufen Arbeit    |
  +-------------------------+
@endditaa
`

export default {
  basic,
  codeblock,
  katex,
  checkboxes,
  smartQuotes,
  breaks,
  abbrevations,
  subTexts,
  supTexts,
  deflists,
  shortcuts,
  footnote,
  tocPlaceholder,
  plantUmlMindMap,
  plantUmlGantt,
  plantUmlWbs,
  plantUmlDitaa,
  plantUmlUml
}
