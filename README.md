# Cluster Messaging

Proof of Concept for a simple messaging system in a cluster.

It uses a simple client/server architecture, and a server to server messaging system using RabbitMQ.

## Dependencies

```bash
pip install --user pika
```

## Run

In several tabs:
```bash
docker run --rm --hostname poc-rabbit --name poc-rabbit -p 5672:5672 rabbitmq

python server.py 10000
python server.py 10001

python client.py 10000
python client.py 10000
python client.py 10001
python client.py 10000
python client.py 10001
python client.py 10001
python client.py 10000
```

The new clients will send messages to clients already present in the network.
