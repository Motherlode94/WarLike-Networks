ALTER TABLE network_lines ADD COLUMN suspended_at INTEGER;
CREATE TRIGGER network_suspend_calls AFTER UPDATE OF suspended_at ON network_lines WHEN NEW.suspended_at IS NOT NULL BEGIN UPDATE network_calls SET state='ended',expires_at=NEW.suspended_at WHERE (caller=NEW.id OR callee=NEW.id) AND state IN ('ringing','accepted'); END;
