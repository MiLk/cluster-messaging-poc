'use strict';

var Riak = require('basho-riak-client');

module.exports = class {
  constructor(servers) {
    this.connect(servers);
  }

  connect(servers) {
    this.client = new Riak.Client(servers);
  }

  _fetch(bucket, key) {
    return new Promise((resolve, reject) => {
      this.client.fetchValue({bucket: bucket, key: key},
        function (err, rslt) {
          if (err) {
            reject(err);
            return;
          } else {
            var riakObj = rslt.values.shift();
            resolve(riakObj);
          }
        }
      );
    });
  }

  get(bucket, key) {
    return this._fetch(bucket, key).then((riakObj) => {
      return riakObj.value;
    });
  }

  _store(object) {
    return new Promise((resolve, reject) => {
      this.client.storeValue({value: object}, function (err, rslt) {
        if (err) {
          reject(err);
          return;
        }
        resolve(rslt);
      });
    });
  }

  _insert(bucket, key, value) {
    let riakObj = new Riak.Commands.KV.RiakObject();
    riakObj.setBucket(bucket);
    riakObj.setKey(key);
    riakObj.setValue(value);
    return this._store(riakObj);
  }

  set(bucket, key, value) {
    return this._insert(bucket, key, value);
  }

  deleteValue(bucket, key) {
    return new Promise((resolve, reject) => {
      this.client.deleteValue({bucket: bucket, key: key}, function (err, rslt) {
        if (err) {
          reject(err);
          return;
        }
        resolve(rslt);
      });
    });
  }

  shutdown() {
    return new Promise((resolve, reject) => {
      this.client.shutdown((state) => {
        if (state === Riak.Cluster.State.SHUTDOWN) {
          resolve();
        }
      });
    });
  }
};
