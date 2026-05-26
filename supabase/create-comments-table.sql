-- Run this in Supabase Dashboard > SQL Editor.
-- It stores app-written comments for both imported JSON songs (song-001, etc.)
-- and Supabase-created UUID songs.

create extension if not exists pgcrypto;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  song_id text not null,
  user_id text not null references public.users(id),
  user_part text not null default '',
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.comments enable row level security;

do $$
begin
  begin
    alter publication supabase_realtime add table public.comments;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  if not exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'comments'
       and policyname = 'Authenticated users can read comments'
  ) then
    create policy "Authenticated users can read comments"
    on public.comments
    for select
    to authenticated
    using (true);
  end if;

  if not exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'comments'
       and policyname = 'Members can insert own comments'
  ) then
    create policy "Members can insert own comments"
    on public.comments
    for insert
    to authenticated
    with check (
      user_id in (
        select member_id
          from public.member_auth
         where auth_user_id = auth.uid()
           and active = true
      )
    );
  end if;

  if not exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'comments'
       and policyname = 'Members can update own comments'
  ) then
    create policy "Members can update own comments"
    on public.comments
    for update
    to authenticated
    using (
      user_id in (
        select member_id
          from public.member_auth
         where auth_user_id = auth.uid()
           and active = true
      )
    )
    with check (
      user_id in (
        select member_id
          from public.member_auth
         where auth_user_id = auth.uid()
           and active = true
      )
    );
  end if;

  if not exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'comments'
       and policyname = 'Members can delete own comments'
  ) then
    create policy "Members can delete own comments"
    on public.comments
    for delete
    to authenticated
    using (
      user_id in (
        select member_id
          from public.member_auth
         where auth_user_id = auth.uid()
           and active = true
      )
    );
  end if;
end $$;
