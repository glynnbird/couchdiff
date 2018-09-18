const request = require('request-promise')
const spoolchanges = require('./lib/spoolchanges.js')
const tmp = require('tmp')
const spawn = require('child_process').spawn
const fs = require('fs')

// get info on database at url
const info = function (url) {
  return request.get({ url: url, json: true })
}

// sort file f1 and output sorted data to f2
const sort = function (f1, f2) {
  return new Promise(function (resolve, reject) {
    const ws = fs.createWriteStream(f2)
    const proc = spawn('sort', [f1])
    proc.stdout.on('data', function (data) {
      ws.write(data)
    })
    proc.on('exit', (code) => {
      ws.end(function () {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error('failed to sort'))
        }
      })
    })
  })
}

// diff two files - output to stdout
var diff = function (f1, f2, unified) {
  return new Promise(function (resolve, reject) {
    const params = [f1, f2]
    if (unified) {
      params.unshift('-u')
    }
    const proc = spawn('diff', params)
    proc.stdout.on('data', function (data) {
      process.stdout.write(data)
    })
    proc.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error('failed to diff'))
      }
    })
  })
}

// quick diff
const quick = function (a, b) {
  return Promise.all([info(a), info(b)]).then(function (data) {
    const obj = {
      a: data[0],
      b: data[1],
      ok: !!((data[0].doc_count === data[1].doc_count && data[0].doc_del_count === data[1].doc_del_count))
    }
    return obj
  })
}

// slow diff
const full = function (a, b, conflicts, unified) {
  // four temp files
  const aunsorted = tmp.fileSync().name
  const asorted = tmp.fileSync().name
  const bunsorted = tmp.fileSync().name
  const bsorted = tmp.fileSync().name

  console.error('spooling changes...')
  return Promise.all([spoolchanges(a, aunsorted, conflicts), spoolchanges(b, bunsorted, conflicts)]).then(function (data) {
    const obj = {
      a: data[0],
      b: data[1],
      ok: true
    }
    return obj
  }).then(function (data) {
    console.error('sorting...')
    return sort(aunsorted, asorted)
  }).then(function (data) {
    return sort(bunsorted, bsorted)
  }).then(function (data) {
    console.log('calculating difference...')
    return diff(asorted, bsorted, unified)
  })
}

module.exports = {
  quick: quick,
  full: full
}
