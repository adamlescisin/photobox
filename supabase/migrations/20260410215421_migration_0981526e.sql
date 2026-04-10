-- Add remove_background column to event_styles
ALTER TABLE public.event_styles
  ADD COLUMN IF NOT EXISTS remove_background boolean NOT NULL DEFAULT false;