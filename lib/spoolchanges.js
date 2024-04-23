const axios = require('axios')
const fs = require('fs')
const liner = require('./liner.js')
const change = require('./change.js')

module.exports = async (url, token, filename, conflicts) => {
  return new Promise(async function (resolve, reject) {
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

    // stream the changes feed to disk
    let u = url + '/_changes?seq_interval=10000'
    if (conflicts) {
      u += '&include_docs=true&conflicts=true'
    }

    let headers = {}
    if (token) {
      headers = {
        Authorization: `Bearer ${token}`
      }
    }

    const response = await axios.request({ url: u, responseType: 'stream', headers })
    response.data.pipe(liner())
      .pipe(change(onChange))
      .on('finish', () => {
        ws.end(() => {
          resolve({ doccount })
        })
      })
  })
}
