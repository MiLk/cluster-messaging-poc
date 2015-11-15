import pika
from collections import deque

class Messaging():
    def __init__(self, identity):
        self._connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
        self._channel = self._connection.channel()
        self._queue = None
        self._identity = identity

        self._create_exchanges()
        self._create_queue(identity)
        self._setup_consumers()

        self._messages = dict()

    def _create_exchanges(self):
        self._channel.exchange_declare(exchange='broadcast', type='fanout')
        self._channel.exchange_declare(exchange='direct_message', type='topic')

    def _create_queue(self, identity):
        self._queue = self._channel.queue_declare(exclusive=True)
        self._channel.queue_bind(exchange='broadcast', queue=self._queue.method.queue)
        self._channel.queue_bind(exchange='direct_message',
                                 queue=self._queue.method.queue,
                                 routing_key=identity + '.*')

    def _callback(self, ch, method, properties, body):
        # Ignore broadcast sent by this node
        if method.exchange == 'broadcast' and method.routing_key == self._identity:
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return True

        # Ignore broadcast for now
        if method.exchange == 'broadcast':
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return True

        self.send(method.routing_key, body)
        ch.basic_ack(delivery_tag=method.delivery_tag)

    def _setup_consumers(self):
        self._channel.basic_consume(self._callback,
                                    queue=self._queue.method.queue)

    def run(self):
        self._channel.start_consuming()

    def stop(self):
        print('Stop messaging process')
        self._channel.stop_consuming()
        self._connection.close()

    def send(self, to, message):
        if to.find(self._identity) == 0:
            if to not in self._messages:
                self._messages[to] = deque()
            self._messages[to].append(message)
        else:
            self._channel.basic_publish(exchange='direct_message',
                                        routing_key=to,
                                        body=message)

    def broadcast(self, message):
        self._channel.basic_publish(exchange='broadcast',
                                    routing_key=self._identity,
                                    body=message)

    def has_message_for(self, to):
        if to in self._messages:
            return True
        return False

    def messages_for(self, to):
        if not self.has_message_for(to):
            return None
        return self._messages[to]
