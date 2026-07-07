-- The public share page/PDF route has no admin API access, so it cannot
-- look up another user's auth.users metadata to resolve a display name.
-- Denormalize the name onto shared_pitches at write time (when the owner,
-- who CAN read their own metadata, creates/updates the share) instead.
alter table shared_pitches add column student_name text;

-- Without this, the public share page gets zero rows back even for an
-- enabled share: the existing "stages_owner_all" policy only allows
-- auth.uid() = user_id, and an anonymous visitor has no auth.uid() at all.
-- This adds a second, narrow public-read path: anyone may read a user's
-- stages (all 7, needed to compile the full pitch) IF that user has at
-- least one enabled shared_pitches row. It does not weaken the existing
-- owner-only write/delete policy — this is select-only, additive.
create policy "stages_public_read_when_shared" on stages
  for select using (
    exists (
      select 1
      from shared_pitches sp
      join stages s7 on s7.id = sp.stage_row_id
      where sp.enabled = true and s7.user_id = stages.user_id
    )
  );
