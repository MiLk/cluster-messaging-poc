'use strict';

var Peer = require('./peer');

class Connection {
  constructor(router, socket) {
    this.router = router;
    this.socket = socket;
    this.identity = null;
    this.peer = new Peer(router, this.sendLocal.bind(this), this.sendNetwork.bind(this));

    this.opcodes = {
      0: this.peer.registerIdentity,
      1: this.peer.connectClient,
      2: this.peer.disconnectClient,
      3: this.peer.sendMessage,
    };

    socket.on('data', this.dataListener.bind(this));
    socket.on('close', this.closeListener.bind(this));
  }

  dataListener(data) {
    var received = JSON.parse(data);
    if (this.opcodes.hasOwnProperty(received[0])) {
      setImmediate(() => {
        this.opcodes[received[0]].apply(this, received.slice(1));
      });
    } else {
      console.log('Unrecognized packet format. Data:', data, JSON.parse(data));
    }
  }

  sendLocal(from, to, body) {
    this.socket.write(JSON.stringify([4, from, to, body]));
  }

  sendNetwork(serverId, from, to, body) {
    if (!this.router.servers[serverId]) {
      throw new Error('Server ' + serverId + ' no longer available.');
    }
    this.router.servers[serverId].socket.write(
      JSON.stringify([4, from, to, body]));
  }

  closeListener() {
    console.log('Server', this.peer.identity, 'disconnected.');
    delete this.router.servers[this.peer.identity];
  }
}

module.exports = class {
  constructor(server, sessionStore) {
    this.server = server;
    this.sessionStore = sessionStore;
    server.on('connection', this.connectionListener.bind(this));
    this.servers = {};
  }

  connectionListener(socket) {
    var connection = new Connection(this, socket);
  }
};
