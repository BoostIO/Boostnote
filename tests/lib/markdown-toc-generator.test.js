/**
 * @fileoverview Unit test for browser/lib/markdown-toc-generator
 */

import CodeMirror from 'codemirror'
require('codemirror/addon/search/searchcursor.js')
const markdownToc = require('browser/lib/markdown-toc-generator')
const EOL = require('os').EOL

test(() => {
  /**
   * Contains array of test cases in format :
   * [
   *    test title
   *    input markdown,
   *    expected toc
   * ]
   * @type {*[]}
   */
  const testCases = [
    [
      '***************************** empty note',
      `  
    `,
      ` 
<!-- toc -->



<!-- tocstop -->
    `
    ],
    [
      '***************************** single level',
      `
# one
    `,
      `
<!-- toc -->

- [one](#one)

<!-- tocstop -->
    `
    ],
    [
      '***************************** two levels',
      `
# one
# two    
    `,
      `
<!-- toc -->

- [one](#one)
- [two](#two)

<!-- tocstop -->    
    `
    ],
    [
      '***************************** 3 levels with children',
      `
# one
## one one
# two
## two two
# three
## three three
    `,
      `
<!-- toc -->

- [one](#one)
  * [one one](#one-one)
- [two](#two)
  * [two two](#two-two)
- [three](#three)
  * [three three](#three-three)

<!-- tocstop -->
    `
    ],
    [
      '***************************** 3 levels, 3rd with 6 sub-levels',
      `
# one
## one one
# two
## two two
# three
## three three
### three three three
#### three three three three
##### three three three three three
###### three three three three three three
    `,
      `
<!-- toc -->

- [one](#one)
  * [one one](#one-one)
- [two](#two)
  * [two two](#two-two)
- [three](#three)
  * [three three](#three-three)
    + [three three three](#three-three-three)
      - [three three three three](#three-three-three-three)
        * [three three three three three](#three-three-three-three-three)
          + [three three three three three three](#three-three-three-three-three-three)

<!-- tocstop -->
    `
    ],
    [
      '***************************** multilevel with texts in between',
      `
# one
this is a level one text
this is a level one text
## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
# three
  this is a level three three text
  this is a level three three text
## three three
  this is a text
  this is a text
### three three three
  this is a text
  this is a text
### three three three 2
  this is a text
  this is a text
#### three three three three
  this is a text
  this is a text
#### three three three three 2
  this is a text
  this is a text
##### three three three three three
  this is a text
  this is a text
##### three three three three three 2
  this is a text
  this is a text
###### three three three three three three
  this is a text
  this is a text
  this is a text      
    `,
      `
<!-- toc -->

- [one](#one)
  * [one one](#one-one)
- [two](#two)
  * [two two](#two-two)
- [three](#three)
  * [three three](#three-three)
    + [three three three](#three-three-three)
    + [three three three 2](#three-three-three-2)
      - [three three three three](#three-three-three-three)
      - [three three three three 2](#three-three-three-three-2)
        * [three three three three three](#three-three-three-three-three)
        * [three three three three three 2](#three-three-three-three-three-2)
          + [three three three three three three](#three-three-three-three-three-three)

<!-- tocstop -->
    `
    ],
    [
      '***************************** outdated TOC',
      `
<!-- toc -->

- [one](#one)
  * [one one](#one-one)

<!-- tocstop -->

# one modified
## one one      
    `,
      `
<!-- toc -->

- [one modified](#one-modified)
  * [one one](#one-one)

<!-- tocstop -->
    `
    ],
    [
      '***************************** properly generated case sensitive TOC',
      `
# onE 
## oNe one
    `,
      `
<!-- toc -->

- [onE](#onE)
  * [oNe one](#oNe-one)

<!-- tocstop -->
    `
    ],
    [
      '***************************** position of TOC is stable (do not use elements above toc marker)',
      `
# title

this is a text

<!-- toc -->

- [onE](#onE)
  * [oNe one](#oNe-one)

<!-- tocstop -->

# onE 
## oNe one      
    `,
      `
<!-- toc -->

- [onE](#onE)
  * [oNe one](#oNe-one)

<!-- tocstop -->
    `
    ],
    [
      '***************************** properly handle generation of not completed TOC',
      `
# hoge

##     
    `,
      `
<!-- toc -->

- [hoge](#hoge)

<!-- tocstop -->  
    `
    ]
  ]

  testCases.forEach(testCase => {
    const title = testCase[0]
    const inputMd = testCase[1].trim()
    const expectedToc = testCase[2].trim()
    const generatedToc = markdownToc.generate(inputMd)

    expect(generatedToc).toBe(expectedToc)
  })
})

test(() => {
  /**
   * Contains array of test cases in format :
   * [
   *    title
   *    cursor
   *    inputMd
   *    expectedMd
   * ]
   * @type {*[]}
   */
  const testCases = [
    [
      `***************************** Empty note, cursor at the top`,
      { line: 0, ch: 0 },
      ``,
      `
<!-- toc -->



<!-- tocstop -->
     `
    ],
    [
      `***************************** Two level note,TOC at the beginning `,
      { line: 0, ch: 0 },
      `
# one
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
      `,
      `
<!-- toc -->

- [one](#one)
  * [one one](#one-one)
- [two](#two)
  * [two two](#two-two)

<!-- tocstop -->
# one
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text      
      `
    ],
    [
      `***************************** Two level note, cursor just after 'header text' `,
      { line: 1, ch: 12 },
      `
# header 
 header text

# one
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text   
      `,
      `
# header 
 header text
<!-- toc -->

- [one](#one)
  * [one one](#one-one)
- [two](#two)
  * [two two](#two-two)

<!-- tocstop -->

# one
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
      `
    ],
    [
      `***************************** Two level note, cursor at empty line under 'header text' `,
      { line: 2, ch: 0 },
      `
# header 
 header text

# one
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
      `,
      `
# header 
 header text
<!-- toc -->

- [one](#one)
  * [one one](#one-one)
- [two](#two)
  * [two two](#two-two)

<!-- tocstop -->
# one
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
      `
    ],
    [
      `***************************** Two level note, cursor just before 'text' word`,
      { line: 1, ch: 8 },
      `
# header 
 header text

# one
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
      `,
      `
# header 
 header 
<!-- toc -->

- [one](#one)
  * [one one](#one-one)
- [two](#two)
  * [two two](#two-two)

<!-- tocstop -->
text

# one
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
      `
    ],
    [
      `***************************** Already generated TOC without header file, regenerate TOC in place, no changes`,
      { line: 13, ch: 0 },
      `
# header 
 header text
<!-- toc -->

- [one](#one)
  * [one one](#one-one)
- [two](#two)
  * [two two](#two-two)

<!-- tocstop -->
# one
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
      `,
      `
# header 
 header text
<!-- toc -->

- [one](#one)
  * [one one](#one-one)
- [two](#two)
  * [two two](#two-two)

<!-- tocstop -->
# one
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
      `
    ],
    [
      `***************************** Already generated TOC, needs updating in place`,
      { line: 0, ch: 0 },
      `
# header 
 header text
<!-- toc -->

- [one](#one)
  * [one one](#one-one)
- [two](#two)
  * [two two](#two-two)

<!-- tocstop -->
# This is the one 
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
      `,
      `
# header 
 header text
<!-- toc -->

- [This is the one](#This-is-the-one)
  * [one one](#one-one)
- [two](#two)
  * [two two](#two-two)

<!-- tocstop -->
# This is the one 
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
      `
    ],
    [
      `***************************** Document with cursor at the last line, expecting empty TOC `,
      { line: 13, ch: 30 },
      `
# header 
 header text

# This is the one 
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
      `,
      `
# header 
 header text

# This is the one 
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
<!-- toc -->



<!-- tocstop -->
      `
    ],
    [
      `***************************** Empty, not actual TOC , should be supplemented with two new points beneath`,
      { line: 0, ch: 0 },
      `
# header 
 header text

# This is the one 
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
<!-- toc -->



<!-- tocstop -->
# new point included in toc
## new subpoint
      `,
      `
# header 
 header text

# This is the one 
this is a level one text
this is a level one text

## one one
# two
  this is a level two text
  this is a level two text
## two two
  this is a level two two text
  this is a level two two text
<!-- toc -->

- [new point included in toc](#new-point-included-in-toc)
  * [new subpoint](#new-subpoint)

<!-- tocstop -->
# new point included in toc
## new subpoint
      `
    ]
  ]
  testCases.forEach(testCase => {
    const title = testCase[0]
    const cursor = testCase[1]
    const inputMd = testCase[2].trim()
    const expectedMd = testCase[3].trim()

    const editor = CodeMirror()
    editor.setValue(inputMd)
    editor.setCursor(cursor)
    markdownToc.generateInEditor(editor)

    expect(expectedMd).toBe(editor.getValue())
  })
})
