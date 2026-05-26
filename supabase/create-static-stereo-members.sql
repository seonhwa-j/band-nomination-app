-- Run this in Supabase Dashboard > SQL Editor.
-- It creates/updates the Static Stereo member login accounts without sending auth emails.
-- Temporary password for every account: ss2026

create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key,
  username text not null,
  role text not null,
  profile_picture text
);

create table if not exists public.member_auth (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  member_id text not null unique references public.users(id),
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.member_auth enable row level security;

do $$
begin
  if not exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'users'
       and policyname = 'Authenticated users can read users'
  ) then
    create policy "Authenticated users can read users"
    on public.users
    for select
    to authenticated
    using (true);
  end if;

  if not exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'member_auth'
       and policyname = 'Members can read their own auth mapping'
  ) then
    create policy "Members can read their own auth mapping"
    on public.member_auth
    for select
    to authenticated
    using (auth_user_id = auth.uid());
  end if;
end $$;

do $$
declare
  member record;
  v_auth_user_id uuid;
begin
  for member in
    select *
    from (
      values
        ('myomyo@staticstereo.com', 'vocal', '묘묘', 'Vocal', '묘묘'),
        ('jeje@staticstereo.com', 'drum', '제제', 'Drum', '제제'),
        ('sambe@staticstereo.com', 'bass', '삼베', 'Bass', '삼베'),
        ('angma@staticstereo.com', 'devil', '앙마', 'Guitar 1', '앙마'),
        ('sany@staticstereo.com', 'sunny', '사니', 'Guitar 2', '사니'),
        ('seul@staticstereo.com', 'keyboard', '슬이', 'Keyboard', '슬이'),
        ('lilac@staticstereo.com', 'chorus', '라일락', 'Keyboard + Chorus', '일락')
    ) as m(email, member_id, username, role, profile_picture)
  loop
    select id
      into v_auth_user_id
      from auth.users
     where lower(email) = lower(member.email)
     limit 1;

    if v_auth_user_id is null then
      insert into auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      )
      values (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        member.email,
        crypt('ss2026', gen_salt('bf')),
        now(),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        jsonb_build_object('member_id', member.member_id, 'part', member.member_id),
        now(),
        now(),
        '',
        '',
        '',
        ''
      )
      returning id into v_auth_user_id;
    else
      update auth.users
         set encrypted_password = crypt('ss2026', gen_salt('bf')),
             email_confirmed_at = coalesce(email_confirmed_at, now()),
             raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', array['email']),
             raw_user_meta_data = jsonb_build_object('member_id', member.member_id, 'part', member.member_id),
             updated_at = now()
       where id = v_auth_user_id;
    end if;

    update auth.identities
       set user_id = v_auth_user_id,
           identity_data = jsonb_build_object(
             'sub', v_auth_user_id::text,
             'email', member.email,
             'email_verified', true,
             'phone_verified', false
           ),
           updated_at = now()
     where provider = 'email'
       and provider_id = member.email;

    if not found then
      insert into auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      )
      values (
        gen_random_uuid(),
        v_auth_user_id,
        member.email,
        jsonb_build_object(
          'sub', v_auth_user_id::text,
          'email', member.email,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        now(),
        now(),
        now()
      );
    end if;

    insert into public.users (id, username, role, profile_picture)
    values (member.member_id, member.username, member.role, member.profile_picture)
    on conflict (id) do update
      set username = excluded.username,
          role = excluded.role,
          profile_picture = excluded.profile_picture;

    delete from public.member_auth
     where auth_user_id = v_auth_user_id
        or member_id = member.member_id
        or lower(email) = lower(member.email);

    insert into public.member_auth (auth_user_id, member_id, email, active)
    values (v_auth_user_id, member.member_id, member.email, true);
  end loop;
end $$;
