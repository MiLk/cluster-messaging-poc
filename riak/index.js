"use strict";

var Riak = require('./lib/riak.js');

var riak = new Riak([
  'localhost:32777',
  'localhost:32775',
  'localhost:32773',
  'localhost:32771',
  'localhost:32769'
]);

function debug(err) {
  if (typeof err === 'string') {
    console.log(err);
    return;
  }
  console.error(err.message);
  console.log(err.stack);
}

riak.set('test', 'B', 'aaa').then(() => {
  riak.get('test', 'B').then((value) => {
    console.log('Value 1', value.toString());
    riak.set('test', 'B', 'bbb').then(() => {
      riak.get('test', 'B').then((value) => {
        console.log('Value 2', value.toString());
      }).catch(debug);
    }).catch(debug);
  }).catch(debug);
}).catch(debug);

function inc(value) {
  return !value ? 0 : parseInt(value) + 1;
}

riak.set('test', 'D', inc).then(() => {
  riak.get('test', 'D').then((value) => {
    console.log('Value D', value.toString());
  });
});

process.on('SIGINT', function() {
  riak.shutdown();
});
