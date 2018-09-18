#!/usr/bin/env node

const url = require('url')
const couchdiff = require('..')

// command-line args
var args = require('yargs')
  .command('[options] <url1> <url2>', 'calculate difference between two databases', (yargs) => {
    yargs.positional('url1', { describe: 'first url', type: 'string' })
    yargs.positional('url2', { describe: 'second url', type: 'string' })
  })
  .option('quick', { alias: 'q', describe: 'do quick diff', default: false })
  .option('conflicts', { alias: 'c', describe: 'do slower diff using conflicts too', default: false })
  .option('unified', { alias: 'u', describe: 'output unified diff output', default: false })
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
  const parsed = url.parse(u)
  if (!parsed.protocol || !parsed.host || !parsed.path || parsed.path === '/') {
    console.error('ERROR: invalid URL ', u)
    process.exit(2)
  }
})

if (args.quick) {
  // quick mode
  couchdiff.quick(a, b).then(function (data) {
    if (data.ok) {
      console.error('Both databases have the same number of docs and deletions')
      process.exit(0)
    } else {
      console.error('The databases have different numbers of documents:')
      console.error(data.a)
      console.error(data.b)
      process.exit(3)
    }
  })
} else {
  couchdiff.full(a, b, args.conflicts, args.unified).then(function (data) {
    process.exit(0)
  }).catch(function (e) {
    process.exit(3)
  })
}
