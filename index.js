const request = require('request-promise');
const spoolchanges = require('./lib/spoolchanges.js');
const tmp = require('tmp');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const fs = require('fs');


// get info on database at url
var info = function(url) {
  return request.get({url: url, json: true});
};

// sort file f1 and output sorted data to f2
var sort = function(f1, f2) {

  var ws = fs.createWriteStream(f2);
  return new Promise(function(resolve, reject) {
    var proc = spawn('sort', [f1]);
    proc.stdout.on('data', function(data){
      ws.write(data);
    });
    proc.on('exit', (code) => {
      ws.end(function() {
        if (code === 0) {
          resolve()
        } else {
          reject();
        }
      });
    });
  });
};

// diff two files - output to stdout
var diff = function(f1, f2) {
  return new Promise(function(resolve, reject) {
    var proc = spawn('diff', [f1, f2]);
    proc.stdout.on('data', function(data) {
      process.stdout.write(data);
    });
    proc.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject();
      }
    });
  });
}

// quick diff
const quick = function(a, b) {
  return Promise.all([ info(a), info(b)]).then(function(data) {
    var obj = {
      a: data[0],
      b: data[1],
      ok: (data[0].doc_count === data[1].doc_count && data[0].doc_del_count === data[1].doc_del_count)?true:false
    };
    return obj;
  })
};


// slow diff
const full = function(a, b) {

  // four temp files
  var aunsorted = tmp.fileSync().name;
  var asorted = tmp.fileSync().name;
  var bunsorted = tmp.fileSync().name;
  var bsorted = tmp.fileSync().name;

  console.error('spooling changes...');
  return Promise.all([ spoolchanges(a, aunsorted ), spoolchanges(b, bunsorted)]).then(function(data) {
    var obj = {
      a: data[0],
      b: data[1],
      ok: true
    };
    return obj;
  }).then(function(data) {
    console.error('sorting...');
    return Promise.all([ sort(aunsorted, asorted), sort(bunsorted, bsorted)]);
  }).then(function(data) {
    console.log('calculating difference...');
    return diff(asorted, bsorted);
  })
  .catch(function(e) {
    if (e) {
      console.error(e);
    }
  });
};

module.exports = {
  quick: quick,
  full: full
}