CREATE TABLE IF NOT EXISTS service_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_label TEXT NOT NULL,
  default_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE calendar_contact_links
  ADD COLUMN IF NOT EXISTS service_template_id UUID REFERENCES service_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_label TEXT,
  ADD COLUMN IF NOT EXISTS invoice_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS auto_invoice BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ccl_auto_invoice ON calendar_contact_links(auto_invoice) WHERE auto_invoice = true;
