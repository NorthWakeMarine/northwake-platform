-- Tracks customers about to get their automatic appointment reminder text,
-- so staff can reply "No <Name>" to the internal warning text to skip one.

CREATE TABLE IF NOT EXISTS reminder_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  gcal_event_id TEXT NOT NULL,
  contact_name TEXT,
  target_date DATE NOT NULL,
  skipped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS reminder_pending_event_idx ON reminder_pending (gcal_event_id);
