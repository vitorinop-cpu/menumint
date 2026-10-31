-- Support Clerk as an auth provider while keeping Supabase as the data store.
-- Profiles created from Clerk sign-ins are keyed by a Clerk user id (text)
-- while keeping the internal uuid primary key used by the rest of the schema.
--
-- Clerk does not use Supabase Auth, so profiles.id must not be forced to
-- reference auth.users; drop that FK so Clerk-created profiles can be inserted.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add column if not exists clerk_user_id text unique;

create index if not exists profiles_clerk_user_id_idx
  on public.profiles (clerk_user_id);

-- Service-role (admin) access is already implied by the service role key;
-- no RLS changes are needed for Clerk mode because authorization is enforced
-- at the application layer.
