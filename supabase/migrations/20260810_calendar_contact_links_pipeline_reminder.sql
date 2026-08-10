ALTER TABLE calendar_contact_links
  DROP CONSTRAINT IF EXISTS calendar_contact_links_event_type_check;

ALTER TABLE calendar_contact_links
  ADD CONSTRAINT calendar_contact_links_event_type_check
    CHECK (event_type IN ('work', 'sales_meeting', 'generic', 'pipeline_reminder'));
