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

-- Storage privado para fotos, PDFs e áudios. Os arquivos ficam na pasta do
-- usuário e nunca podem ser vistos por outra conta.
insert into storage.buckets (id, name, public, file_size_limit)
values ('mentalis-files', 'mentalis-files', false, 26214400)
on conflict (id) do nothing;

drop policy if exists "mentalis files select own" on storage.objects;
create policy "mentalis files select own" on storage.objects
  for select to authenticated
  using (bucket_id = 'mentalis-files' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "mentalis files insert own" on storage.objects;
create policy "mentalis files insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'mentalis-files' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "mentalis files update own" on storage.objects;
create policy "mentalis files update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'mentalis-files' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'mentalis-files' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "mentalis files delete own" on storage.objects;
create policy "mentalis files delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'mentalis-files' and (storage.foldername(name))[1] = (select auth.uid()::text));
