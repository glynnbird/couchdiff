const axios = require('axios')
const spoolchanges = require('./lib/spoolchanges.js')
const tmp = require('tmp')
const spawn = require('child_process').spawn
const fs = require('fs')

// get info on database at url
const info = async function (url) {
  const response = await axios.request({ url })
  return response.data
}

// sort file f1 and output sorted data to f2
const sort = async function (f1, f2) {
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
const diff = async function (f1, f2, unified) {
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
const quick = async function (a, b) {
  const data = await Promise.all([info(a), info(b)])
  const obj = {
    a: data[0],
    b: data[1],
    ok: !!((data[0].doc_count === data[1].doc_count && data[0].doc_del_count === data[1].doc_del_count))
  }
  return obj
}

// slow diff
const full = async function (a, b, conflicts, unified) {
  // four temp files
  const aunsorted = tmp.fileSync().name
  const asorted = tmp.fileSync().name
  const bunsorted = tmp.fileSync().name
  const bsorted = tmp.fileSync().name

  console.error('spooling changes...')
  await Promise.all([spoolchanges(a, aunsorted, conflicts), spoolchanges(b, bunsorted, conflicts)])
  console.error('sorting...')
  await sort(aunsorted, asorted)
  await sort(bunsorted, bsorted)
  console.log('calculating difference...')
  return await diff(asorted, bsorted, unified)
}

module.exports = {
  quick,
  full
}
