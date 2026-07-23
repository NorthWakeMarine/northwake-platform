-- Link service_templates rows to their QuickBooks Item, for two-way sync

ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS qb_item_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS service_templates_qb_item_id_idx
  ON service_templates (qb_item_id) WHERE qb_item_id IS NOT NULL;
