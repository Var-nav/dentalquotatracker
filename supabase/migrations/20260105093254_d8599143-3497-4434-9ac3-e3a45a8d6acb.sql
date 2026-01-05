-- Create whitelist_invites table and RLS policies now that app_role has co-admin
CREATE TABLE IF NOT EXISTS public.whitelist_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  assigned_role public.app_role NOT NULL,
  assigned_batch uuid REFERENCES public.batches(id),
  assigned_department uuid REFERENCES public.departments(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whitelist_invites ENABLE ROW LEVEL SECURITY;

-- Admins can fully manage
CREATE POLICY "Admins manage whitelist_invites"
ON public.whitelist_invites
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Co-admins can insert invites (but not with admin role)
CREATE POLICY "Co-admins can insert invites"
ON public.whitelist_invites
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'co-admin')
  AND assigned_role <> 'admin'
);

-- Any authenticated user can see their own invite (by email)
CREATE POLICY "Users can view their own invite"
ON public.whitelist_invites
FOR SELECT
USING (
  auth.jwt() ->> 'email' = email
);
