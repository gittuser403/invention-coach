-- Invention Coach: initial schema
-- Architecture per /plan-eng-review (see ~/.gstack/projects/NextMinds/anura-unknown-design-20260705-143144.md)

-- One row per (user, stage). Status enum drives the dashboard's "Stage X of 7"
-- indicator without ever joining messages (keeps that query cheap regardless
-- of how long a student's conversation history gets).
create type stage_status as enum ('not_started', 'in_progress', 'complete');

create table stages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stage_number smallint not null check (stage_number between 1 and 7),
  status stage_status not null default 'not_started',
  artifact jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, stage_number)
);

create index stages_user_id_idx on stages(user_id);

-- One row per chat turn. Kept separate from `stages` so the dashboard never
-- has to touch this table.
create table messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stage_number smallint not null check (stage_number between 1 and 7),
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  -- true while a streamed assistant reply is still being incrementally
  -- flushed; flips to false once streamText()'s onFinish fires. Lets a
  -- mid-stream drop leave a recoverable partial row instead of losing the
  -- turn outright.
  streaming boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_user_stage_idx on messages(user_id, stage_number, created_at);

-- Kept as its own table (not columns on `stages`) so the public, no-auth
-- read path never shares an RLS policy surface with private student data.
create table shared_pitches (
  id uuid primary key default gen_random_uuid(),
  stage_row_id uuid not null references stages(id) on delete cascade,
  share_slug uuid not null default gen_random_uuid() unique,
  show_name boolean not null default false,
  created_at timestamptz not null default now(),
  enabled boolean not null default true
);

create index shared_pitches_slug_idx on shared_pitches(share_slug);

alter table stages enable row level security;
alter table messages enable row level security;
alter table shared_pitches enable row level security;

-- Students can only ever see/touch their own rows. This holds even if an
-- application-layer bug forgets to filter by user_id.
create policy "stages_owner_all" on stages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "messages_owner_all" on messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Owners can manage their own share rows...
create policy "shared_pitches_owner_all" on shared_pitches
  for all using (
    auth.uid() = (select user_id from stages where stages.id = shared_pitches.stage_row_id)
  ) with check (
    auth.uid() = (select user_id from stages where stages.id = shared_pitches.stage_row_id)
  );

-- ...and anyone (no auth) can read an enabled share by its slug. This is the
-- one deliberately public read path in the schema.
create policy "shared_pitches_public_read" on shared_pitches
  for select using (enabled = true);
