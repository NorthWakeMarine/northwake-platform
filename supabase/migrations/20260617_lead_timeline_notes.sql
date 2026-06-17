-- Allow timeline_events to be associated with a lead (not just a contact)
alter table timeline_events
  add column if not exists lead_id uuid references leads(id) on delete set null;

create index if not exists timeline_events_lead_id_idx on timeline_events (lead_id);

-- Index for orphan recovery by phone/email stored in metadata
create index if not exists timeline_events_lead_phone_idx
  on timeline_events ((metadata->>'lead_phone'))
  where contact_id is null and lead_id is null;
