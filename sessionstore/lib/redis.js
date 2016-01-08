'use strict';

var Redis = require('ioredis');

module.exports = class {
  constructor(servers) {
    this.connect(servers);
  }

  connect(servers) {
    this.client = new Redis(servers);
  }

  get(bucket, key) {
    return this.client.get(bucket + ':' + key);
  }

  set(bucket, key, value) {
    return this.client.set(bucket + ':' + key, value);
  }

  deleteValue(bucket, key) {
    return this.client.del(bucket + ':' + key);
  }

  shutdown() {
    return new Promise(function(resolve, reject) {
      resolve();
    })
  }
};
