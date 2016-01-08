/**
 * This file is the server in case of a client/server brokerless architecture.
 */
"use strict";

var net = require('net');
var path = require('path');
var uuid = require('node-uuid');
var config = require('config');
var zeromq = require('zmq');

// Router init
var SessionStore = require('./lib/sessionstore.js');
var Router = require('./lib/router/local.js');

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

// Init
var id = process.argv[2] || 1;
var identity = id;
var total = process.argv[3] || 1;

// ZeroMQ Router
var socket = zeromq.socket('router');
socket.identity = 'server' + process.pid;
socket.bind('tcp://127.0.0.1:' + (9000 + id), function(err) {
  if (err) throw err;
  socket.on('message', function(envelope, data) {
    console.log('Received:', JSON.parse(data));
  });
});

// ZeroMQ dealer
var dealers = {};

function createDealer(serverId) {
  var dealerSocket = zeromq.socket('dealer');
  dealerSocket.identity = 'client' + process.pid;
  dealerSocket.connect('tcp://127.0.0.1:' + (9000 + serverId));
  return dealerSocket;
}

// Router part
function sendLocal(from, to, body) {
  console.log('Received:', from, to, body);
}

function sendNetwork(serverId, from, to, body) {
  if (!dealers.hasOwnProperty(serverId)) {
    dealers[serverId] = createDealer(serverId);
  }
  dealers[serverId].send(JSON.stringify([from, to, body]));
}

var sessionStore = new SessionStore(backend);
var router = new Router(sessionStore, sendLocal, sendNetwork);

// Internal logic
function sendIdentity(_identity) {
  router.peer.registerIdentity(_identity);
}

function connectClient(clientId) {
  router.peer.connectClient(clientId);
}

function disconnectClient(clientId) {
  router.peer.disconnectClient(clientId);
}

function sendMessage(from, to, msg) {
  router.peer.sendMessage(from, to, msg);
}

sendIdentity(identity);
setTimeout(() => {
  connectClient('clientA' + id);
}, 500);
setTimeout(() => {
  connectClient('clientB' + id);
}, 600);
setTimeout(() => {
  connectClient('clientC' + id);
}, 700);
setTimeout(() => {
  connectClient('clientD' + id);
}, 800);

setTimeout(() => {
  sendMessage('clientD' + id, 'clientA' + id, 'Hello from D to A!');
}, 900);
setTimeout(() => {
  sendMessage('clientA' + id, 'clientB' + id, 'Hello from A to B!');
}, 1000);
setTimeout(() => {
  sendMessage('clientC' + id, 'clientB' + id, 'Hello from C to B!');
}, 1100);

setTimeout(() => {
  disconnectClient('clientB' + id);
}, 1900);
setTimeout(() => {
  disconnectClient('clientD' + id);
}, 2000);

setTimeout(() => {
  sendMessage('clientA' + id, 'clientA' + ((id % total) + 1), 'Hello from A to A!');
}, 2500);
setTimeout(() => {
  sendMessage('clientC' + id, 'clientC' + ((id % total) + 1), 'Hello from C to C!');
}, 2600);
setTimeout(() => {
  sendMessage('clientA' + id, 'clientC' + ((id % total) + 1), 'Hello from A to C!');
}, 2700);
setTimeout(() => {
  sendMessage('clientC' + id, 'clientA' + ((id % total) + 1), 'Hello from C to A!');
}, 2800);

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

function shutdown() {
  sessionStore.shutdown().then(onShutdown).catch(debug);
}

process.on('SIGINT', function () {
  disconnectClient('clientA' + id);
  disconnectClient('clientC' + id);
  shutdown();
});

process.on('uncaughtException', function (err) {
  debug(err);
  shutdown();
});
