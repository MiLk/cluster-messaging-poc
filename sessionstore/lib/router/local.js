'use strict';

var Peer = require('../peer');

module.exports = class {
  constructor(sessionStore, sendLocal, sendNetwork) {
    this.sessionStore = sessionStore;
    this.peer = new Peer(this, sendLocal, sendNetwork);
  }
};
