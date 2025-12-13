-- Clinical quota tables

-- Table for individual procedures / cases
create table if not exists public.procedures (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  procedure_type text not null,
  procedure_date date not null,
  supervisor_name text not null,
  created_at timestamptz not null default now()
);

-- Table for quota targets per procedure category
create table if not exists public.quota_targets (
  id uuid primary key default gen_random_uuid(),
  procedure_type text not null unique,
  target integer not null default 1,
  updated_at timestamptz not null default now()
);

-- Note: RLS is not enabled so this dashboard can be used without authentication.
-- If you later add login, we can add user_id columns and RLS policies to scope data per user.