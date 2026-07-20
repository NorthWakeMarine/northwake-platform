-- Per-event toggle for the automatic customer text reminder (recurring and one-off)

ALTER TABLE calendar_contact_links
  ADD COLUMN IF NOT EXISTS sms_reminder_enabled BOOLEAN DEFAULT true;
