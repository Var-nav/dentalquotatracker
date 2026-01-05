-- Extend app_role enum to include co-admin (must be in its own migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'co-admin'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'co-admin';
  END IF;
END $$;