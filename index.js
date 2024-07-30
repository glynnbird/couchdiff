const spoolchanges = require('./lib/spoolchanges.js')
const spawn = require('child_process').spawn
const fs = require('fs')
const { unlink } = require('node:fs/promises')
const os = require('os')
const path = require('path')
const crypto = require("crypto");

const tmpFile = () => {
  const tmpDir = os.tmpdir()
  const filename = crypto.randomUUID()
  return path.join(tmpDir, filename)
}

// get info on database at url
const info = async (url, token) => {
  let headers = {}
  if (token) {
    headers = {
      Authorization: `Bearer ${token}`
    }
  }
  const parsedUrl = new URL(url)
  if (parsedUrl.username && parsedUrl.password) {
    headers.authorization = `Basic ${btoa(parsedUrl.username + ':' + parsedUrl.password)}`
  }
  const response = await fetch(parsedUrl.origin + parsedUrl.pathname, { headers })
  return await response.json()}

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
      resolve()
    })
  })
}

// quick diff
const quick = async function (a, b, tokena, tokenb) {
  const data = await Promise.all([info(a, tokena), info(b, tokenb)])
  const obj = {
    a: data[0],
    b: data[1],
    ok: !!((data[0].doc_count === data[1].doc_count && data[0].doc_del_count === data[1].doc_del_count))
  }
  return obj
}

// slow diff
const full = async function (a, b, tokena, tokenb, conflicts, unified) {
  // four temp files
  const aunsorted = tmpFile()
  const asorted = tmpFile()
  const bunsorted = tmpFile()
  const bsorted = tmpFile()

  console.error('spooling changes...')
  await Promise.all([spoolchanges(a, tokena, aunsorted, conflicts), spoolchanges(b, tokenb, bunsorted, conflicts)])
  console.error('sorting...')
  await sort(aunsorted, asorted)
  await sort(bunsorted, bsorted)
  console.error('calculating difference...')
  await diff(asorted, bsorted, unified)
  await unlink(aunsorted)
  await unlink(asorted)
  await unlink(bunsorted)
  await unlink(bsorted)
}

module.exports = {
  quick,
  full
}
