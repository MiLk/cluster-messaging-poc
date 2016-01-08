'use strict';

module.exports = class {
  constructor(router, sendLocal, sendNetwork) {
    this.identity = null;
    this.router = router;
    this.sendLocal = sendLocal;
    this.sendNetwork = sendNetwork;
  }

  registerIdentity(identity) {
    if (this.identity) {
      throw new Error('This connection has already an identity');
    }
    this.identity = identity;
    console.log('Server registered as:', identity);
  }

  connectClient(clientId) {
    this.router.sessionStore.set(clientId, this.identity);
    console.log('Client', clientId, 'connected to server', this.identity);
  }

  disconnectClient(clientId) {
    this.router.sessionStore.get(clientId).then((buffer) => {
      return buffer.toString();
    }).then((serverId) => {
      if (serverId !== this.identity) {
        console.log('Client', clientId, 'disconnected from', this.identity,
          'but connected to', serverId);
        return;
      }
      this.router.sessionStore.remove(clientId);
      console.log('Client', clientId, 'disconnected from', this.identity);
    }).catch((err) => {
      throw err;
    });
  }

  sendMessage(from, to, body) {
    this.router.sessionStore.get(to)
      .then((buffer) => {
        if (!buffer) {
          throw new Error('Client not found.');
        }
        return buffer.toString();
      })
      .then((serverId) => {
        if (serverId === this.identity) {
          this.sendLocal(from, to, body);
          return;
        }
        this.sendNetwork(serverId, from, to, body);
      }).catch((error) => {
      console.error(error);
    });
  }

};
