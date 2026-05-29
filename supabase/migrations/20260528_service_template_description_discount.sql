ALTER TABLE service_templates
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE calendar_contact_links
  ADD COLUMN IF NOT EXISTS invoice_discount NUMERIC(10,2);
