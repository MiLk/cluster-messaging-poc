import signal
import SocketServer
import struct
import sys
import time
import threading
from collections import deque
import select
import uuid
from messaging import Messaging
from sessions import SessionStore
import errno

sessions = SessionStore()

server_identity = str(uuid.uuid1())

messaging = Messaging(server_identity)

identities = list()

opcodes = {
    'IDENTITY': 1,
    'MESSAGE': 2,
    'IDENTITIES': 3
}


def rcv_string(connection):
    data = connection.recv(struct.calcsize('L'))
    (size,) = struct.unpack('L', data)
    return connection.recv(size)


def rcv_message(connection):
    data = connection.recv(struct.calcsize('LL'))
    (s_to, s_msg) = struct.unpack('LL', data)
    to = connection.recv(s_to)
    msg = connection.recv(s_msg)
    return (to, msg)


def send_identities(connection):
    identity_list = sessions.list()
    connection.sendall(struct.pack('LL', opcodes['IDENTITIES'], len(identity_list)))
    for identity in identity_list:
        identity_str = identity[0] + '.' + identity[1]
        connection.sendall(struct.pack('L', len(identity_str)))
        connection.sendall(identity_str)


def send_message(connection, msg):
    connection.sendall(struct.pack('LL', opcodes['MESSAGE'], len(msg)))
    connection.sendall(msg)


is_running = True

messages = dict()


class ThreadedTCPRequestHandler(SocketServer.BaseRequestHandler):
    """
    The RequestHandler class for our server.

    It is instantiated once per connection to the server, and must
    override the handle() method to implement communication to the
    client.
    """

    identity = False

    def handle(self):
        global messages
        try:
            while is_running:
                if self.identity:
                    full_identity = server_identity + '.' + self.identity
                    if full_identity in messages:
                        while messages[full_identity]:
                            msg = messages[full_identity].popleft()
                            send_message(self.request, msg)

                ready = select.select([self.request], [], [], 1)
                if not ready[0]:
                    continue

                data = self.request.recv(struct.calcsize('L'))
                if not data:
                    time.sleep(1)
                    continue

                (opcode,) = struct.unpack('L', data)
                if opcode == opcodes['IDENTITY']:
                    self.identity = rcv_string(self.request)
                    print('received identity %s' % self.identity)
                    send_identities(self.request)
                    identities.append(server_identity + '.' + self.identity)
                    sessions.add(server_identity, self.identity)

                if opcode == opcodes['MESSAGE']:
                    (to, msg) = rcv_message(self.request)
                    if to.find(server_identity) == 0:
                        if to not in messages:
                            messages[to] = deque()
                        messages[to].append(msg)
                    else:
                        messaging.send(to, msg)

            print('Close %s' % self.identity)
        except IOError as e:
            if e.errno == errno.EPIPE:
                pass
            else:
                raise e
        finally:
            if self.identity in identities:
                identities.remove(self.identity)
                sessions.delete(self.identity)
            # Clean up the connection
            self.request.close()


class ThreadedTCPServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):
    pass


port = 10000
if sys.argv[1]:
    port = int(sys.argv[1])

server_address = ('localhost', port)
print('starting up on %s port %s' % server_address)
server = ThreadedTCPServer(server_address, ThreadedTCPRequestHandler)

# Start a thread with the server -- that thread will then start one
# more thread for each request
server_thread = threading.Thread(target=server.serve_forever)
# Exit the server thread when the main thread terminates
server_thread.daemon = True
server_thread.start()


def signal_handler(signal, frame):
    global is_running
    print('You pressed Ctrl+C!')
    is_running = False
    sessions.delete_server(server_identity)
    sessions.stop()
    messaging.stop()
    server.shutdown()
    server.server_close()
    sys.exit(0)


signal.signal(signal.SIGINT, signal_handler)


def messaging_callback(exchange, routing_key, body):
    global messages
    print(exchange, routing_key, body)
    if routing_key not in messages:
        messages[routing_key] = deque()
    messages[routing_key].append(body)


messaging.set_callback(messaging_callback)

messaging_thread = threading.Thread(target=messaging.run)
messaging_thread.daemon = True
messaging_thread.start()

print('Press Ctrl+C')
signal.pause()
