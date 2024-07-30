#!/usr/bin/env node

const url = require('url')
const couchdiff = require('..')
const syntax =
`
couchdiff <url1> <url2>

Syntax:
--quick/-q                          do quick diff                  (default: false)
--conflicts/-c                      do slower diff using conflicts (default: false)
--unified/-u                        output unified diff output      (default: false)

e.g.

couchdiff -qu http://localhost:5984/a http://localhost:5984/b 
`
const app = require('../package.json')
const { parseArgs } = require('node:util')
const argv = process.argv.slice(2)
const options = {
  quick: {
    type: 'boolean',
    short: 'q',
    default: false
  },
  conflicts: {
    type: 'boolean',
    short: 'c',
    default: false
  },
  unified: {
    type: 'boolean',
    short: 'u',
    default: false
  },
  help: {
    type: 'boolean',
    short: 'h',
    default: false
  }
}

// if insufficient arguments
const { values, positionals } = parseArgs({ argv, options, allowPositionals: true })

// help mode
if (values.help) {
  console.log(syntax)
  process.exit(0)
}

// if no urls provided, die
if (positionals.length !== 2) {
  console.error('ERROR: insufficient number of parameters. See --help. ')
  process.exit(1)
}

// check the urls
const a = positionals[0]
const b = positionals[1]
const both = [a, b]
both.forEach((u) => {
  const parsed = new url.URL(u)
  if (!parsed.protocol || !parsed.host || !parsed.pathname || parsed.pathname === '/') {
    console.error('ERROR: invalid URL ', u)
    process.exit(2)
  }
})

const main = async () => {
  let tokena = null
  let tokenb = null
  if (process.env.COUCHDB_TOKEN_A) {
    tokena = process.env.COUCHDB_TOKEN_A
  }
  if (process.env.COUCHDB_TOKEN_B) {
    tokenb = process.env.COUCHDB_TOKEN_B
  }

  if (values.quick) {
    // quick mode
    const data = await couchdiff.quick(a, b, tokena, tokenb)
    if (data.ok) {
      console.error('Both databases have the same number of docs and deletions')
      process.exit(0)
    } else {
      console.error('The databases have different numbers of documents:')
      console.error(data.a)
      console.error(data.b)
      process.exit(3)
    }
  } else {
    try {
      await couchdiff.full(a, b, tokena, tokenb, values.conflicts, values.unified)
      process.exit(0)
    } catch (e) {
      console.log(e)
      process.exit(3)
    }
  }
}

main()
