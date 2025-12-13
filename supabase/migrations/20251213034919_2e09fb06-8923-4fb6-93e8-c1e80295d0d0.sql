-- Enable RLS with permissive policies so the dashboard works without authentication.

alter table public.procedures enable row level security;
drop policy if exists "Public read/write procedures" on public.procedures;
create policy "Public read/write procedures" on public.procedures
  for all
  using (true)
  with check (true);

alter table public.quota_targets enable row level security;
drop policy if exists "Public read/write quota targets" on public.quota_targets;
create policy "Public read/write quota targets" on public.quota_targets
  for all
  using (true)
  with check (true);
