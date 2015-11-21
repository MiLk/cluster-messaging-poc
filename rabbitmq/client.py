import socket
import struct
import uuid
import time
import signal
import sys

is_running = True


def signal_handler(signal, frame):
    global is_running
    print('You pressed Ctrl+C!')
    is_running = False
    sys.exit(0)


signal.signal(signal.SIGINT, signal_handler)

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

port = 10000
if sys.argv[1]:
    port = int(sys.argv[1])

server_address = ('localhost', port)
print('connecting to %s port %s' % server_address)
sock.connect(server_address)

opcodes = {
    'IDENTITY': 1,
    'MESSAGE': 2,
    'IDENTITIES': 3
}


def rcv_string():
    data = sock.recv(struct.calcsize('L'))
    (size,) = struct.unpack('L', data)
    return sock.recv(size)


def send_identity(identity):
    print('sending identity "%s"' % identity)
    sock.sendall(struct.pack('LL', opcodes['IDENTITY'], len(identity)))
    sock.sendall(identity)


def send_message(to, message):
    print('sending "%s" to %s' % (message, to))
    sock.sendall(struct.pack('LLL', opcodes['MESSAGE'], len(to), len(message)))
    sock.sendall(to)
    sock.sendall(message)


clients = list()

try:
    identity = str(uuid.uuid1())
    send_identity(identity)

    while is_running:
        data = sock.recv(struct.calcsize('L'))
        if not data:
            time.sleep(1)
            continue

        (opcode,) = struct.unpack('L', data)

        if opcode == opcodes['IDENTITIES']:
            clients = list()
            data = sock.recv(struct.calcsize('L'))
            (size,) = struct.unpack('L', data)
            print('Number of identities', size)
            for i in xrange(size):
                cid = rcv_string()
                clients.append(cid)

            for c in clients:
                send_message(c, 'Hello from %s' % identity)

        if opcode == opcodes['MESSAGE']:
            s = rcv_string()
            print('Received "%s"' % s)

        time.sleep(1)
finally:
    print('closing socket')
    sock.close()
