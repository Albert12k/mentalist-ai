-- Execute este arquivo no Supabase em SQL Editor > New query > Run.
-- Cada tabela usa o id da conta autenticada, e as políticas impedem que uma
-- pessoa leia ou altere os dados de outra pessoa.

create table if not exists public.mentalis_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.mentalis_profiles enable row level security;

drop policy if exists "profile owner access" on public.mentalis_profiles;
create policy "profile owner access" on public.mentalis_profiles
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create table if not exists public.mentalis_study_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  subjects jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.mentalis_study_data enable row level security;

drop policy if exists "study data owner access" on public.mentalis_study_data;
create policy "study data owner access" on public.mentalis_study_data
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
