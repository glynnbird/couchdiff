// const axios = require('axios')
const { pipeline } = require('node:stream/promises')
const stream = require('stream')
const Readable = stream.Readable
const fs = require('fs')
const jsonpour = require('jsonpour')
const pkg = require('../package.json')

module.exports = async (url, token, filename, conflicts) => {
  // return new Promise(async function (resolve, reject) {
  // list of document ids to process
  let doccount = 0
  const ws = fs.createWriteStream(filename)

  // called once per received change
  const onChange = (c) => {
    if (c) {
      if (c.error) {
        console.error('error', c)
      } else if (c.changes) {
        let revs = c.changes.map(function (r) {
          return r.rev
        })
        if (conflicts && typeof c.doc === 'object' && c.doc._conflicts) {
          revs = revs.concat(c.doc._conflicts).sort()
        }
        ws.write(c.id + '/' + revs.join('/') + '\n')
        doccount++
      }
    }
  }

  const changeTransform = function () {
    const change = new stream.Transform({ objectMode: true })
    change._transform = function (line, encoding, done) {
      onChange(line)
      done()
    }
    return change
  }

  // stream the changes feed to disk
  const parsedUrl = new URL(url)
  let u = parsedUrl.origin + parsedUrl.pathname + '/_changes?seq_interval=10000'
  if (conflicts) {
    u += '&include_docs=true&conflicts=true'
  }
  let headers = {
    'content-type': 'application/json',
    'user-agent': `${pkg.name}@${pkg.version}`
  }
  if (parsedUrl.username && parsedUrl.password) {
    headers.authorization = `Basic ${btoa(parsedUrl.username + ':' + parsedUrl.password)}`
  }
  if (token) {
    headers = {
      Authorization: `Bearer ${token}`
    }
  }
  const response = await fetch(u, { method: 'get', headers })
  await pipeline(
    Readable.fromWeb(response.body),
    jsonpour.parse('results.*'),
    changeTransform()
  )
  return doccount
}
