# Cluster Messaging

Proof of Concept for a simple messaging system in a cluster.

Implement a server to server messaging system using a Node.js broker connected to a Riak KV database.

## Dependencies

```bash
npm install .
```

### Riak

```bash
git clone git@github.com:hectcastro/docker-riak.git
cd docker-riak
make start-cluster
```

### Redis

```bash
docker run --name redis -p 6379:6379 -d redis
```

### Couchbase

```bash
docker run --name couchbase --net=host -d couchbase/server:community
```

## Run

In several tabs:
```bash
# Start the broker
node index.js

## Start the servers
node server.js 1 3
node server.js 2 3
node server.js 3 3
```

## TODO

* Broadcast