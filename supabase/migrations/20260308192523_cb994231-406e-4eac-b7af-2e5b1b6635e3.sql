ALTER TABLE public.events ADD COLUMN active boolean NOT NULL DEFAULT true;

DROP VIEW IF EXISTS public.events_public;
CREATE VIEW public.events_public AS
SELECT
  id,
  name,
  slug,
  date,
  description,
  expires_at,
  active,
  created_at,
  updated_at,
  (password_hash IS NOT NULL) AS is_password_protected
FROM public.events;