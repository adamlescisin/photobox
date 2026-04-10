-- Update events_public view to include expires_at
DROP VIEW IF EXISTS public.events_public;
CREATE VIEW public.events_public AS
SELECT
  id,
  name,
  slug,
  date,
  description,
  expires_at,
  created_at,
  updated_at,
  (password_hash IS NOT NULL) AS is_password_protected
FROM public.events;