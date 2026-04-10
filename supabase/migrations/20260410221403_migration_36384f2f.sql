-- Add the active column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;