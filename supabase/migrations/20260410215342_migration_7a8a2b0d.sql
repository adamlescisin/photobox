-- Add watermark configuration columns to event_styles
ALTER TABLE public.event_styles
  ADD COLUMN watermark_show_name boolean NOT NULL DEFAULT false,
  ADD COLUMN watermark_show_date boolean NOT NULL DEFAULT false,
  ADD COLUMN watermark_show_logo boolean NOT NULL DEFAULT false,
  ADD COLUMN watermark_show_frame boolean NOT NULL DEFAULT false;