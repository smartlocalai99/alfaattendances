create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  complaint text not null check (char_length(trim(complaint)) > 0),
  created_at timestamptz not null default now()
);

alter table public.complaints enable row level security;
create policy "public complaints access" on public.complaints
  for all to anon, authenticated using (true) with check (true);
