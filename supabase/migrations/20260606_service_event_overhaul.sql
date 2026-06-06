-- Add columns to calendar_contact_links for the new New+ event creation flow
ALTER TABLE calendar_contact_links
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'work'
    CHECK (event_type IN ('work', 'sales_meeting', 'generic')),
  ADD COLUMN IF NOT EXISTS color_id TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;

-- Backfill: ensure qty and rate are never null for existing auto-invoice links
UPDATE calendar_contact_links
  SET invoice_qty = 1
  WHERE invoice_qty IS NULL;

UPDATE calendar_contact_links
  SET invoice_rate = invoice_amount
  WHERE invoice_rate IS NULL AND invoice_amount IS NOT NULL;
