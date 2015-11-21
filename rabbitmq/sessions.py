import sqlite3


class SessionStore():
    def __init__(self):
        self._connection = None
        self._create_table()

    def _connect(self):
        if not self._connection:
            self._connection = sqlite3.connect('sessions.db')

    def _close(self):
        if not self._connection:
            return
        self._connection.close()
        self._connection = None

    def _create_table(self):
        self._connect()
        self._connection.execute('''
        CREATE TABLE IF NOT EXISTS sessions
        (server_uuid, client_uuid)
        ''')
        self._connection.commit()
        self._close()

    def delete(self, client, commit=True):
        self._connect()
        self._connection.execute("DELETE FROM sessions WHERE client_uuid = ?", (client,))
        if commit:
            self._connection.commit()

    def delete_server(self, server):
        self._connect()
        self._connection.execute("DELETE FROM sessions WHERE server_uuid = ?", (server,))

    def add(self, server, client):
        self._connect()
        self.delete(client, commit=False)
        self._connection.execute("INSERT INTO sessions VALUES (?,?)", (server, client))
        self._connection.commit()
        self._close()

    def list(self):
        self._connect()
        c = self._connection.cursor()
        c.execute("SELECT server_uuid, client_uuid FROM sessions")
        res = c.fetchall()
        self._close()
        return res

    def stop(self):
        self._close()
