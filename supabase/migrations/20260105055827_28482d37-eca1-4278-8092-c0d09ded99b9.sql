-- 1. CREATE PROFILES TABLE for user metadata
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
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

-- 2. UPDATE PROCEDURES TABLE with verification columns
ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS patient_op_number text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_procedures_student_id ON public.procedures(student_id);
CREATE INDEX IF NOT EXISTS idx_procedures_status ON public.procedures(status);

-- Drop existing RLS policies on procedures
DROP POLICY IF EXISTS "Students & instructors can view procedures" ON public.procedures;
DROP POLICY IF EXISTS "Students & instructors can insert procedures" ON public.procedures;
DROP POLICY IF EXISTS "Students & instructors can update procedures" ON public.procedures;
DROP POLICY IF EXISTS "Students & instructors can delete procedures" ON public.procedures;

-- 3. NEW RLS POLICIES for procedures with verification workflow
-- Students can insert their own procedures
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

-- Instructors can update procedure status in their department
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

-- Admins can do everything
CREATE POLICY "Admins can manage all procedures"
  ON public.procedures
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. TRIGGER to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile entry
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add trigger to update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();