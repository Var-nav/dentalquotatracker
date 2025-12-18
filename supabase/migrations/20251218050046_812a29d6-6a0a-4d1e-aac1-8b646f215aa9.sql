-- Add user_id column to batches table if it does not exist and set up RLS for per-user ownership
DO $$
BEGIN
  -- Add user_id column only if it doesn't exist yet
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'batches'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.batches
      ADD COLUMN user_id uuid;
  END IF;
END $$;

-- Enable RLS (safe if already enabled)
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that conflict with per-user ownership model
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'batches'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.batches', pol.policyname);
  END LOOP;
END $$;

-- Policy: authenticated users can select only their own batches
CREATE POLICY "Users can view their own batches"
ON public.batches
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: authenticated users can insert batches they own
CREATE POLICY "Users can create their own batches"
ON public.batches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: allow owners to update their own batches
CREATE POLICY "Users can update their own batches"
ON public.batches
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: allow owners to delete their own batches
CREATE POLICY "Users can delete their own batches"
ON public.batches
FOR DELETE
USING (auth.uid() = user_id);
