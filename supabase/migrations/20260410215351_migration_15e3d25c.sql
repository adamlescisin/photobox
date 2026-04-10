-- Add expires_at column to events table
ALTER TABLE public.events
  ADD COLUMN expires_at TIMESTAMPTZ;