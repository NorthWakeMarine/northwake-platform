-- Drop the old constraint that was missing 'paid' as a valid stage
ALTER TABLE contacts
  DROP CONSTRAINT IF EXISTS contacts_pipeline_stage_check;

-- Re-add with all valid stages including 'paid'
ALTER TABLE contacts
  ADD CONSTRAINT contacts_pipeline_stage_check
  CHECK (pipeline_stage IN (
    'new_leads',
    'discovery',
    'estimate_sent',
    'needs_attention',
    'work_scheduled',
    'done_invoiced',
    'paid',
    'lost'
  ));
