ALTER TABLE network_push_subscriptions ADD COLUMN session_hash TEXT;
ALTER TABLE network_push_subscriptions ADD COLUMN session_until INTEGER;
CREATE INDEX network_push_session ON network_push_subscriptions(session_hash);
