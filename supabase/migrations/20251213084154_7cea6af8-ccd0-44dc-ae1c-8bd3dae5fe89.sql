-- Add metadata fields to batches for year-wise and academic year grouping
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS year_of_study text,
ADD COLUMN IF NOT EXISTS academic_year text,
ADD COLUMN IF NOT EXISTS intake_label text;