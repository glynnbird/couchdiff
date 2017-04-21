#!/usr/bin/env node

const pkg = require('../package.json');
const url = require('url');
const couchdiff = require('..');

// command-line args
var args = require('commander');
args
  .version(pkg.version)
  .usage('[options] <url1> <url2>')
  .option('-q, --quick', 'do quick diff')
  .parse(process.argv);

// if insufficient arguments
if (!args.args || args.args.length !== 2) {
  console.error('ERROR: insufficient number of parameters ')
  args.outputHelp(function(help) {
    console.error(help);
    process.exit(1);
  }); 
}

// check the urls
var a = args.args[0];
var b = args.args[1];
var both = [a,b];
both.forEach(function(u) {
  var parsed = url.parse(u);
  if (!parsed.protocol || !parsed.host || !parsed.path || parsed.path === '/') {
    console.error('ERROR: invalid URL ', u);
    process.exit(2);
  }
});

if (args.quick) {
  // quick mode
  couchdiff.quick(a, b).then(function(data) {
    if (data.ok) {
      console.log('Both databases have the same number of docs and deletions');
    } else {
      console.log('The databases have different numbers of documents:');
      console.log(data.a);
      console.log(data.b);
    }
    process.exit(0);
  });
} else {
  couchdiff.full(a, b).then(function(data) {
  });
}



