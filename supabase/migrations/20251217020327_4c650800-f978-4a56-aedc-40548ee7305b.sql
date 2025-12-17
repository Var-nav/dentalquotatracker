-- Tighten access to protected health information in procedures table

-- Ensure RLS is enabled
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive public policy if it exists
DROP POLICY IF EXISTS "Public read/write procedures" ON public.procedures;

-- Allow students and instructors to view procedures
CREATE POLICY "Students & instructors can view procedures"
ON public.procedures
FOR SELECT
USING (
  public.has_role(auth.uid(), 'student')
  OR public.has_role(auth.uid(), 'instructor')
);

-- Allow students and instructors to insert procedures they create
CREATE POLICY "Students & instructors can insert procedures"
ON public.procedures
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'student')
  OR public.has_role(auth.uid(), 'instructor')
);

-- Allow students and instructors to update procedures
CREATE POLICY "Students & instructors can update procedures"
ON public.procedures
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'student')
  OR public.has_role(auth.uid(), 'instructor')
)
WITH CHECK (
  public.has_role(auth.uid(), 'student')
  OR public.has_role(auth.uid(), 'instructor')
);

-- Allow students and instructors to delete procedures
CREATE POLICY "Students & instructors can delete procedures"
ON public.procedures
FOR DELETE
USING (
  public.has_role(auth.uid(), 'student')
  OR public.has_role(auth.uid(), 'instructor')
);