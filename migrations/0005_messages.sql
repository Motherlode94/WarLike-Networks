CREATE TABLE IF NOT EXISTS network_messages(id TEXT PRIMARY KEY,sender INTEGER NOT NULL REFERENCES network_lines(id),recipient INTEGER NOT NULL REFERENCES network_lines(id),body TEXT NOT NULL,created_at INTEGER NOT NULL,read_at INTEGER);
CREATE INDEX IF NOT EXISTS network_messages_sender ON network_messages(sender,created_at);
CREATE INDEX IF NOT EXISTS network_messages_recipient ON network_messages(recipient,created_at);
