#!/usr/bin/env node

const url = require('url')
const couchdiff = require('..')

// command-line args
const args = require('yargs')
  .command('[options] <url1> <url2>', 'calculate difference between two databases', (yargs) => {
    yargs.positional('url1', { describe: 'first url', type: 'string' })
    yargs.positional('url2', { describe: 'second url', type: 'string' })
  })
  .option('quick', { alias: 'q', type: 'boolean', describe: 'do quick diff', default: false })
  .option('conflicts', { alias: 'c', type: 'boolean', describe: 'do slower diff using conflicts too', default: false })
  .option('unified', { alias: 'u', type: 'boolean', describe: 'output unified diff output', default: false })
  .help('help')
  .argv

// if insufficient arguments
if (!args._ || args._.length !== 2) {
  console.error('ERROR: insufficient number of parameters. See --help. ')
  process.exit(1)
}

// check the urls
const a = args._[0]
const b = args._[1]
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

  if (args.quick) {
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
      await couchdiff.full(a, b, tokena, tokenb, args.conflicts, args.unified)
      process.exit(0)
    } catch (e) {
      process.exit(3)
    }
  }
}

main()
