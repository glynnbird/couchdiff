var request = require('request'),
  fs = require('fs'),
  liner = require('./liner.js'),
  change = require('./change.js');

module.exports = function(url, filename, conflicts) {
  
  return new Promise(function(resolve, reject) {
    // list of document ids to process
    var doccount = 0;
    var ws = fs.createWriteStream(filename);

    // send documents ids to the queue in batches of 500 + the last batch
    var processBuffer = function(lastOne) {
      if (buffer.length >= blocksize || lastOne) {
        var n = blocksize;
        if (lastOne) {
          n = buffer.length;
        }
        var b = { docs: buffer.splice(0, blocksize), batch: batch };
        log_stream.write(':t batch' + batch + ' ' + JSON.stringify(b.docs) + '\n')
        process.stderr.write('\r batch ' + batch);
        batch++;
      }
    };

    // called once per received change
    var onChange = function(c) {
      if (c) {
        if (c.error) {
          console.error('error', c);
        } else if (c.changes) {
          var revs = c.changes.map(function(r) {
            return r.rev;
          });
          if (conflicts && typeof c.doc === 'object' && c.doc._conflicts) {
            revs = revs.concat(c.doc._conflicts).sort();
          }
          ws.write(c.id + '/' + revs.join('/') + '\n');
          doccount++;
        } 
      }
    };

    // stream the changes feed to disk
    var u = url + '/_changes?seq_interval=10000';
    if (conflicts) {
      u += '&include_docs=true&conflicts=true';
    }
    request(u)
      .pipe(liner())
      .pipe(change(onChange))
      .on('finish', function() {
        ws.end(function() {
          resolve({ doccount: doccount});
        });
      });;
  });
  
  
};