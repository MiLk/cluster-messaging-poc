"use strict";

var Riak = require('./lib/riak.js');
var SessionStore = require('./lib/sessionstore.js');

var riak = new Riak([
  'localhost:32777',
  'localhost:32775',
  'localhost:32773',
  'localhost:32771',
  'localhost:32769'
]);

var sessionStore = new SessionStore(riak);

function debug(err) {
  console.log(err);
  if (typeof err === 'string') {
    console.log(err);
    return;
  }
  console.error(err.message);
  console.log(err.stack);
}

function onShutdown() {
  process.exit(0);
}

Promise.all([
  sessionStore.set('clientA', 'serverA'),
  sessionStore.set('clientB', 'serverB'),
  sessionStore.set('clientC', 'serverA'),
  sessionStore.set('clientD', 'serverA'),
  sessionStore.set('clientE', 'serverB'),
  sessionStore.set('clientF', 'serverC')
]).then(() => {
  return Promise.all([
    sessionStore.get('clientA'),
    sessionStore.get('clientB'),
    sessionStore.get('clientC'),
    sessionStore.get('clientD'),
    sessionStore.get('clientE'),
    sessionStore.get('clientF')
  ]);
}).then((values) => {
  console.log('Server addresses:\n*', values.map((v) => v.toString()).join("\n* "));
  sessionStore.shutdown().then(onShutdown).catch(debug);
}).catch(debug);

process.on('SIGINT', function() {
  sessionStore.shutdown().then(onShutdown).catch(debug);
});
