-- Security hardening: fix three linter warnings
-- Run in Supabase SQL editor

-- 1. Revoke public execute on rls_auto_enable (SECURITY DEFINER utility function,
--    should not be callable via REST API by anon or authenticated)
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;

-- 2. Fix mutable search_path on update_contact_last_contact
--    Must use CREATE OR REPLACE with schema-qualified table reference,
--    not ALTER FUNCTION, because the function body references contacts without schema prefix
CREATE OR REPLACE FUNCTION public.update_contact_last_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.contacts SET last_contact_at = NEW.created_at WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$;

-- 3. Drop the unused anon INSERT policy on timeline_events
--    All timeline writes go through server actions using the service role key.
--    No client-side anon code ever writes directly to this table.
DROP POLICY IF EXISTS "anon insert timeline" ON public.timeline_events;
