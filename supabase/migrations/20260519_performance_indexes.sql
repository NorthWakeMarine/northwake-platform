-- Performance indexes for frequent query patterns
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_qb_customer_id ON contacts(qb_customer_id);
CREATE INDEX IF NOT EXISTS idx_contacts_pipeline_stage ON contacts(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_timeline_events_contact_event ON timeline_events(contact_id, event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_events_created_at ON timeline_events(created_at);
CREATE INDEX IF NOT EXISTS idx_vessels_owner_id ON vessels(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
