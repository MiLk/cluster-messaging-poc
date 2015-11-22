"use strict";

class Connection {
  constructor(router, socket) {
    this.router = router;
    this.socket = socket;
    this.identity = null;

    this.opcodes = {
      0: this.registerIdentity,
      1: this.connectClient,
      2: this.disconnectClient,
      3: this.sendMessage
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

  registerIdentity(identity) {
    if (this.identity) {
      throw new Error('This connection has already an identity');
    }
    this.identity = identity;
    this.router.servers[identity] = this;
    console.log('Server registered as:', identity);
  }

  connectClient(clientId) {
    this.router.sessionStore.set(clientId, this.identity);
    console.log('Client', clientId, 'connected to server', this.identity);
  }

  disconnectClient(clientId) {
    this.router.sessionStore.remove(clientId)
    console.log('Client', clientId, 'disconnected');
  }

  sendMessage(from, to, body) {
    this.router.sessionStore.get(to)
      .then((buffer) => {
        return buffer.toString();
      })
      .then((serverId) => {
        if (serverId === this.identity) {
          this.sendLocal(from, to, body);
          return;
        }
        this.sendNetwork(serverId, from, to, body);
      });
  }

  sendLocal(from, to, body) {
    this.socket.write(JSON.stringify([4, from, to, body]));
  }

  sendNetwork(serverId, from, to, body) {
    this.router.servers[serverId].socket.write(JSON.stringify([4, from, to, body]));
  }

  closeListener() {
    console.log('Server', this.identity, 'disconnected.');
    delete this.router.servers[this.identity];
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