# Cluster Messaging

Proof of Concept for a simple messaging system in a cluster.

Implement a server to server messaging system using a Node.js broker connected to a Riak KV database.

## Dependencies

```bash
npm install .
```

```bash
git clone git@github.com:hectcastro/docker-riak.git
cd docker-riak
make start-cluster
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