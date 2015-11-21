"use strict";

var Riak = require('basho-riak-client');

module.exports = class {
  constructor (servers) {
    this.connect(servers);
  }

  connect (servers) {
    this.client = new Riak.Client(servers);
  }

  _fetch (bucket, key) {
    return new Promise((resolve, reject) => {
      this.client.fetchValue({ bucket: bucket, key: key },
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

  get (bucket, key) {
    return this._fetch(bucket,key).then((riakObj) => {
      return riakObj.value;
    });
  }

  _store (object) {
    return new Promise((resolve, reject) => {
      this.client.storeValue({ value: object }, function (err, rslt) {
        if (err) {
          reject(err);
          return;
        }
        resolve(rslt);
      });
    });
  }

  set (bucket, key, value) {
    return new Promise((resolve, reject) => {
      this._fetch(bucket, key)
        .then((riakObj) => {
          if (!riakObj) {
            riakObj = new Riak.Commands.KV.RiakObject();
            riakObj.setBucket(bucket);
            riakObj.setKey(key);
          }
          if (typeof value == 'function') {
            riakObj.setValue(value(riakObj.value));
          } else {
            riakObj.setValue(value);
          }
          this._store(riakObj)
            .then(resolve)
            .catch(reject);
        }).catch(reject);
    });
  }

  deleteValue (bucket, key) {
    return new Promise((resolve, reject) => {
      this.client.deleteValue({ bucket: bucket, key: key }, function (err, rslt) {
        if (err) {
          reject(err);
          return;
        }
        resolve(rslt);
      });
    });
  }

  shutdown() {
    this.client.shutdown((state) => {
      if (state === Riak.Cluster.State.SHUTDOWN) {
        process.exit();
      }
    });
  }
};
