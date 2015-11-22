"use strict";

module.exports = class {
  constructor(datastore) {
    this.datastore = datastore;
    this.bucket = 'sessions';
  }

  get (clientId) {
    return this.datastore.get(this.bucket, clientId);
  }

  set (clientId, serverId) {
    return this.datastore.set(this.bucket, clientId, serverId);
  }

  remove (clientId) {
    return this.datastore.deleteValue(this.bucket, clientId);
  }

};