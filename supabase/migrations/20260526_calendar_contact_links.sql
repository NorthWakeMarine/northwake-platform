CREATE TABLE IF NOT EXISTS calendar_contact_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gcal_event_id TEXT NOT NULL UNIQUE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ccl_contact ON calendar_contact_links(contact_id);
