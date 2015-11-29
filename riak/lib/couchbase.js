"use strict";

var Couchbase = require('couchbase');

module.exports = class {
  constructor(servers) {
    this.connect(servers.address, servers.bucket);
  }

  connect(address, bucket) {
    this.client = new Couchbase.Cluster(address);
    this.bucket = this.client.openBucket(bucket);
  }

  get(bucket, key) {
    return new Promise((resolve, reject) => {
      this.bucket.get(bucket + ':' + key, function (err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res.value);
      });
    });
  }

  set(bucket, key, value) {
    return new Promise((resolve, reject) => {
      this.bucket.upsert(bucket + ':' + key, value, function (err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  }

  deleteValue(bucket, key) {
    return new Promise((resolve, reject) => {
      this.bucket.remove(bucket + ':' + key, function (err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  }

  shutdown() {
    return new Promise(function (resolve, reject) {
      resolve();
    })
  }
};
