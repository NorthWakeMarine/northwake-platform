-- Add billing_frequency, invoice_qty, invoice_rate to calendar_contact_links

ALTER TABLE calendar_contact_links
  ADD COLUMN IF NOT EXISTS billing_frequency TEXT DEFAULT 'monthly'
    CHECK (billing_frequency IN ('off', 'monthly', 'twice_monthly', 'every_6_weeks')),
  ADD COLUMN IF NOT EXISTS invoice_qty NUMERIC(10,2) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS invoice_rate NUMERIC(10,2);

-- Backfill: links with auto_invoice=false get 'off' frequency
UPDATE calendar_contact_links
  SET billing_frequency = 'off'
  WHERE auto_invoice = false;

-- Backfill: links with auto_invoice=true get rate = invoice_amount (qty=1)
UPDATE calendar_contact_links
  SET invoice_rate = invoice_amount,
      invoice_qty  = 1
  WHERE auto_invoice = true
    AND invoice_amount IS NOT NULL
    AND invoice_rate IS NULL;
