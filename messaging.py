import pika


class Messaging():
    def __init__(self, identity):
        self._connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
        self._channel = self._connection.channel()
        self._queue = None
        self._identity = identity

        self._create_exchanges()
        self._create_queue(identity)
        self._setup_consumers()

        self._message_callback = None

    def _create_exchanges(self):
        self._channel.exchange_declare(exchange='broadcast', type='fanout')
        self._channel.exchange_declare(exchange='direct_message', type='topic')

    def _create_queue(self, identity):
        self._queue = self._channel.queue_declare(exclusive=True)
        self._channel.queue_bind(exchange='broadcast', queue=self._queue.method.queue)
        self._channel.queue_bind(exchange='direct_message',
                                 queue=self._queue.method.queue,
                                 routing_key=identity + '.*')

    def set_callback(self, callback):
        self._message_callback = callback

    def _callback(self, ch, method, properties, body):
        # Ignore broadcast sent by this node
        if method.exchange == 'broadcast' and method.routing_key == self._identity:
            return

        if self._message_callback:
            res = self._message_callback(method.exchange, method.routing_key, body)
            if res:
                ch.basic_ack(delivery_tag=method.delivery_tag)
        else:
            print(method, properties)
            print " [x] %r:%r" % (method.routing_key, body)
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
        self._channel.basic_publish(exchange='direct_message',
                                    routing_key=to,
                                    body=message)

    def broadcast(self, message):
        self._channel.basic_publish(exchange='broadcast',
                                    routing_key=self._identity,
                                    body=message)
