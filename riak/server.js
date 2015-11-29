"use strict";

var net = require('net');
var path = require('path');
var uuid = require('node-uuid');

var identity = uuid.v1();

var id = process.argv[2] || 1;
var total = process.argv[3] || 1;

function sendIdentity(client, _identity) {
  client.write(JSON.stringify([0, _identity]));
}

function connectClient(client, clientId) {
  client.write(JSON.stringify([1, clientId]));
}

function disconnectClient(client, clientId) {
  client.write(JSON.stringify([2, clientId]));
}

function sendMessage(client, from, to, msg) {
  client.write(JSON.stringify([3, from, to, msg]));
}

var client = net.connect(path.join(__dirname, 'server.sock'));

client.on('connect', function () {
  sendIdentity(client, identity);
  setTimeout(() => {
    connectClient(client, 'clientA' + id);
  }, 500);
  setTimeout(() => {
    connectClient(client, 'clientB' + id);
  }, 600);
  setTimeout(() => {
    connectClient(client, 'clientC' + id);
  }, 700);
  setTimeout(() => {
    connectClient(client, 'clientD' + id);
  }, 800);

  setTimeout(() => {
    sendMessage(client, 'clientD' + id, 'clientA' + id, 'Hello from D to A!');
  }, 900);
  setTimeout(() => {
    sendMessage(client, 'clientA' + id, 'clientB' + id, 'Hello from A to B!');
  }, 1000);
  setTimeout(() => {
    sendMessage(client, 'clientC' + id, 'clientB' + id, 'Hello from C to B!');
  }, 1100);

  setTimeout(() => {
    disconnectClient(client, 'clientB' + id);
  }, 1900);
  setTimeout(() => {
    disconnectClient(client, 'clientD' + id);
  }, 2000);

  setTimeout(() => {
    sendMessage(client, 'clientA' + id, 'clientA' + ((id%total) + 1), 'Hello from A to A!');
  }, 2500);
  setTimeout(() => {
    sendMessage(client, 'clientC' + id, 'clientC' + ((id%total) + 1), 'Hello from C to C!');
  }, 2600);
  setTimeout(() => {
    sendMessage(client, 'clientA' + id, 'clientC' + ((id%total) + 1), 'Hello from A to C!');
  }, 2700);
  setTimeout(() => {
    sendMessage(client, 'clientC' + id, 'clientA' + ((id%total) + 1), 'Hello from C to A!');
  }, 2800);
});

client.on('end', function () {
  console.log('disconnected from server');
});
client.on('data', function (data) {
  var received = JSON.parse(data);
  console.log('Received:', received);
});

process.on('SIGINT', function () {
  disconnectClient(client, 'clientA' + id);
  disconnectClient(client, 'clientC' + id);
  client.end();
});