-- Fixes Postgres error 42P17 "infinite recursion detected in policy for
-- relation stages", introduced by 0002's stages_public_read_when_shared
-- policy: its USING clause queried `stages` again (via the s7 join) from
-- inside a policy defined ON stages, which Postgres evaluates recursively
-- since RLS applies to every reference to the table, including a self-join
-- inside another policy's own subquery. This broke ALL access to stages
-- (owner reads/writes too), not just the public-sharing path.
--
-- Standard fix: a SECURITY DEFINER function runs with the privileges of
-- its owner, which bypasses RLS for the queries it runs internally —
-- breaking the circular policy evaluation.
drop policy if exists "stages_public_read_when_shared" on stages;

create or replace function public.user_has_enabled_share(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from shared_pitches sp
    join stages s7 on s7.id = sp.stage_row_id
    where sp.enabled = true and s7.user_id = check_user_id
  );
$$;

create policy "stages_public_read_when_shared" on stages
  for select using (
    public.user_has_enabled_share(stages.user_id)
  );
