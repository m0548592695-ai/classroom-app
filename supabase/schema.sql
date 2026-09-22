-- Run this entire file in Supabase -> SQL Editor.
-- This schema is intentionally simple for a small classroom app.

create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_name text not null,
  file_type text not null,
  file_url text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id text not null check (student_id in ('yanai','shilo','david','par','lavi')),
  task_id uuid not null references public.tasks(id) on delete cascade,
  task_title text not null,
  image_url text not null,
  storage_path text not null,
  submitted_at timestamptz not null default now(),
  unique(student_id, task_id)
);

create index if not exists submissions_student_id_idx on public.submissions(student_id);
create index if not exists submissions_task_id_idx on public.submissions(task_id);

-- Public read/write policies are suitable only for this small prototype/classroom.
-- Do NOT treat the teacher PIN as real authentication.
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "public read tasks" on public.tasks;
drop policy if exists "public insert tasks" on public.tasks;
drop policy if exists "public delete tasks" on public.tasks;

create policy "public read tasks"
on public.tasks for select
to anon, authenticated
using (true);

create policy "public insert tasks"
on public.tasks for insert
to anon, authenticated
with check (true);

create policy "public delete tasks"
on public.tasks for delete
to anon, authenticated
using (true);

drop policy if exists "public read submissions" on public.submissions;
drop policy if exists "public insert submissions" on public.submissions;
drop policy if exists "public delete submissions" on public.submissions;

create policy "public read submissions"
on public.submissions for select
to anon, authenticated
using (true);

create policy "public insert submissions"
on public.submissions for insert
to anon, authenticated
with check (true);

create policy "public delete submissions"
on public.submissions for delete
to anon, authenticated
using (true);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('classroom-files', 'classroom-files', true)
on conflict (id) do update set public = true;

drop policy if exists "public classroom storage read" on storage.objects;
drop policy if exists "public classroom storage insert" on storage.objects;
drop policy if exists "public classroom storage delete" on storage.objects;

create policy "public classroom storage read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'classroom-files');

create policy "public classroom storage insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'classroom-files');

create policy "public classroom storage delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'classroom-files');
