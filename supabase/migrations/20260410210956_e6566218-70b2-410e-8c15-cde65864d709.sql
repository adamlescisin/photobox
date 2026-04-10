ALTER TABLE public.event_styles
  ADD COLUMN watermark_font text NOT NULL DEFAULT 'Space Grotesk',
  ADD COLUMN watermark_font_color text NOT NULL DEFAULT '0 0% 100%',
  ADD COLUMN watermark_font_size numeric NOT NULL DEFAULT 1.0,
  ADD COLUMN watermark_logo_size numeric NOT NULL DEFAULT 1.0,
  ADD COLUMN watermark_border_color text NOT NULL DEFAULT '0 0% 100%',
  ADD COLUMN watermark_border_size numeric NOT NULL DEFAULT 1.0,
  ADD COLUMN watermark_text_offset_x numeric NOT NULL DEFAULT 1.0,
  ADD COLUMN watermark_text_offset_y numeric NOT NULL DEFAULT 1.0;