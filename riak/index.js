"use strict";

var net = require('net');
var path = require('path');
var SessionStore = require('./lib/sessionstore.js');
var Router = require('./lib/router.js');
var server = net.createServer();
var config = require('config');

var backendConfig = config.get('backend');
var backend = null;

if (backendConfig.engine === 'riak') {
  var Riak = require('./lib/riak.js');
  backend = new Riak(backendConfig.servers);
}

if (backendConfig.engine === 'redis') {
  var Redis = require('./lib/redis.js');
  backend = new Redis(backendConfig.servers);
}

if (backendConfig.engine === 'couchbase') {
  var Couchbase = require('./lib/couchbase.js');
  backend = new Couchbase(backendConfig.servers);
}

if (backend === null) {
  console.error('Invalid backend.');
  process.exit(1);
}

var sessionStore = new SessionStore(backend);

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
