-- 1. Create app_role enum for role management (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'student');
  END IF;
END$$;

-- 2. Create batches table (e.g., "H batch")
create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique, -- optional join code like "H2025"
  max_members integer, -- e.g., 12 for a 12-member batch
  created_at timestamptz not null default now()
);

alter table public.batches enable row level security;

-- 3. Create user_roles table as per security guidelines
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- 4. Create user_batches table to link users to batches
create table if not exists public.user_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null references public.batches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, batch_id)
);

alter table public.user_batches enable row level security;

-- 5. Security definer function to check roles (avoids RLS recursion)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- 6. Basic RLS policies
-- Batches: readable by all authenticated users, manageable by admins
create policy "Batches readable to authenticated"
  on public.batches
  for select
  to authenticated
  using (true);

create policy "Admins manage batches"
  on public.batches
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- user_roles: users can read their own roles; admins can manage all
create policy "Users can read their own roles"
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins manage all roles"
  on public.user_roles
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- user_batches: users can see their own batch memberships; admins see/manage all
create policy "Users can read their own batch memberships"
  on public.user_batches
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can join their own batches"
  on public.user_batches
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Admins manage all user_batches"
  on public.user_batches
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
