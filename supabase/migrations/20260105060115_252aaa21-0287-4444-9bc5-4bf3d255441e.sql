-- 1. MODIFY PROCEDURES TABLE
-- Make patient_name nullable for privacy
ALTER TABLE public.procedures
  ALTER COLUMN patient_name DROP NOT NULL;

-- Add verification workflow columns (if they don't exist)
DO $$ 
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'procedures' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.procedures
      ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected'));
  END IF;

  -- Add student_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'procedures' AND column_name = 'student_id'
  ) THEN
    ALTER TABLE public.procedures
      ADD COLUMN student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add rejection_reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'procedures' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.procedures
      ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_procedures_student_id ON public.procedures(student_id);
CREATE INDEX IF NOT EXISTS idx_procedures_status ON public.procedures(status);

-- 2. CREATE PROFILES TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Instructors can view all profiles" ON public.profiles;

-- Create profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Instructors can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'instructor'));

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. UPDATE RLS POLICIES for simplified data entry
-- Drop existing policies on procedures
DROP POLICY IF EXISTS "Students can insert their own procedures" ON public.procedures;
DROP POLICY IF EXISTS "Students can view their own procedures" ON public.procedures;
DROP POLICY IF EXISTS "Students can update their own pending procedures" ON public.procedures;
DROP POLICY IF EXISTS "Students can delete their own pending procedures" ON public.procedures;
DROP POLICY IF EXISTS "Instructors can view procedures in their department" ON public.procedures;
DROP POLICY IF EXISTS "Instructors can update procedure status in their department" ON public.procedures;
DROP POLICY IF EXISTS "Admins can manage all procedures" ON public.procedures;

-- Students can insert procedures without patient_name
CREATE POLICY "Students can insert their own procedures"
  ON public.procedures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'student') 
    AND student_id = auth.uid()
  );

-- Students can view only their own procedures
CREATE POLICY "Students can view their own procedures"
  ON public.procedures
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'student')
    AND student_id = auth.uid()
  );

-- Students can update their own pending procedures
CREATE POLICY "Students can update their own pending procedures"
  ON public.procedures
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'student')
    AND student_id = auth.uid()
    AND status = 'pending'
  );

-- Students can delete their own pending procedures
CREATE POLICY "Students can delete their own pending procedures"
  ON public.procedures
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'student')
    AND student_id = auth.uid()
    AND status = 'pending'
  );

-- Instructors can view procedures in their department
CREATE POLICY "Instructors can view procedures in their department"
  ON public.procedures
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'instructor')
    AND department_id IN (
      SELECT department_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Instructors can update procedure status (verify/reject) in their department
CREATE POLICY "Instructors can update procedure status in their department"
  ON public.procedures
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'instructor')
    AND department_id IN (
      SELECT department_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'instructor')
    AND department_id IN (
      SELECT department_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Admins can manage all procedures
CREATE POLICY "Admins can manage all procedures"
  ON public.procedures
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();