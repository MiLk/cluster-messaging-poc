"use strict";

var net = require('net');
var path = require('path');
var Riak = require('./lib/riak.js');
var SessionStore = require('./lib/sessionstore.js');
var Router = require('./lib/router.js');
var server = net.createServer();

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
  server.close(() => {
    process.exit(0);
  });
}

function shutdown() {
  sessionStore.shutdown().then(onShutdown).catch(debug);
}

process.on('SIGINT', function() {
  shutdown();
});

var router = new Router(server, sessionStore);

server.on('error', debug);
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    shutdown();
  }
});
server.listen(path.join(__dirname, 'server.sock'), function () {
  console.log("Server listening on %j", server.address());
});

process.on('uncaughtException', function (err) {
  console.log(err);
  shutdown();
});
