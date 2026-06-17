-- Clear migration seed rows and user data before importing a production dump.
SET session_replication_role = replica;

TRUNCATE TABLE
  public.chat_reads,
  public.mention_clears,
  public.match_comments,
  public.chat_messages,
  public.predictions,
  public.profiles,
  public.matches,
  public.app_settings;

TRUNCATE TABLE
  auth.refresh_tokens,
  auth.sessions,
  auth.mfa_amr_claims,
  auth.identities,
  auth.users
CASCADE;

RESET session_replication_role;
